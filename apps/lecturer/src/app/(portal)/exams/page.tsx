'use client';

import {
  CheckSquare,
  Clock,
  GraduationCap,
  ListChecks,
  Lock,
  Plus,
  Shuffle,
  Square,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import {
  lecturerApi,
  type AllocatedCourse,
  type CbtQuestion,
  type ExamAttemptRecord,
  type ExamRecord,
  type ExamStatus,
  type QuestionBank,
} from '@/lib/api';
import { cn } from '@/lib/cn';

const statusStyles: Record<ExamRecord['status'], string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  SCHEDULED: 'bg-sky-100 text-sky-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-600',
  ARCHIVED: 'bg-slate-100 text-slate-400',
};

const statusLabels: Record<ExamRecord['status'], string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Live',
  CLOSED: 'Completed',
  ARCHIVED: 'Archived',
};

const attemptStyles: Record<ExamAttemptRecord['status'], string> = {
  IN_PROGRESS: 'bg-sky-100 text-sky-700',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  GRADED: 'bg-emerald-100 text-emerald-700',
  ABANDONED: 'bg-red-100 text-red-700',
};

function formatWhen(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [courses, setCourses] = useState<AllocatedCourse[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  // Create-exam form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [duration, setDuration] = useState(60);
  const [passMark, setPassMark] = useState(40);
  const [instructions, setInstructions] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [shuffle, setShuffle] = useState(true);
  const [browserLock, setBrowserLock] = useState(false);

  // Add-questions modal state
  const [addFor, setAddFor] = useState<ExamRecord | null>(null);
  const [bankId, setBankId] = useState('');
  const [bankQuestions, setBankQuestions] = useState<CbtQuestion[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  // Attempts panel state
  const [attemptsFor, setAttemptsFor] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, ExamAttemptRecord[]>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const [examList, courseList, bankList] = await Promise.all([
        lecturerApi.exams(),
        lecturerApi.courses(),
        lecturerApi.questionBanks(),
      ]);
      setExams(examList);
      setCourses(courseList);
      setBanks(bankList);
      if (!courseId && courseList.length > 0) setCourseId(courseList[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load questions whenever the selected bank changes in the add-questions modal.
  useEffect(() => {
    if (!addFor || !bankId) {
      setBankQuestions([]);
      return;
    }
    let cancelled = false;
    lecturerApi
      .bankQuestions(bankId)
      .then((qs) => {
        if (!cancelled) setBankQuestions(qs);
      })
      .catch(() => {
        if (!cancelled) setBankQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [addFor, bankId]);

  function resetForm() {
    setTitle('');
    setDuration(60);
    setPassMark(40);
    setInstructions('');
    setStartsAt('');
    setShuffle(true);
    setBrowserLock(false);
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy('create');
    try {
      await lecturerApi.createExam({
        title,
        courseId: courseId || undefined,
        durationMins: duration,
        passMark,
        instructions: instructions.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        shuffleQuestions: shuffle,
        lockBrowser: browserLock,
      });
      setCreateOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam');
    } finally {
      setBusy(null);
    }
  }

  async function handleStatus(exam: ExamRecord, status: ExamStatus) {
    setBusy(exam.id);
    try {
      await lecturerApi.setExamStatus(exam.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exam');
    } finally {
      setBusy(null);
    }
  }

  function openAddQuestions(exam: ExamRecord) {
    setAddFor(exam);
    setBankId(banks[0]?.id ?? '');
    setSelected([]);
  }

  function toggleQuestion(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id],
    );
  }

  async function handleAddQuestions(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!addFor || selected.length === 0) return;
    setBusy('add-questions');
    try {
      await lecturerApi.addExamQuestions(addFor.id, selected);
      setAddFor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add questions');
    } finally {
      setBusy(null);
    }
  }

  async function toggleAttempts(examId: string) {
    if (attemptsFor === examId) {
      setAttemptsFor(null);
      return;
    }
    setAttemptsFor(examId);
    if (!attempts[examId]) {
      try {
        const list = await lecturerApi.examAttempts(examId);
        setAttempts((prev) => ({ ...prev, [examId]: list }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attempts');
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Exams"
        subtitle="Schedule and manage CBT examinations for your courses."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Create Exam
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="py-16 text-center text-sm text-slate-400">Loading exams…</Card>
      ) : exams.length === 0 ? (
        <Card className="py-16 text-center text-sm text-slate-400">
          No exams yet. Create your first exam to get started.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {exams.map((exam) => {
            const when = formatWhen(exam.startsAt);
            const isBusy = busy === exam.id;
            return (
              <Card key={exam.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{exam.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {exam.course?.code ?? 'No course'}
                        {when ? ` · ${when}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      statusStyles[exam.status],
                    )}
                  >
                    {statusLabels[exam.status]}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" /> Duration
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {exam.durationMins} mins
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Questions</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {exam._count.questions}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" /> Attempts
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {exam._count.attempts}
                    </p>
                  </div>
                </div>

                {/* Settings preview */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      exam.shuffleQuestions
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Shuffle className="h-3 w-3" />
                    Shuffle {exam.shuffleQuestions ? 'on' : 'off'}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      exam.lockBrowser
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Lock className="h-3 w-3" />
                    Browser lock {exam.lockBrowser ? 'on' : 'off'}
                  </span>
                  <span className="ml-auto text-[11px] text-slate-400">
                    Pass mark {exam.passMark}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(exam.status === 'DRAFT' || exam.status === 'SCHEDULED') && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(exam, 'ACTIVE')}
                        className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                      >
                        {exam.status === 'DRAFT' ? 'Publish' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddQuestions(exam)}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Questions
                      </button>
                    </>
                  )}
                  {exam.status === 'ACTIVE' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatus(exam, 'CLOSED')}
                      className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                    >
                      Close Exam
                    </button>
                  )}
                  {exam.status === 'CLOSED' && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(exam, 'ACTIVE')}
                        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                      >
                        Reopen
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(exam, 'ARCHIVED')}
                        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                      >
                        Archive
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleAttempts(exam.id)}
                    className={cn(
                      'ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors',
                      attemptsFor === exam.id
                        ? 'text-brand'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    {attemptsFor === exam.id ? 'Hide attempts' : 'View attempts'}
                  </button>
                </div>

                {/* Attempts panel */}
                {attemptsFor === exam.id && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60">
                    {!attempts[exam.id] ? (
                      <p className="px-4 py-4 text-xs text-slate-400">Loading attempts…</p>
                    ) : attempts[exam.id].length === 0 ? (
                      <p className="px-4 py-4 text-xs text-slate-400">
                        No attempts recorded yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {attempts[exam.id].map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {a.student.firstName} {a.student.lastName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {a.student.matricNumber ?? '—'} ·{' '}
                                {formatWhen(a.startedAt) ?? '—'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-700">
                                {Number(a.score)} marks
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  attemptStyles[a.status],
                                )}
                              >
                                {a.status.replace('_', ' ')}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create exam modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Create Exam</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Exam Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CSC 101 Mid-Semester Test"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="input"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Duration (mins)</label>
                  <input
                    type="number"
                    min={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Pass Mark</label>
                  <input
                    type="number"
                    min={0}
                    value={passMark}
                    onChange={(e) => setPassMark(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Instructions (optional)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="Shown to students before they begin…"
                  className="input resize-none"
                />
              </div>

              {/* Settings toggles */}
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      Shuffle questions
                    </span>
                    <span className="text-xs text-slate-500">
                      Randomise question order per student
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={shuffle}
                    onChange={(e) => setShuffle(e.target.checked)}
                    className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors checked:bg-brand"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      Browser lock
                    </span>
                    <span className="text-xs text-slate-500">
                      Prevent tab switching during the exam
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={browserLock}
                    onChange={(e) => setBrowserLock(e.target.checked)}
                    className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors checked:bg-brand"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={busy === 'create'} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  {busy === 'create' ? 'Creating…' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add questions modal */}
      {addFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Add Questions</h3>
                <p className="mt-0.5 text-xs text-slate-500">{addFor.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddFor(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestions} className="space-y-4 px-6 py-5">
              {banks.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  No question banks yet. Add questions in the CBT Question Bank page first.
                </p>
              ) : (
                <>
                  <div>
                    <label className="label">Question Bank</label>
                    <select
                      value={bankId}
                      onChange={(e) => {
                        setBankId(e.target.value);
                        setSelected([]);
                      }}
                      className="input"
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b._count.questions} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-3">
                    {bankQuestions.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        No questions in this bank.
                      </p>
                    ) : (
                      bankQuestions.map((q) => {
                        const checked = selected.includes(q.id);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => toggleQuestion(q.id)}
                            className={cn(
                              'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                              checked
                                ? 'border-brand/40 bg-brand/5'
                                : 'border-slate-100 hover:bg-slate-50',
                            )}
                          >
                            {checked ? (
                              <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                            ) : (
                              <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                            )}
                            <span>
                              <span className="block text-xs font-medium text-slate-800">
                                {q.text}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-slate-400">
                                {q.type} · {q.marks} marks
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setAddFor(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selected.length === 0 || busy === 'add-questions'}
                  className="btn-primary disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {busy === 'add-questions'
                    ? 'Adding…'
                    : `Add ${selected.length} question${selected.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
