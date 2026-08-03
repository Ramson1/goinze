'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Lock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Loader2,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type AvailableCoursesResponse } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

type Semester = 'FIRST' | 'SECOND';

const semesterTabs: { value: Semester; label: string }[] = [
  { value: 'FIRST', label: 'First Semester' },
  { value: 'SECOND', label: 'Second Semester' },
];

export default function CourseRegistrationPage() {
  const { profile } = useStudent();
  const [semester, setSemester] = useState<Semester>('FIRST');
  const [data, setData] = useState<AvailableCoursesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback((sem: Semester) => {
    setLoading(true);
    setError(null);
    setSubmitError(null);
    setSubmitted(false);
    studentApi
      .availableCourses(sem)
      .then((d) => {
        setData(d);
        setSelected(new Set(d.existing?.courseIds ?? []));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(semester);
  }, [semester, load]);

  const totalUnits = useMemo(() => {
    if (!data) return 0;
    return data.courses
      .filter((c) => selected.has(c.id))
      .reduce((sum, c) => sum + c.creditUnits, 0);
  }, [data, selected]);

  const minUnits = data?.minUnits ?? 15;
  const maxUnits = data?.maxUnits ?? 24;
  const locked = data?.locked ?? false;
  const withinRange = totalUnits >= minUnits && totalUnits <= maxUnits;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!data) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await studentApi.submitRegistration({
        courseIds: Array.from(selected),
        semester,
      });
      setSubmitted(true);
      setConfirming(false);
      load(semester); // refresh to reflect the saved (PENDING) registration
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Course Registration"
        description={`Select your courses for the ${profile?.session ?? 'current'} academic session.`}
      />

      {/* Semester selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {semesterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSemester(tab.value)}
            className={cn(
              'rounded-lg px-3.5 py-2 text-xs font-semibold transition',
              semester === tab.value
                ? 'bg-brand text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Registration window / lock notice */}
      {data && (
        <div
          className={cn(
            'mb-6 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm',
            locked
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-blue-200 bg-blue-50 text-brand-dark',
          )}
        >
          {locked ? (
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {locked ? 'Registration is approved / locked' : 'Registration window is open'}
            </p>
            <p className="mt-0.5 opacity-90">
              {data.session ?? '—'} · {semesterTabs.find((t) => t.value === semester)?.label} · Minimum{' '}
              {minUnits} units, maximum {maxUnits} units.
              {locked && ' Contact your course adviser to make changes.'}
            </p>
          </div>
        </div>
      )}

      {submitted && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Registration submitted successfully</p>
            <p className="mt-0.5">
              Your course adviser will review and approve your selection. Track the status under
              Registered Courses.
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading available courses…
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Course list */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <BookOpen className="h-4 w-4 text-brand" /> Available Courses
              </h2>
              <p className="text-xs text-slate-500">
                {data?.level ?? 100} level · {semesterTabs.find((t) => t.value === semester)?.label}
              </p>
            </div>

            {!data || data.courses.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-400">
                No courses are offered for your department at this level/semester yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.courses.map((c) => {
                  const checked = selected.has(c.id);
                  return (
                    <li key={c.id}>
                      <label
                        className={cn(
                          'flex items-center gap-4 px-5 py-3.5 transition',
                          locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-50',
                          checked && 'bg-blue-50/50',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(c.id)}
                          disabled={locked}
                          className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-slate-900">{c.code}</span>
                          <p className="truncate text-sm text-slate-600">{c.title}</p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {c.creditUnits} units
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Summary */}
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">Registration Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Courses selected</dt>
                  <dd className="font-semibold text-slate-900">{selected.size}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Total credit units</dt>
                  <dd
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-sm font-bold',
                      withinRange ? 'bg-blue-50 text-brand' : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    {totalUnits} / {maxUnits}
                  </dd>
                </div>
              </dl>

              {/* Units progress */}
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      withinRange ? 'bg-brand' : 'bg-amber-500',
                    )}
                    style={{ width: `${Math.min(100, (totalUnits / maxUnits) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Min {minUnits} · Max {maxUnits} units
                </p>
              </div>

              {!withinRange && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Select between {minUnits} and {maxUnits} credit units to submit.
                </p>
              )}

              <button
                onClick={() => setConfirming(true)}
                disabled={!withinRange || locked || submitting}
                className="btn-primary mt-5 w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4" />
                    {data?.existing ? 'Update Registration' : 'Submit Registration'}
                  </>
                )}
              </button>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">Before you submit</h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
                <li>· Ensure all school fees for the semester are paid.</li>
                <li>· You can update your selection until your adviser approves it.</li>
                <li>· Once approved or locked, changes must go through your course adviser.</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900">Confirm registration</h2>
            <p className="mt-2 text-sm text-slate-600">
              You are about to register <strong>{selected.size} courses</strong> totalling{' '}
              <strong>{totalUnits} credit units</strong> for {profile?.session ?? 'the current session'}{' '}
              {semesterTabs.find((t) => t.value === semester)?.label}. This will be sent to your course
              adviser for approval.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirming(false)} className="btn-secondary" disabled={submitting}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
