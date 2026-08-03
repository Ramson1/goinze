'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Award, TrendingUp, Printer, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type ResultsResponse, type SemesterResult } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { resolveGrade, computeGpa } from '@goinze/shared-utils';
import { cn } from '@/lib/utils';

function classificationBadge(cls: string) {
  if (cls === 'First Class') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  if (cls === 'Second Class Upper') return 'bg-blue-50 text-brand ring-1 ring-blue-200';
  if (cls === 'Second Class Lower') return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
}

export default function ResultsPage() {
  const { profile } = useStudent();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    studentApi
      .results()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setActiveId(d.semesters[d.semesters.length - 1]?.id ?? null);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load results.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your results…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-500">{error}</div>
    );
  }

  if (!data || data.semesters.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Results" description="Your semester-by-semester academic results and cumulative standing." />
        <Card className="px-6 py-16 text-center text-sm text-slate-400">
          No results have been published yet. Check back once your lecturers release them.
        </Card>
      </div>
    );
  }

  const active: SemesterResult = data.semesters.find((s) => s.id === activeId) ?? data.semesters[0]!;
  const semGpa = computeGpa(active.courses.map((c) => ({ creditUnits: c.units, score: c.score })));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Results"
        description="Your semester-by-semester academic results and cumulative standing."
        actions={
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" /> Print
          </button>
        }
      />

      {/* GPA / CGPA summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-brand">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">Semester GPA</p>
              <p className="text-2xl font-bold text-slate-900">{semGpa.gpa.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">Cumulative CGPA</p>
              <p className="text-2xl font-bold text-slate-900">{data.cgpa.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">Classification</p>
              <span className={cn('mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold', classificationBadge(data.classification))}>
                {data.classification}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Semester selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {data.semesters.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={cn(
              'rounded-lg px-3.5 py-2 text-xs font-semibold transition',
              s.id === active.id
                ? 'bg-brand text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {s.session} · {s.semester}
          </button>
        ))}
      </div>

      {/* Result table */}
      <Card className="print-area overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {profile?.matricNo ?? '—'} · {profile?.programme ?? ''}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            {active.session} — {active.semester} Semester ({active.level} Level)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Code</th>
                <th className="px-4 py-3">Course Title</th>
                <th className="px-4 py-3 text-center">Units</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-center">Points</th>
                <th className="px-6 py-3">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {active.courses.map((c) => {
                const band = resolveGrade(c.score);
                return (
                  <tr key={c.code} className="transition hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{c.code}</td>
                    <td className="px-4 py-3.5 text-slate-700">{c.title}</td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{c.units}</td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{c.score}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                          band.grade === 'A' && 'bg-green-50 text-green-700',
                          band.grade === 'B' && 'bg-blue-50 text-brand',
                          band.grade === 'C' && 'bg-indigo-50 text-indigo-700',
                          (band.grade === 'D' || band.grade === 'E') && 'bg-amber-50 text-amber-700',
                          band.grade === 'F' && 'bg-red-50 text-red-700',
                        )}
                      >
                        {band.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{band.point}</td>
                    <td className="px-6 py-3.5 text-slate-500">{band.remark}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={2} className="px-6 py-3.5 text-sm font-semibold text-slate-700">
                  Semester Summary
                </td>
                <td className="px-4 py-3.5 text-center text-sm font-bold text-slate-700">{semGpa.totalUnits}</td>
                <td colSpan={2} className="px-4 py-3.5 text-center text-sm font-bold text-brand">
                  GPA {semGpa.gpa.toFixed(2)}
                </td>
                <td colSpan={2} className="px-6 py-3.5 text-sm">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', classificationBadge(semGpa.classification))}>
                    {semGpa.classification}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
          Grading: A (70–100) = 5 · B (60–69) = 4 · C (50–59) = 3 · D (45–49) = 2 · E (40–44) = 1 · F (0–39) = 0
        </div>
      </Card>
    </div>
  );
}
