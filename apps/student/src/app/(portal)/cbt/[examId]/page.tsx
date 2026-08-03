'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Maximize2,
  Flag,
  ArrowLeft,
  Award,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Card from '@/components/Card';
import {
  cbtStudentApi,
  type CbtAttemptRecord,
  type CbtExamDetail,
  type CbtQuestion,
  type CbtSubmitResponse,
} from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Stable Fisher–Yates shuffle (seeded by attempt id so a refresh keeps order). */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ExamPage(props: { params: Promise<{ examId: string }> }) {
  const { examId } = use(props.params);
  const { profile } = useStudent();

  const [exam, setExam] = useState<CbtExamDetail | null>(null);
  const [attempt, setAttempt] = useState<CbtAttemptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [result, setResult] = useState<CbtSubmitResponse | null>(null);

  // ---- Load exam + start (or resume) the attempt ----
  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await cbtStudentApi.exam(examId);
        const att = await cbtStudentApi.startAttempt({
          examId,
          studentId: profile.id,
        });
        if (cancelled) return;
        setExam(detail);
        setAttempt(att);
        setSecondsLeft(detail.durationMins * 60);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load this exam.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, profile?.id]);

  const questions: CbtQuestion[] = useMemo(() => {
    if (!exam) return [];
    const ordered = [...exam.questions]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((eq) => eq.question);
    return exam.shuffleQuestions && attempt ? seededShuffle(ordered, attempt.id) : ordered;
  }, [exam, attempt]);

  const inProgress = attempt?.status === 'IN_PROGRESS' && !result;
  const alreadyDone = attempt !== null && attempt.status !== 'IN_PROGRESS' && !result;

  const question = questions[current];
  const answeredCount = questions.filter(
    (q) =>
      (answers[q.id] && answers[q.id].length > 0) ||
      (texts[q.id] && texts[q.id].trim().length > 0),
  ).length;

  // ---- Submit ----
  const submitRef = useRef<() => Promise<void>>(async () => {});
  const doSubmit = useCallback(async () => {
    if (!attempt || submitting || result) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = questions.map((q) => {
        const selected = answers[q.id] ?? [];
        const text = texts[q.id]?.trim() ?? '';
        return {
          questionId: q.id,
          selectedOptions: selected.length ? selected : undefined,
          essayText: text || undefined,
        };
      });
      const res = await cbtStudentApi.submitAttempt(attempt.id, payload);
      setResult(res);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  }, [attempt, submitting, result, questions, answers, texts]);

  useEffect(() => {
    submitRef.current = doSubmit;
  }, [doSubmit]);

  // ---- Countdown timer ----
  useEffect(() => {
    if (!inProgress) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          void submitRef.current(); // auto-submit at zero
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [inProgress]);

  const selectOption = useCallback(
    (optionId: string, multi: boolean) => {
      if (!question || !inProgress) return;
      setAnswers((prev) => {
        if (!multi) return { ...prev, [question.id]: [optionId] };
        const existing = prev[question.id] ?? [];
        const next = existing.includes(optionId)
          ? existing.filter((o) => o !== optionId)
          : [...existing, optionId];
        return { ...prev, [question.id]: next };
      });
    },
    [question, inProgress],
  );

  const toggleFlag = useCallback(() => {
    if (!question) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  }, [question]);

  // ---- Loading / error states ----
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing your exam…
        </Card>
      </div>
    );
  }

  if (loadError || !exam || !attempt) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-10 text-center">
          <XCircle className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-3 text-lg font-bold text-slate-900">Exam not found</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loadError ?? 'This exam does not exist or is no longer available.'}
          </p>
          <Link href="/cbt" className="btn-primary mt-6 inline-flex">
            <ArrowLeft className="h-4 w-4" /> Back to CBT Dashboard
          </Link>
        </Card>
      </div>
    );
  }

  // ---- Already submitted / graded view ----
  if (alreadyDone) {
    const score = Number(attempt.score ?? 0);
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Award className="h-8 w-8 text-brand" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Already Submitted</h1>
          <p className="mt-1 text-sm text-slate-500">{exam.title}</p>
          <p className="mt-4 text-sm text-slate-600">
            You have already completed this exam. Your recorded score is{' '}
            <strong className="text-brand">{score}</strong> mark{score === 1 ? '' : 's'}.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/cbt" className="btn-secondary">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Post-submission results view ----
  if (result) {
    const score = Number(result.score ?? 0);
    const correct = result.responses.filter((r) => r.isCorrect).length;
    const missed = result.responses.length - correct;
    const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0) || 1;
    const pct = Math.round((score / totalMarks) * 100);
    const passed = pct >= exam.passMark;
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Award className="h-8 w-8 text-brand" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Exam Submitted</h1>
          <p className="mt-1 text-sm text-slate-500">
            {exam.course?.code ? `${exam.course.code} — ` : ''}{exam.title}
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-900">{correct}</p>
              <p className="text-xs text-slate-500">Correct</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-900">{missed}</p>
              <p className="text-xs text-slate-500">Missed</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-2xl font-bold text-brand">{score}</p>
              <p className="text-xs text-brand-dark">Marks · {pct}%</p>
            </div>
          </div>

          <p
            className={cn(
              'mx-auto mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
              passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
            )}
          >
            {passed ? `Passed (pass mark ${exam.passMark}%)` : `Below pass mark (${exam.passMark}%)`}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            Objective questions are graded automatically. Essay answers will be reviewed by your lecturer.
          </p>

          <div className="mt-6 flex justify-center gap-2">
            <Link href="/cbt" className="btn-secondary">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Active exam view ----
  const multi = question?.type === 'MULTI_SELECT';

  return (
    <div className="mx-auto max-w-6xl">
      {/* Exam header */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {exam.course?.code ?? 'General'}
          </p>
          <h1 className="text-base font-bold text-slate-900">{exam.title}</h1>
          <p className="text-xs text-slate-500">
            {profile?.firstName} {profile?.lastName} · {profile?.matricNo ?? profile?.regNumber ?? ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-sm font-bold',
              secondsLeft <= 60 ? 'bg-red-50 text-red-600' : 'bg-brand text-white',
            )}
          >
            <Timer className="h-4 w-4" /> {formatTime(secondsLeft)}
          </span>
        </div>
      </div>

      {submitError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Fullscreen note */}
      <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs text-indigo-800">
        <Maximize2 className="h-3.5 w-3.5 shrink-0" />
        Avoid switching tabs during the exam — the timer keeps running and your attempt is submitted
        automatically when time runs out.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Question panel */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Question <span className="text-slate-900">{current + 1}</span> of {questions.length}
              {question && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {question.type.replace('_', ' ')} · {question.marks} mark{question.marks === 1 ? '' : 's'}
                </span>
              )}
            </p>
            <button
              onClick={toggleFlag}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                question && flagged.has(question.id)
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-slate-400 hover:bg-slate-100',
              )}
            >
              <Flag className="h-3.5 w-3.5" />
              {question && flagged.has(question.id) ? 'Flagged' : 'Flag for review'}
            </button>
          </div>

          {question && (
            <>
              <h2 className="mt-4 text-lg font-semibold leading-relaxed text-slate-900">
                {question.text}
              </h2>

              {/* Objective / true-false / multi-select options */}
              {question.options.length > 0 && (
                <div className="mt-6 space-y-3">
                  {question.options.map((opt, i) => {
                    const selected = (answers[question.id] ?? []).includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => selectOption(opt.id, multi)}
                        className={cn(
                          'flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition',
                          selected
                            ? 'border-brand bg-blue-50 text-brand-dark ring-2 ring-brand/30'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            selected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Essay answer */}
              {question.type === 'ESSAY' && (
                <textarea
                  value={texts[question.id] ?? ''}
                  onChange={(e) =>
                    setTexts((prev) => ({ ...prev, [question.id]: e.target.value }))
                  }
                  rows={8}
                  placeholder="Type your answer here…"
                  className="input-field mt-6 resize-y"
                />
              )}

              {/* Fill-in-the-blank answer */}
              {question.type === 'FILL_BLANK' && (
                <input
                  type="text"
                  value={texts[question.id] ?? ''}
                  onChange={(e) =>
                    setTexts((prev) => ({ ...prev, [question.id]: e.target.value }))
                  }
                  placeholder="Type your answer…"
                  className="input-field mt-6"
                />
              )}
            </>
          )}

          {/* Prev / Next */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-secondary"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {current === questions.length - 1 ? (
              <button onClick={() => setConfirmSubmit(true)} className="btn-accent">
                <CheckCircle2 className="h-4 w-4" /> Submit Exam
              </button>
            ) : (
              <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="btn-primary">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </Card>

        {/* Navigator */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900">Question Navigator</h3>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const isAnswered =
                  (answers[q.id] && answers[q.id].length > 0) ||
                  Boolean(texts[q.id] && texts[q.id].trim());
                const isCurrent = i === current;
                const isFlagged = flagged.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      'relative flex h-10 items-center justify-center rounded-lg text-xs font-bold transition',
                      isCurrent
                        ? 'bg-brand text-white ring-2 ring-brand/40 ring-offset-1'
                        : isAnswered
                          ? 'bg-blue-100 text-brand-dark'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                    )}
                    aria-label={`Go to question ${i + 1}`}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-blue-100" /> Answered ({answeredCount})
              </p>
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-100" /> Not answered ({questions.length - answeredCount})
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Flagged
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900">Progress</h3>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {answeredCount} of {questions.length} answered
            </p>
            <button
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
              className="btn-accent mt-4 w-full disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Submit Exam
            </button>
          </Card>
        </div>
      </div>

      {/* Submit confirmation */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900">Submit exam?</h2>
            <p className="mt-2 text-sm text-slate-600">
              You have answered <strong>{answeredCount}</strong> of{' '}
              <strong>{questions.length}</strong> questions.
              {answeredCount < questions.length && (
                <span className="mt-1 block text-amber-600">
                  {questions.length - answeredCount} question(s) are still unanswered and will be marked
                  as incorrect.
                </span>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirmSubmit(false)} className="btn-secondary" disabled={submitting}>
                Keep Writing
              </button>
              <button onClick={() => void doSubmit()} disabled={submitting} className="btn-accent disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit Now
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
