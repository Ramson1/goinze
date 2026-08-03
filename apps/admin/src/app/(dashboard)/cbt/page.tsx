'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Database,
  FileQuestion,
  ListChecks,
  Plus,
  Square,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import {
  academicsApi,
  cbtApi,
  sessionsApi,
  type AcademicSessionRecord,
  type CbtAttemptRecord,
  type CbtBankRecord,
  type CbtExamRecord,
  type CbtExamStatus,
  type CbtQuestionRecord,
  type CourseRecord,
} from '@/lib/api';

type Tab = 'exams' | 'banks';

const QUESTION_TYPES = ['OBJECTIVE', 'MULTI_SELECT', 'TRUE_FALSE', 'ESSAY', 'FILL_BLANK'];

function hasOptions(type: string): boolean {
  return type === 'OBJECTIVE' || type === 'MULTI_SELECT' || type === 'TRUE_FALSE';
}

function typeLabel(type: string): string {
  return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWhen(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const EMPTY_OPTIONS = () =>
  Array.from({ length: 4 }, () => ({ text: '', isCorrect: false }));

export default function CbtPage() {
  const [tab, setTab] = useState<Tab>('exams');

  const [exams, setExams] = useState<CbtExamRecord[]>([]);
  const [banks, setBanks] = useState<CbtBankRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Create-exam modal
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [duration, setDuration] = useState(60);
  const [passMark, setPassMark] = useState(40);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [shuffle, setShuffle] = useState(true);
  const [browserLock, setBrowserLock] = useState(false);

  // Add-questions modal
  const [addFor, setAddFor] = useState<CbtExamRecord | null>(null);
  const [bankId, setBankId] = useState('');
  const [bankQuestions, setBankQuestions] = useState<CbtQuestionRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  // Attempts panel
  const [attemptsFor, setAttemptsFor] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, CbtAttemptRecord[]>>({});

  // Create-bank modal
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [bankTitle, setBankTitle] = useState('');
  const [bankCourseId, setBankCourseId] = useState('');
  const [bankCategory, setBankCategory] = useState('');

  // Manage-bank modal
  const [manageBank, setManageBank] = useState<CbtBankRecord | null>(null);
  const [manageQuestions, setManageQuestions] = useState<CbtQuestionRecord[] | null>(null);
  const [bankView, setBankView] = useState<'list' | 'form'>('list');

  // Question form
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('OBJECTIVE');
  const [qMarks, setQMarks] = useState(1);
  const [qDifficulty, setQDifficulty] = useState('medium');
  const [qExplanation, setQExplanation] = useState('');
  const [qOptions, setQOptions] = useState(EMPTY_OPTIONS());

  const load = useCallback(async () => {
    setError(null);
    try {
      const [examList, bankList, coursePage, sessionList] = await Promise.all([
        cbtApi.exams(),
        cbtApi.banks(),
        academicsApi.courses({ pageSize: 200 }),
        sessionsApi.list(),
      ]);
      setExams(examList);
      setBanks(bankList);
      setCourses(coursePage.items);
      setSessions(sessionList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load CBT data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Load questions when the selected bank changes in the add-questions modal.
  useEffect(() => {
    if (!addFor || !bankId) {
      setBankQuestions([]);
      return;
    }
    let cancelled = false;
    cbtApi
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

  function courseCode(id: string | null): string {
    return courses.find((c) => c.id === id)?.code ?? '—';
  }

  // ---- Exam handlers ----

  function openCreateExam() {
    const current = sessions.find((s) => s.isCurrent)?.id ?? sessions[0]?.id ?? '';
    setSessionId(current);
    setCreateOpen(true);
  }

  function resetExamForm() {
    setTitle('');
    setCourseId('');
    setDuration(60);
    setPassMark(40);
    setStartsAt('');
    setEndsAt('');
    setInstructions('');
    setShuffle(true);
    setBrowserLock(false);
  }

  async function handleCreateExam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy('create-exam');
    try {
      await cbtApi.createExam({
        title,
        courseId: courseId || undefined,
        sessionId: sessionId || undefined,
        durationMins: duration,
        passMark,
        instructions: instructions.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        shuffleQuestions: shuffle,
        lockBrowser: browserLock,
      });
      setCreateOpen(false);
      resetExamForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam.');
    } finally {
      setBusy(null);
    }
  }

  async function handleStatus(exam: CbtExamRecord, status: CbtExamStatus) {
    setBusy(exam.id);
    try {
      await cbtApi.setExamStatus(exam.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exam.');
    } finally {
      setBusy(null);
    }
  }

  function openAddQuestions(exam: CbtExamRecord) {
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
      await cbtApi.addExamQuestions(addFor.id, selected);
      setAddFor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add questions.');
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
        const list = await cbtApi.examAttempts(examId);
        setAttempts((prev) => ({ ...prev, [examId]: list }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attempts.');
      }
    }
  }

  // ---- Bank handlers ----

  async function handleCreateBank(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy('create-bank');
    try {
      await cbtApi.createBank({
        title: bankTitle,
        courseId: bankCourseId || undefined,
        category: bankCategory.trim() || undefined,
      });
      setBankFormOpen(false);
      setBankTitle('');
      setBankCourseId('');
      setBankCategory('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question bank.');
    } finally {
      setBusy(null);
    }
  }

  async function openManage(bank: CbtBankRecord) {
    setManageBank(bank);
    setBankView('list');
    setManageQuestions(null);
    try {
      const qs = await cbtApi.bankQuestions(bank.id);
      setManageQuestions(qs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions.');
    }
  }

  function resetQuestionForm() {
    setQText('');
    setQType('OBJECTIVE');
    setQMarks(1);
    setQDifficulty('medium');
    setQExplanation('');
    setQOptions(EMPTY_OPTIONS());
  }

  function handleTypeChange(type: string) {
    setQType(type);
    if (type === 'TRUE_FALSE') {
      setQOptions([
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false },
      ]);
    } else if (hasOptions(type)) {
      setQOptions(EMPTY_OPTIONS());
    }
  }

  function setOptionText(index: number, text: string) {
    setQOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function setOptionCorrect(index: number, checked: boolean) {
    setQOptions((prev) =>
      prev.map((o, i) =>
        qType === 'MULTI_SELECT'
          ? i === index
            ? { ...o, isCorrect: checked }
            : o
          : { ...o, isCorrect: i === index ? checked : false },
      ),
    );
  }

  async function handleCreateQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!manageBank) return;

    const options = hasOptions(qType)
      ? qOptions
          .filter((o) => o.text.trim())
          .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
      : undefined;

    if (options && (options.length < 2 || !options.some((o) => o.isCorrect))) {
      setError('Provide at least two options and mark the correct answer.');
      return;
    }

    setBusy('create-question');
    try {
      await cbtApi.createQuestion({
        bankId: manageBank.id,
        type: qType,
        text: qText.trim(),
        marks: qMarks,
        difficulty: qDifficulty,
        explanation: qExplanation.trim() || undefined,
        options,
      });
      const qs = await cbtApi.bankQuestions(manageBank.id);
      setManageQuestions(qs);
      setBankView('list');
      resetQuestionForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question.');
    } finally {
      setBusy(null);
    }
  }

  // ---- Columns ----

  const examColumns: Column<CbtExamRecord>[] = [
    {
      key: 'title',
      header: 'Exam',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.title}</p>
          <p className="text-xs text-gray-400">
            {r.durationMins} min · pass mark {r.passMark}
          </p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (r) => <span className="font-mono text-xs">{r.course?.code ?? '—'}</span>,
    },
    {
      key: 'questions',
      header: 'Questions',
      className: 'text-right',
      render: (r) => r._count.questions,
    },
    {
      key: 'attempts',
      header: 'Attempts',
      className: 'text-right',
      render: (r) => r._count.attempts,
    },
    {
      key: 'startsAt',
      header: 'Starts',
      className: 'whitespace-nowrap',
      render: (r) => formatWhen(r.startsAt) ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {(r.status === 'DRAFT' || r.status === 'SCHEDULED') && (
            <>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => handleStatus(r, 'ACTIVE')}
                className="btn-primary px-2.5 py-1 text-xs disabled:opacity-60"
              >
                {r.status === 'DRAFT' ? 'Publish' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={() => openAddQuestions(r)}
                className="btn-secondary px-2.5 py-1 text-xs"
              >
                <Plus className="h-3 w-3" /> Questions
              </button>
            </>
          )}
          {r.status === 'ACTIVE' && (
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => handleStatus(r, 'CLOSED')}
              className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-60"
            >
              Close
            </button>
          )}
          {r.status === 'CLOSED' && (
            <>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => handleStatus(r, 'ACTIVE')}
                className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-60"
              >
                Reopen
              </button>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => handleStatus(r, 'ARCHIVED')}
                className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-60"
              >
                Archive
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => toggleAttempts(r.id)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              attemptsFor === r.id
                ? 'bg-brand/10 text-brand'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
          >
            <ListChecks className="h-3.5 w-3.5" />
            {attemptsFor === r.id ? 'Hide' : 'Attempts'}
          </button>
        </div>
      ),
    },
  ];

  const attemptColumns: Column<CbtAttemptRecord>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (a) => (
        <span className="font-medium text-gray-900">
          {a.student.firstName} {a.student.lastName}
        </span>
      ),
    },
    {
      key: 'matric',
      header: 'Matric No',
      render: (a) => (
        <span className="font-mono text-xs">{a.student.matricNumber ?? '—'}</span>
      ),
    },
    {
      key: 'started',
      header: 'Started',
      className: 'whitespace-nowrap',
      render: (a) => formatWhen(a.startedAt) ?? '—',
    },
    {
      key: 'submitted',
      header: 'Submitted',
      className: 'whitespace-nowrap',
      render: (a) => formatWhen(a.submittedAt) ?? '—',
    },
    {
      key: 'score',
      header: 'Score',
      className: 'text-right font-semibold text-gray-900',
      render: (a) => Number(a.score),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status.replace('_', ' ')} />,
    },
  ];

  const bankColumns: Column<CbtBankRecord>[] = [
    {
      key: 'title',
      header: 'Bank',
      render: (b) => (
        <div>
          <p className="font-medium text-gray-900">{b.title}</p>
          {b.category && <p className="text-xs text-gray-400">{b.category}</p>}
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (b) => <span className="font-mono text-xs">{courseCode(b.courseId)}</span>,
    },
    {
      key: 'questions',
      header: 'Questions',
      className: 'text-right',
      render: (b) => b._count.questions,
    },
    {
      key: 'created',
      header: 'Created',
      className: 'whitespace-nowrap',
      render: (b) => formatWhen(b.createdAt) ?? '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (b) => (
        <button
          type="button"
          onClick={() => openManage(b)}
          className="btn-secondary px-2.5 py-1.5 text-xs"
        >
          <FileQuestion className="h-3.5 w-3.5" /> Manage Questions
        </button>
      ),
    },
  ];

  const attemptsExam = attemptsFor ? exams.find((e) => e.id === attemptsFor) : null;

  return (
    <>
      <PageHeader
        title="Computer-Based Testing"
        subtitle="Schedule CBT exams and manage question banks."
        action={
          tab === 'exams' ? (
            <button type="button" onClick={openCreateExam} className="btn-primary">
              <Plus className="h-4 w-4" /> New Exam
            </button>
          ) : (
            <button type="button" onClick={() => setBankFormOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> New Question Bank
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-card">
        <button
          type="button"
          onClick={() => setTab('exams')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'exams' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <FileQuestion className="h-4 w-4" /> Exams
        </button>
        <button
          type="button"
          onClick={() => setTab('banks')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'banks' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <Database className="h-4 w-4" /> Question Banks
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {tab === 'exams' ? (
        <>
          <Card title="Scheduled Exams" subtitle="Upcoming, live and completed CBT exams">
            {loading ? (
              <p className="px-5 py-12 text-center text-sm text-gray-400">Loading exams…</p>
            ) : (
              <DataTable columns={examColumns} rows={exams} keyField="id" emptyMessage="No exams yet. Create your first exam to get started." />
            )}
          </Card>

          {attemptsFor && attemptsExam && (
            <Card
              title={`Attempts — ${attemptsExam.title}`}
              subtitle="Students who have started this exam"
              className="mt-4"
            >
              {!attempts[attemptsFor] ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">Loading attempts…</p>
              ) : (
                <DataTable
                  columns={attemptColumns}
                  rows={attempts[attemptsFor]}
                  keyField="id"
                  emptyMessage="No attempts recorded yet."
                />
              )}
            </Card>
          )}
        </>
      ) : (
        <Card title="Question Banks" subtitle="Reusable question pools by course">
          {loading ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">Loading banks…</p>
          ) : (
            <DataTable
              columns={bankColumns}
              rows={banks}
              keyField="id"
              emptyMessage="No question banks yet. Create one to start adding questions."
            />
          )}
        </Card>
      )}

      {/* Create exam modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">New Exam</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 px-6 py-5">
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
                  <label className="label">Course (optional)</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="input"
                  >
                    <option value="">No course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Session</label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="input"
                  >
                    <option value="">No session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.isCurrent ? ' (current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Ends At (optional)</label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
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

              <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Shuffle questions
                    </span>
                    <span className="text-xs text-gray-500">
                      Randomise question order per student
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={shuffle}
                    onChange={(e) => setShuffle(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-gray-800">Browser lock</span>
                    <span className="text-xs text-gray-500">
                      Prevent tab switching during the exam
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={browserLock}
                    onChange={(e) => setBrowserLock(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'create-exam'}
                  className="btn-primary disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {busy === 'create-exam' ? 'Creating…' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add questions modal */}
      {addFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Add Questions</h3>
                <p className="mt-0.5 text-xs text-gray-500">{addFor.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddFor(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestions} className="space-y-4 px-6 py-5">
              {banks.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  No question banks yet. Create a bank in the Question Banks tab first.
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

                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-3">
                    {bankQuestions.length === 0 ? (
                      <p className="py-6 text-center text-xs text-gray-400">
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
                                : 'border-gray-100 hover:bg-gray-50',
                            )}
                          >
                            {checked ? (
                              <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                            ) : (
                              <Square className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                            )}
                            <span>
                              <span className="block text-xs font-medium text-gray-800">
                                {q.text}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-gray-400">
                                {typeLabel(q.type)} · {q.marks} mark{q.marks === 1 ? '' : 's'}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setAddFor(null)} className="btn-secondary">
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

      {/* Create bank modal */}
      {bankFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">New Question Bank</h3>
              <button
                type="button"
                onClick={() => setBankFormOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBank} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Bank Title</label>
                <input
                  required
                  value={bankTitle}
                  onChange={(e) => setBankTitle(e.target.value)}
                  placeholder="e.g. CSC 101 — First Semester Pool"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Course (optional)</label>
                <select
                  value={bankCourseId}
                  onChange={(e) => setBankCourseId(e.target.value)}
                  className="input"
                >
                  <option value="">No course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Category (optional)</label>
                <input
                  value={bankCategory}
                  onChange={(e) => setBankCategory(e.target.value)}
                  placeholder="e.g. Past questions, Mock exams"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setBankFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'create-bank'}
                  className="btn-primary disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {busy === 'create-bank' ? 'Creating…' : 'Create Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage bank modal */}
      {manageBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {bankView === 'form' && (
                  <button
                    type="button"
                    onClick={() => setBankView('list')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                    aria-label="Back to questions"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {bankView === 'list' ? 'Question Bank' : 'Add Question'}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {manageBank.title} · {courseCode(manageBank.courseId)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManageBank(null);
                  resetQuestionForm();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {bankView === 'list' ? (
              <div className="px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {manageQuestions === null
                      ? 'Loading questions…'
                      : `${manageQuestions.length} question${manageQuestions.length === 1 ? '' : 's'} in this bank`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBankView('form')}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Question
                  </button>
                </div>

                {manageQuestions !== null &&
                  (manageQuestions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                      No questions yet. Add the first one.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {manageQuestions.map((q) => {
                        const correct = q.options.filter((o) => o.isCorrect).length;
                        return (
                          <li
                            key={q.id}
                            className="rounded-xl border border-gray-100 px-4 py-3"
                          >
                            <p className="text-sm font-medium text-gray-800">{q.text}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {typeLabel(q.type)} · {q.marks} mark{q.marks === 1 ? '' : 's'} ·{' '}
                              {q.difficulty ?? 'medium'}
                              {q.options.length > 0 &&
                                ` · ${q.options.length} options (${correct} correct)`}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ))}
              </div>
            ) : (
              <form onSubmit={handleCreateQuestion} className="space-y-4 px-6 py-5">
                <div>
                  <label className="label">Question</label>
                  <textarea
                    required
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    rows={3}
                    placeholder="Type the question text…"
                    className="input resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <select
                      value={qType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="input"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {typeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Marks</label>
                    <input
                      type="number"
                      min={1}
                      value={qMarks}
                      onChange={(e) => setQMarks(Number(e.target.value))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value)}
                      className="input"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {hasOptions(qType) && (
                  <div>
                    <label className="label">
                      Options{' '}
                      <span className="font-normal text-gray-400">
                        — mark the correct answer{qType === 'MULTI_SELECT' ? 's' : ''}
                      </span>
                    </label>
                    <div className="space-y-2">
                      {qOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <input
                            type={qType === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                            name="correct-option"
                            checked={opt.isCorrect}
                            onChange={(e) => setOptionCorrect(i, e.target.checked)}
                            className="h-4 w-4 shrink-0 border-gray-300 text-brand focus:ring-brand"
                            aria-label={`Option ${i + 1} is correct`}
                          />
                          <input
                            value={opt.text}
                            onChange={(e) => setOptionText(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            className="input"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Explanation (optional)</label>
                  <input
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Shown to students after grading…"
                    className="input"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setBankView('list')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy === 'create-question'}
                    className="btn-primary disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {busy === 'create-question' ? 'Saving…' : 'Save Question'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
