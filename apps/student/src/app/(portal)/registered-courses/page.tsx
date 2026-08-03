'use client';

import { useEffect, useState } from 'react';
import { Printer, BookOpen, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type RegisteredCoursesResponse } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

function isApproved(status: string): boolean {
  return status.toUpperCase() === 'APPROVED';
}

export default function RegisteredCoursesPage() {
  const { profile } = useStudent();
  const [data, setData] = useState<RegisteredCoursesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    studentApi
      .registeredCourses()
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load courses.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your courses…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-500">{error}</div>
    );
  }

  const registration = data?.registration ?? null;
  const courses = data?.courses ?? [];
  const totalUnits = data?.totalUnits ?? 0;
  const sessionLabel = registration?.session ?? profile?.session ?? '—';
  const semesterLabel = registration?.semester ?? '—';

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Registered Courses"
        description={`Your approved course load for ${sessionLabel} ${semesterLabel}.`}
        actions={
          <button onClick={() => window.print()} className="btn-primary">
            <Printer className="h-4 w-4" /> Print Course Form
          </button>
        }
      />

      {!registration || courses.length === 0 ? (
        <Card className="px-6 py-16 text-center text-sm text-slate-400">
          You have not registered any courses yet. Head to the Course Registration page to get started.
        </Card>
      ) : (
        <Card className="print-area overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-brand-dark to-brand px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              Goinze International School of Medical Health Science and Technology · Student Course Registration Form
            </p>
            <h2 className="mt-1 text-lg font-bold">
              {sessionLabel} — {semesterLabel} Semester
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              <p><span className="text-blue-200">Name:</span> {profile?.lastName}, {profile?.firstName} {profile?.middleName ?? ''}</p>
              <p><span className="text-blue-200">Matric No:</span> {profile?.matricNo ?? '—'}</p>
              <p><span className="text-blue-200">Level:</span> {registration.level ?? profile?.currentLevel ?? '—'}</p>
              <p><span className="text-blue-200">Dept:</span> {profile?.department ?? '—'}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">#</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3 text-center">Units</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c, i) => {
                  const approved = isApproved(c.status);
                  return (
                    <tr key={c.code} className="transition hover:bg-slate-50">
                      <td className="px-6 py-3.5 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{c.code}</td>
                      <td className="px-4 py-3.5 text-slate-700">{c.title}</td>
                      <td className="px-4 py-3.5 text-slate-500">{c.semester}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">{c.units}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                            approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700',
                          )}
                        >
                          {approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td colSpan={4} className="px-6 py-3.5 text-sm font-semibold text-slate-700">
                    Total
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-bold text-brand">{totalUnits}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-400">{courses.length} courses</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            <BookOpen className="h-4 w-4 text-brand" />
            Generated from the Goinzeschool Student Portal · {new Date().toLocaleDateString()}
          </div>
        </Card>
      )}
    </div>
  );
}
