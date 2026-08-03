'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Globe,
  Loader2,
  Send,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import {
  lecturerApi,
  type AllocatedCourse,
  type CourseResultsResponse,
} from '@/lib/api';
import { cn } from '@/lib/cn';

function gradeClass(grade: string | null): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-700';
    case 'B':
      return 'bg-blue-100 text-blue-700';
    case 'C':
      return 'bg-sky-100 text-sky-700';
    case 'D':
      return 'bg-amber-100 text-amber-700';
    case 'E':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-red-100 text-red-700';
  }
}

function statusClass(status: string): string {
  if (status === 'PUBLISHED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'SUBMITTED') return 'bg-sky-100 text-sky-700';
  if (status === 'APPROVED') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

function ResultsInner() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams.get('course') ?? '';

  const [courses, setCourses] = useState<AllocatedCourse[]>([]);
  const [courseId, setCourseId] = useState(initialCourse);
  const [data, setData] = useState<CourseResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<'submit' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    lecturerApi
      .courses()
      .then((list) => {
        setCourses(list);
        if (!courseId && list[0]) setCourseId(list[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback((id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    lecturerApi
      .courseResults(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load results.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (courseId) load(courseId);
  }, [courseId, load]);

  async function submit() {
    if (!courseId) return;
    setBusy('submit');
    setError(null);
    try {
      const res = await lecturerApi.submitResults(courseId);
      setNotice(`Submitted ${res.updated} result(s) for approval.`);
      load(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit results.');
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!courseId) return;
    setBusy('publish');
    setError(null);
    try {
      const res = await lecturerApi.publishResults(courseId);
      setNotice(`Published ${res.published} result(s). Students can now view them.`);
      load(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish results.');
    } finally {
      setBusy(null);
    }
  }

  const summary = data?.summary;

  return (
    <>
      <PageHeader
        title="Results"
        subtitle="Review, submit and publish results for your allocated courses."
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="label">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="input"
              disabled={courses.length === 0}
            >
              {courses.length === 0 && <option value="">No allocated courses</option>}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
          {summary && (
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>
                <span className="font-semibold text-slate-900">{summary.total}</span> graded
              </span>
              <span>
                <span className="font-semibold text-amber-600">{summary.draft}</span> draft
              </span>
              <span>
                <span className="font-semibold text-sky-600">{summary.submitted}</span> submitted
              </span>
              <span>
                <span className="font-semibold text-emerald-600">{summary.published}</span>{' '}
                published
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy !== null || !summary || summary.total === 0}
              className="btn-secondary disabled:opacity-60"
            >
              {busy === 'submit' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={busy !== null || !summary || summary.total === 0}
              className="btn-primary disabled:opacity-60"
            >
              {busy === 'publish' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              Publish
            </button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={data ? `${data.course.code} — ${data.course.title}` : 'Results'}
          subtitle={
            data
              ? `${data.session} · ${data.course.semester} Semester`
              : 'Select a course to view entered results.'
          }
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <BarChart3 className="h-3.5 w-3.5" /> {summary?.total ?? 0} students
            </span>
          }
        />
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading results…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Matric No.</th>
                  <th className="px-5 py-3 text-center">CA</th>
                  <th className="px-5 py-3 text-center">Exam</th>
                  <th className="px-5 py-3 text-center">Total</th>
                  <th className="px-5 py-3 text-center">Grade</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.rows ?? []).map((row) => (
                  <tr key={row.studentId} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-900">{row.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{row.matricNo ?? '—'}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{row.caScore}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{row.examScore}</td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-900">
                      {row.totalScore}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                          gradeClass(row.grade),
                        )}
                      >
                        {row.grade ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          statusClass(row.status),
                        )}
                      >
                        {row.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data || data.rows.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                      No results entered for this course yet. Use “Upload Scores” to enter them.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      }
    >
      <ResultsInner />
    </Suspense>
  );
}
