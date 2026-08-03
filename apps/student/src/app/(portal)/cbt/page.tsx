'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MonitorSmartphone,
  Clock,
  HelpCircle,
  PlayCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { cbtStudentApi, type CbtExamRecord } from '@/lib/api';
import { cn } from '@/lib/utils';

type Bucket = 'available' | 'upcoming' | 'completed';

/** Classify an exam from the student's point of view. */
function classify(exam: CbtExamRecord): Bucket {
  const now = Date.now();
  const starts = exam.startsAt ? new Date(exam.startsAt).getTime() : null;
  const ends = exam.endsAt ? new Date(exam.endsAt).getTime() : null;
  if (exam.status === 'CLOSED') return 'completed';
  if (ends !== null && ends < now) return 'completed';
  if (exam.status === 'ACTIVE' && (starts === null || starts <= now)) return 'available';
  return 'upcoming';
}

function formatStart(exam: CbtExamRecord) {
  if (!exam.startsAt) return 'To be announced';
  const d = new Date(exam.startsAt);
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function ExamCard({ exam, bucket }: { exam: CbtExamRecord; bucket: Bucket }) {
  const isAvailable = bucket === 'available';
  const isCompleted = bucket === 'completed';

  return (
    <Card hover className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            isAvailable ? 'bg-blue-50 text-brand' : isCompleted ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600',
          )}
        >
          <MonitorSmartphone className="h-5 w-5" />
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
            isAvailable ? 'bg-blue-50 text-brand' : isCompleted ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-700',
          )}
        >
          {isAvailable ? 'Available' : isCompleted ? 'Completed' : 'Upcoming'}
        </span>
      </div>

      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
        {exam.course?.code ?? 'General'}
      </p>
      <h3 className="mt-1 text-sm font-bold text-slate-900">{exam.title}</h3>

      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-slate-400" /> {formatStart(exam)}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" /> {exam.durationMins} minutes · {exam._count.questions} questions
        </p>
        <p className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-slate-400" /> Pass mark {exam.passMark}%
        </p>
      </div>

      {exam.instructions && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{exam.instructions}</p>
      )}

      <div className="mt-4 flex-1" />

      {isAvailable ? (
        <Link href={`/cbt/${exam.id}`} className="btn-primary w-full">
          <PlayCircle className="h-4 w-4" /> Start Exam
        </Link>
      ) : isCompleted ? (
        <button className="btn-secondary w-full" disabled>
          <CheckCircle2 className="h-4 w-4" /> Closed
        </button>
      ) : (
        <button className="btn-secondary w-full" disabled>
          <Clock className="h-4 w-4" /> Not yet available
        </button>
      )}
    </Card>
  );
}

export default function CbtDashboardPage() {
  const [exams, setExams] = useState<CbtExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cbtStudentApi
      .exams()
      .then((list) => setExams(list.filter((e) => e.status !== 'DRAFT' && e.status !== 'ARCHIVED')))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load exams.'))
      .finally(() => setLoading(false));
  }, []);

  const buckets: Record<Bucket, CbtExamRecord[]> = { available: [], upcoming: [], completed: [] };
  for (const exam of exams) buckets[classify(exam)].push(exam);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="CBT Dashboard"
        description="Computer Based Tests — view your schedule and launch available exams."
      />

      {/* Exam-day notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3.5 text-sm text-indigo-800">
        <FileText className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Before you start</p>
          <p className="mt-0.5 opacity-90">
            Ensure a stable internet connection and a fully charged device. The exam timer starts as soon
            as you begin and cannot be paused. Each exam can only be attempted once.
          </p>
        </div>
      </div>

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading exams…
        </Card>
      )}

      {!loading && error && (
        <Card className="p-10 text-center">
          <MonitorSmartphone className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && exams.length === 0 && (
        <Card className="p-10 text-center">
          <MonitorSmartphone className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No exams scheduled</p>
          <p className="mt-1 text-xs text-slate-400">
            Your lecturers haven't published any computer based tests yet. Check back later.
          </p>
        </Card>
      )}

      {!loading && !error && buckets.available.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Available Now</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {buckets.available.map((e) => (
              <ExamCard key={e.id} exam={e} bucket="available" />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && buckets.upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Upcoming</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {buckets.upcoming.map((e) => (
              <ExamCard key={e.id} exam={e} bucket="upcoming" />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && buckets.completed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Completed</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {buckets.completed.map((e) => (
              <ExamCard key={e.id} exam={e} bucket="completed" />
            ))}
          </div>
        </section>
      )}

      <Card className="mt-8 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <HelpCircle className="h-4 w-4 text-brand" /> Having trouble during an exam?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          If your browser crashes or you lose connection, log back in and reopen the exam — your attempt is
          preserved until submission. For invigilator assistance, raise your hand at the venue or contact
          the ICT help desk immediately.
        </p>
      </Card>
    </div>
  );
}
