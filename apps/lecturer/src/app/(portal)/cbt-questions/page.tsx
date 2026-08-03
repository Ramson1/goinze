'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ClipboardList,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import {
  lecturerApi,
  type AllocatedCourse,
  type CbtQuestion,
  type QuestionBank,
} from '@/lib/api';
import { cn } from '@/lib/cn';

const QUESTION_TYPES = ['OBJECTIVE', 'MULTI_SELECT', 'TRUE_FALSE', 'ESSAY', 'FILL_BLANK'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const difficultyStyles: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CbtQuestionsPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [courses, setCourses] = useState<AllocatedCourse[]>([]);
  const [bankId, setBankId] = useState('');
  const [questions, setQuestions] = useState<CbtQuestion[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // New-bank form
  const [showBankForm, setShowBankForm] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankForm, setBankForm] = useState({ title: '', courseId: '', category: '' });

  // Add-question form
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [formType, setFormType] = useState('OBJECTIVE');
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formAnswer, setFormAnswer] = useState('');
  const [formMarks, setFormMarks] = useState(2);
  const [formDifficulty, setFormDifficulty] = useState('medium');

  const loadBanks = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([lecturerApi.questionBanks(), lecturerApi.courses().catch(() => [])])
      .then(([b, c]) => {
        setBanks(b);
        setCourses(c);
        if (b.length > 0 && !bankId) setBankId(b[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load banks.'))
      .finally(() => setLoading(false));
  }, [bankId]);

  useEffect(() => {
    loadBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestions = useCallback(() => {
    if (!bankId) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    lecturerApi
      .bankQuestions(bankId)
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load questions.'))
      .finally(() => setLoadingQuestions(false));
  }, [bankId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const filtered = questions.filter((q) => {
    const m = query.trim().toLowerCase();
    return m === '' || q.text.toLowerCase().includes(m);
  });

  const selectedBank = banks.find((b) => b.id === bankId);

  async function submitBank(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingBank(true);
    setError(null);
    setNotice(null);
    try {
      const created = await lecturerApi.createBank({
        title: bankForm.title.trim(),
        courseId: bankForm.courseId || undefined,
        category: bankForm.category.trim() || undefined,
      });
      setNotice(`Bank "${created.title}" created.`);
      setBankForm({ title: '', courseId: '', category: '' });
      setShowBankForm(false);
      await loadBanks();
      setBankId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create bank.');
    } finally {
      setSavingBank(false);
    }
  }

  function resetQuestionForm() {
    setFormType('OBJECTIVE');
    setFormText('');
    setFormOptions(['', '', '', '']);
    setFormAnswer('');
    setFormMarks(2);
    setFormDifficulty('medium');
  }

  async function submitQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bankId) return;
    setSavingQuestion(true);
    setError(null);
    setNotice(null);
    try {
      const isObjective = formType === 'OBJECTIVE' || formType === 'MULTI_SELECT';
      await lecturerApi.createQuestion({
        bankId,
        type: formType,
        text: formText.trim(),
        marks: formMarks,
        difficulty: formDifficulty,
        options: isObjective
          ? formOptions
              .filter((o) => o.trim() !== '')
              .map((o) => ({ text: o.trim(), isCorrect: o.trim() === formAnswer }))
          : undefined,
      });
      setNotice('Question added to bank.');
      resetQuestionForm();
      setModalOpen(false);
      loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add question.');
    } finally {
      setSavingQuestion(false);
    }
  }

  const objective = formType === 'OBJECTIVE' || formType === 'MULTI_SELECT';

  return (
    <>
      <PageHeader
        title="CBT Question Bank"
        subtitle="Author and manage computer-based test questions for your courses."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBankForm((v) => !v)}
              className="btn-secondary"
            >
              <Plus className="h-4 w-4" /> {showBankForm ? 'Close' : 'New Bank'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={!bankId}
              className="btn-primary disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Add Question
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}

      {showBankForm && (
        <Card className="mb-5">
          <form
            onSubmit={submitBank}
            className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-3"
          >
            <div>
              <label className="label">Bank title</label>
              <input
                type="text"
                required
                value={bankForm.title}
                onChange={(e) => setBankForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="CSC 101 — Midterm Pool"
                className="input"
              />
            </div>
            <div>
              <label className="label">Course (optional)</label>
              <select
                value={bankForm.courseId}
                onChange={(e) => setBankForm((f) => ({ ...f, courseId: e.target.value }))}
                className="input"
              >
                <option value="">— None —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={savingBank} className="btn-primary disabled:opacity-60">
                {savingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Bank
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="input pl-9"
          />
        </div>
        <select
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
          className="input sm:w-72"
        >
          {banks.length === 0 && <option value="">No banks yet</option>}
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} ({b._count.questions})
            </option>
          ))}
        </select>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <ClipboardList className="h-4 w-4" /> {filtered.length} question
          {filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Question list */}
      {loading || loadingQuestions ? (
        <Card className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        q.type === 'ESSAY'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-indigo-100 text-indigo-700',
                      )}
                    >
                      {titleCase(q.type)}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        difficultyStyles[q.difficulty ?? 'medium'] ?? difficultyStyles.medium,
                      )}
                    >
                      {titleCase(q.difficulty ?? 'medium')}
                    </span>
                    <span className="text-xs text-slate-400">{q.marks} marks</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{q.text}</p>
                  {q.options.length > 0 && (
                    <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {q.options.map((opt) => (
                        <li
                          key={opt.id}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs',
                            opt.isCorrect
                              ? 'bg-emerald-50 font-semibold text-emerald-700'
                              : 'bg-slate-50 text-slate-600',
                          )}
                        >
                          {opt.text}
                          {opt.isCorrect ? ' ✓' : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="py-14 text-center text-sm text-slate-400">
              {banks.length === 0
                ? 'No question banks yet. Create one to start adding questions.'
                : 'No questions match your filters.'}
            </Card>
          )}
        </div>
      )}

      {/* Add Question modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Add Question{selectedBank ? ` — ${selectedBank.title}` : ''}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitQuestion} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Question type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="input"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {titleCase(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="input"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {titleCase(d)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Question</label>
                <textarea
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={3}
                  placeholder="Type the question…"
                  className="input resize-none"
                />
              </div>

              {objective && (
                <>
                  <div>
                    <label className="label">Options</label>
                    <div className="space-y-2">
                      {formOptions.map((opt, i) => (
                        <input
                          key={i}
                          value={opt}
                          onChange={(e) => {
                            const next = [...formOptions];
                            next[i] = e.target.value;
                            setFormOptions(next);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="input"
                        />
                      ))}
                    </div>
                  </div>
                  {formType === 'OBJECTIVE' && (
                    <div>
                      <label className="label">Correct answer</label>
                      <select
                        value={formAnswer}
                        onChange={(e) => setFormAnswer(e.target.value)}
                        className="input"
                      >
                        <option value="">Select correct option…</option>
                        {formOptions
                          .filter((o) => o.trim() !== '')
                          .map((o) => (
                            <option key={o} value={o.trim()}>
                              {o}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="label">Marks</label>
                <input
                  type="number"
                  min={1}
                  value={formMarks}
                  onChange={(e) => setFormMarks(Number(e.target.value))}
                  className="input w-28"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={savingQuestion} className="btn-primary disabled:opacity-60">
                  {savingQuestion ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add to Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
