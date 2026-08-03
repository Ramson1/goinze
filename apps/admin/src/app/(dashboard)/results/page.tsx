'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Globe,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  resultsApi,
  type AdminResultRow,
  type CourseResultSummary,
} from '@/lib/api';
import { cn } from '@/lib/utils';

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
      return 'bg-rose-100 text-rose-700';
  }
}

/** A compact multi-segment status bar for a course's result counts. */
function StatusBreakdown({ c }: { c: CourseResultSummary }) {
  const segments = [
    { key: 'draft', n: c.draft, cls: 'bg-gray-300' },
    { key: 'submitted', n: c.submitted, cls: 'bg-amber-400' },
    { key: 'approved', n: c.approved, cls: 'bg-blue-400' },
    { key: 'locked', n: c.locked, cls: 'bg-indigo-400' },
    { key: 'published', n: c.published, cls: 'bg-emerald-500' },
  ];
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {segments.map(
          (s) =>
            s.n > 0 && (
              <div
                key={s.key}
                className={s.cls}
                style={{ width: `${(s.n / Math.max(1, c.total)) * 100}%` }}
              />
            ),
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
        <span>{c.total} total</span>
        {c.draft > 0 && <span>{c.draft} draft</span>}
        {c.submitted > 0 && <span className="text-amber-600">{c.submitted} submitted</span>}
        {c.approved > 0 && <span className="text-blue-600">{c.approved} approved</span>}
        {c.locked > 0 && <span className="text-indigo-600">{c.locked} locked</span>}
        {c.published > 0 && <span className="text-emerald-600">{c.published} published</span>}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [courses, setCourses] = useState<CourseResultSummary[]>([]);
  const [session, setSession] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminResultRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [busy, setBusy] = useState<'approve' | 'lock' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSummaries = useCallback(async (keepSelection = true) => {
    setError(null);
    try {
      const data = await resultsApi.courseSummaries();
      setCourses(data.courses);
      setSession(data.session);
      if (!keepSelection || !selectedId) {
        const first = data.courses[0]?.courseId ?? null;
        setSelectedId(first);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results.');
    } finally {
      setLoadingList(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const loadRows = useCallback((courseId: string) => {
    setLoadingRows(true);
    setError(null);
    resultsApi
      .courseResults(courseId)
      .then((data) => setRows(data.rows))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load course results.'))
      .finally(() => setLoadingRows(false));
  }, []);

  useEffect(() => {
    loadSummaries(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadRows(selectedId);
  }, [selectedId, loadRows]);

  const selected = courses.find((c) => c.courseId === selectedId) ?? null;

  async function run(action: 'approve' | 'lock' | 'publish') {
    if (!selectedId) return;
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      const res =
        action === 'approve'
          ? await resultsApi.approveCourse(selectedId)
          : action === 'lock'
            ? await resultsApi.lockCourse(selectedId)
            : await resultsApi.publishCourse(selectedId);
      const verb =
        action === 'approve' ? 'Approved' : action === 'lock' ? 'Locked' : 'Published';
      setNotice(`${verb} ${res.updated} result(s).`);
      await loadSummaries(true);
      loadRows(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  }

  const columns: Column<AdminResultRow>[] = [
    {
      key: 'studentName',
      header: 'Student',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.studentName || '—'}</p>
          <p className="font-mono text-xs text-gray-400">{r.matricNo ?? '—'}</p>
        </div>
      ),
    },
    { key: 'caScore', header: 'CA', className: 'text-right' },
    { key: 'examScore', header: 'Exam', className: 'text-right' },
    {
      key: 'totalScore',
      header: 'Total',
      className: 'text-right font-semibold text-gray-900',
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (r) => (
        <span
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold',
            gradeClass(r.grade),
          )}
        >
          {r.grade ?? '—'}
        </span>
      ),
    },
    { key: 'gradePoint', header: 'Point', className: 'text-right' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Results Approval"
        subtitle={
          session
            ? `Review, approve, lock and publish course results · ${session}`
            : 'Review, approve, lock and publish course results.'
        }
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Course list */}
        <Card title="Courses with results" subtitle="Select a course to review">
          {loadingList ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : courses.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              No results have been entered yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {courses.map((c) => {
                const active = c.courseId === selectedId;
                return (
                  <li key={`${c.courseId}:${c.semester}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.courseId)}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors',
                        active ? 'bg-brand/5' : 'hover:bg-gray-50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                            {c.code}
                          </span>
                          <span className="text-xs text-gray-400">
                            {c.level} Level · {c.semester} Sem
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-gray-900">
                          {c.title}
                        </p>
                        <div className="mt-2">
                          <StatusBreakdown c={c} />
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-brand' : 'text-gray-300',
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Detail */}
        <div className="lg:col-span-2">
          <Card
            title={selected ? `${selected.code} — ${selected.title}` : 'Course results'}
            subtitle={
              selected
                ? `${selected.level} Level · ${selected.semester} Semester${
                    selected.department ? ` · ${selected.department}` : ''
                  }`
                : 'Select a course to see its results.'
            }
            action={
              selected && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => run('approve')}
                    disabled={busy !== null || selected.submitted === 0}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                    title="Approve all submitted results"
                  >
                    {busy === 'approve' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => run('lock')}
                    disabled={busy !== null || selected.approved === 0}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                    title="Lock all approved results"
                  >
                    {busy === 'lock' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    Lock
                  </button>
                  <button
                    type="button"
                    onClick={() => run('publish')}
                    disabled={busy !== null || selected.approved + selected.locked === 0}
                    className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                    title="Publish approved/locked results to students"
                  >
                    {busy === 'publish' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Globe className="h-3.5 w-3.5" />
                    )}
                    Publish
                  </button>
                </div>
              )
            }
          >
            {loadingRows ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading results…
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={rows}
                keyField="id"
                emptyMessage="No results entered for this course yet."
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
