'use client';

import { useEffect, useState, useMemo } from 'react';
import { GraduationCap, Award, TrendingUp, Printer, Loader2, BookOpen, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type ResultsResponse, type SemesterResult } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { resolveGrade, computeGpa } from '@/lib/utils';
import { cn } from '@/lib/utils';

function classificationBadge(cls: string) {
  if (cls === 'First Class') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  if (cls === 'Second Class Upper') return 'bg-blue-50 text-brand ring-1 ring-blue-200';
  if (cls === 'Second Class Lower') return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
  if (cls === 'Third Class') return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  return 'bg-gray-50 text-gray-600 ring-1 ring-gray-200';
}

function gradeColor(grade: string | null) {
  switch (grade) {
    case 'A': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'B': return 'bg-blue-50 text-brand ring-1 ring-blue-200';
    case 'C': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
    case 'D': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    case 'E': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    case 'F': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
    default: return 'bg-gray-50 text-gray-500 ring-1 ring-gray-200';
  }
}

interface LevelGroup {
  level: number;
  semesters: SemesterResult[];
}

export default function ResultsPage() {
  const { profile } = useStudent();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    studentApi
      .results()
      .then((d) => { if (alive) setData(d); })
      .catch((err) => { if (alive) setError(err instanceof Error ? err.message : 'Failed to load results.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const levelGroups = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, SemesterResult[]>();
    for (const sem of data.semesters) {
      const lvl = sem.level;
      if (!map.has(lvl)) map.set(lvl, []);
      map.get(lvl)!.push(sem);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, semesters]): LevelGroup => ({ level, semesters }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your results…
      </div>
    );
  }
  if (error) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-500">{error}</div>;
  }
  if (!data || data.semesters.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Results" description="Your academic transcript." />
        <Card className="px-6 py-16 text-center text-sm text-slate-400">
          No results have been published yet. Check back once your lecturers release them.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Academic Transcript"
        description="Your complete academic record across all sessions."
        actions={
          <div className="flex gap-2">
            <a href="/course-registration" className="btn-secondary inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Course Registration
            </a>
            <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print Transcript
            </button>
          </div>
        }
      />

      {/* Student Info Header */}
      <Card className="print-area mb-6 overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-brand/5 via-white to-brand/5 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {profile?.lastName}, {profile?.firstName}{profile?.middleName ? ` ${profile.middleName}` : ''}
              </h2>
              <p className="mt-1 font-mono text-sm font-semibold text-brand">{profile?.matricNo ?? '—'}</p>
              {profile?.department && (
                <p className="mt-1 text-sm text-slate-600">{profile.department}</p>
              )}
              {profile?.programme && (
                <p className="text-sm text-slate-500">{profile.programme}</p>
              )}
            </div>
            <div className="text-left sm:text-right">
              {profile?.email && <p className="text-sm text-slate-600">{profile.email}</p>}
              {profile?.phone && <p className="text-sm text-slate-500">{profile.phone}</p>}
              {profile?.session && <p className="mt-1 text-xs font-medium text-slate-400">Session: {profile.session}</p>}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 px-6 py-5 sm:grid-cols-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-400">CGPA</p>
              <p className="text-xl font-bold text-slate-900">{data.cgpa.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-400">Classification</p>
              <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-bold', classificationBadge(data.classification))}>
                {data.classification}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-400">Passed</p>
              <p className="text-xl font-bold text-emerald-600">{data.passed ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <XCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-400">Failed</p>
              <p className="text-xl font-bold text-red-500">{data.failed ?? 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transcript Body - All Levels */}
      <div className="space-y-6">
        {levelGroups.map((lg) => (
          <LevelSection key={lg.level} group={lg} />
        ))}
      </div>

      {/* Grading Key */}
      <Card className="mt-6 px-6 py-4">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Grading System</h3>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-700">A (70–100) = 5</span>
          <span className="rounded bg-blue-50 px-2 py-1 font-medium text-brand">B (60–69) = 4</span>
          <span className="rounded bg-indigo-50 px-2 py-1 font-medium text-indigo-700">C (50–59) = 3</span>
          <span className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-700">D (45–49) = 2</span>
          <span className="rounded bg-orange-50 px-2 py-1 font-medium text-orange-700">E (40–44) = 1</span>
          <span className="rounded bg-red-50 px-2 py-1 font-medium text-red-700">F (0–39) = 0</span>
        </div>
      </Card>
    </div>
  );
}

function LevelSection({ group }: { group: LevelGroup }) {
  const levelCourses = group.semesters.flatMap((s) => s.courses);
  const levelGpa = computeGpa(levelCourses.map((c) => ({ creditUnits: c.units, score: c.score })));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Level Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
        <h3 className="text-base font-bold text-slate-900">{group.level} Level</h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Total Units: <strong className="text-slate-700">{levelGpa.totalUnits}</strong></span>
          <span>GPA: <strong className="text-brand">{levelGpa.gpa.toFixed(2)}</strong></span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', classificationBadge(levelGpa.classification))}>
            {levelGpa.classification}
          </span>
        </div>
      </div>

      {/* Semesters */}
      <div className="divide-y divide-slate-100">
        {group.semesters.map((sem) => (
          <SemesterTable key={sem.id} semester={sem} />
        ))}
      </div>
    </div>
  );
}

function SemesterTable({ semester }: { semester: SemesterResult }) {
  const semGpa = computeGpa(semester.courses.map((c) => ({ creditUnits: c.units, score: c.score })));

  return (
    <div>
      {/* Semester Header */}
      <div className="flex items-center justify-between bg-slate-50/50 px-6 py-2">
        <h4 className="text-sm font-semibold text-slate-700">
          {semester.semester} Semester
        </h4>
        <span className="text-xs text-slate-400">
          {semester.session} · GPA: <strong className="text-brand">{semester.gpa.toFixed(2)}</strong>
        </span>
      </div>

      {/* Course Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-6 py-2.5">Course Code</th>
              <th className="px-4 py-2.5">Course Title</th>
              <th className="px-3 py-2.5 text-center">CU</th>
              <th className="px-3 py-2.5 text-center">Session</th>
              <th className="px-3 py-2.5 text-center">Score</th>
              <th className="px-3 py-2.5 text-center">Grade</th>
              <th className="px-6 py-2.5">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {semester.courses.map((c) => {
              const band = resolveGrade(c.score);
              return (
                <tr key={c.resultId || c.code} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-2.5 font-bold text-slate-900">{c.code}</td>
                  <td className="px-4 py-2.5 text-slate-700">{c.title}</td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{c.units}</td>
                  <td className="px-3 py-2.5 text-center text-xs text-slate-400">{c.session}</td>
                  <td className="px-3 py-2.5 text-center font-semibold text-slate-800">{c.score}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', gradeColor(band.grade))}>
                      {band.grade}
                    </span>
                  </td>
                  <td className="px-6 py-2.5">
                    {band.grade === 'F' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                        <AlertTriangle className="h-3 w-3" /> Failed
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">{band.remark}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/80">
              <td colSpan={2} className="px-6 py-2.5 text-xs font-semibold text-slate-600">Semester Summary</td>
              <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-700">{semGpa.totalUnits}</td>
              <td></td>
              <td colSpan={2} className="px-3 py-2.5 text-center text-xs font-bold text-brand">GPA {semester.gpa.toFixed(2)}</td>
              <td className="px-6 py-2.5">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', classificationBadge(semGpa.classification))}>
                  {semGpa.classification}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
