'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  Save,
  Send,
  Upload,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import {
  lecturerApi,
  type AllocatedCourse,
  type CourseRosterResponse,
} from '@/lib/api';
import { cn } from '@/lib/cn';

const CA_MAX = 100;
const EXAM_MAX = 100;

function clamp(value: number, max: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(max, value));
}

function gradeFor(total: number): { grade: string; className: string } {
  if (total >= 70) return { grade: 'A', className: 'bg-emerald-100 text-emerald-700' };
  if (total >= 60) return { grade: 'B', className: 'bg-blue-100 text-blue-700' };
  if (total >= 50) return { grade: 'C', className: 'bg-sky-100 text-sky-700' };
  if (total >= 45) return { grade: 'D', className: 'bg-amber-100 text-amber-700' };
  if (total >= 40) return { grade: 'E', className: 'bg-orange-100 text-orange-700' };
  return { grade: 'F', className: 'bg-red-100 text-red-700' };
}

interface ScoreEntry {
  ca: number;
  exam: number;
}

function UploadScoresInner() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams.get('course') ?? '';

  const [courses, setCourses] = useState<AllocatedCourse[]>([]);
  const [courseId, setCourseId] = useState(initialCourse);
  const [roster, setRoster] = useState<CourseRosterResponse | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [busy, setBusy] = useState<'save' | 'submit' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Load the lecturer's allocated courses once.
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

  const loadRoster = useCallback((id: string) => {
    if (!id) return;
    setLoadingRoster(true);
    setError(null);
    setNotice(null);
    lecturerApi
      .roster(id)
      .then((data) => {
        setRoster(data);
        const prefilled: Record<string, ScoreEntry> = {};
        for (const s of data.students) {
          prefilled[s.studentId] = { ca: s.caScore ?? 0, exam: s.examScore ?? 0 };
        }
        setScores(prefilled);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load the class roster.'),
      )
      .finally(() => setLoadingRoster(false));
  }, []);

  useEffect(() => {
    if (courseId) loadRoster(courseId);
  }, [courseId, loadRoster]);

  const students = roster?.students ?? [];

  const classAverage = useMemo(() => {
    if (students.length === 0) return 0;
    const totals = students.map((s) => {
      const e = scores[s.studentId] ?? { ca: 0, exam: 0 };
      return Math.min(100, e.ca + e.exam);
    });
    return Math.round(totals.reduce((a, b) => a + b, 0) / students.length);
  }, [students, scores]);

  function update(studentId: string, field: 'ca' | 'exam', raw: string, max: number) {
    setNotice(null);
    const value = clamp(Number(raw), max);
    setScores((prev) => {
      const current = prev[studentId] ?? { ca: 0, exam: 0 };
      return { ...prev, [studentId]: { ...current, [field]: value } };
    });
  }

  function buildRows() {
    return students.map((s) => {
      const e = scores[s.studentId] ?? { ca: 0, exam: 0 };
      return { studentId: s.studentId, caScore: e.ca, examScore: e.exam };
    });
  }

  async function saveDraft() {
    if (!courseId || students.length === 0) return;
    setBusy('save');
    setError(null);
    setNotice(null);
    try {
      const res = await lecturerApi.saveScores(courseId, buildRows());
      setNotice(`Draft saved for ${res.processed} student(s). You can still edit before submitting.`);
      loadRoster(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save scores.');
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    if (!courseId) return;
    setBusy('submit');
    setError(null);
    setNotice(null);
    try {
      // Persist any edits first, then move DRAFT → SUBMITTED.
      if (students.length > 0) await lecturerApi.saveScores(courseId, buildRows());
      const res = await lecturerApi.submitResults(courseId);
      setNotice(`Submitted ${res.updated} result(s) for departmental approval.`);
      loadRoster(courseId);
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
    setNotice(null);
    try {
      if (students.length > 0) await lecturerApi.saveScores(courseId, buildRows());
      const res = await lecturerApi.publishResults(courseId);
      setNotice(`Published ${res.published} result(s). Students can now view them.`);
      loadRoster(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish results.');
    } finally {
      setBusy(null);
    }
  }

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <>
      <PageHeader
        title="Upload Scores"
        subtitle="Enter continuous assessment and exam scores. Totals and grades update live."
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

      {/* Course selector */}
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
          <div className="text-sm text-slate-500">
            <p>
              Class average:{' '}
              <span className="font-semibold text-slate-900">{classAverage}%</span>
            </p>
            <p className="text-xs">CA + Exam, each out of 100 · Total capped at 100</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy !== null || students.length === 0}
              className="btn-secondary disabled:opacity-60"
            >
              {busy === 'save' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy !== null || students.length === 0}
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
              disabled={busy !== null || students.length === 0}
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

      {/* Score entry table */}
      <Card>
        <CardHeader
          title={`${selectedCourse?.code ?? 'Course'} — Score Entry`}
          subtitle={
            roster
              ? `${students.length} registered students · ${roster.session} · ${roster.course.semester} Semester`
              : 'Registered students appear here once they enrol.'
          }
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Upload className="h-3.5 w-3.5" /> Live totals
            </span>
          }
        />
        {loadingRoster ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading roster…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Matric No.</th>
                  <th className="px-5 py-3 text-center">CA ({CA_MAX})</th>
                  <th className="px-5 py-3 text-center">Exam ({EXAM_MAX})</th>
                  <th className="px-5 py-3 text-center">Total (100)</th>
                  <th className="px-5 py-3 text-center">Grade</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, index) => {
                  const e = scores[s.studentId] ?? { ca: 0, exam: 0 };
                  const total = Math.min(100, e.ca + e.exam);
                  const { grade, className } = gradeFor(total);
                  return (
                    <tr key={s.studentId} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{s.matricNo ?? '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={CA_MAX}
                          value={e.ca}
                          onChange={(ev) => update(s.studentId, 'ca', ev.target.value, CA_MAX)}
                          className="input w-20 px-2 py-1.5 text-center"
                        />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={EXAM_MAX}
                          value={e.exam}
                          onChange={(ev) => update(s.studentId, 'exam', ev.target.value, EXAM_MAX)}
                          className="input w-20 px-2 py-1.5 text-center"
                        />
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-slate-900">{total}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                            className,
                          )}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {s.resultStatus ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                              s.resultStatus === 'PUBLISHED' && 'bg-emerald-100 text-emerald-700',
                              s.resultStatus === 'SUBMITTED' && 'bg-sky-100 text-sky-700',
                              s.resultStatus === 'APPROVED' && 'bg-blue-100 text-blue-700',
                              s.resultStatus === 'DRAFT' && 'bg-amber-100 text-amber-700',
                            )}
                          >
                            {s.resultStatus.toLowerCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                      No students have registered for this course yet.
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

export default function UploadScoresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      }
    >
      <UploadScoresInner />
    </Suspense>
  );
}
