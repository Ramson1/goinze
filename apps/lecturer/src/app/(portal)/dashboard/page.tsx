'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  Upload,
  Users,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { lecturerApi, type DashboardResponse } from '@/lib/api';
import { useLecturer } from '@/lib/lecturer-context';
import { cn } from '@/lib/cn';

export default function DashboardPage() {
  const { profile } = useLecturer();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  function load() {
    lecturerApi
      .dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setApprovingId(id);
    try {
      await lecturerApi.approveRegistration(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve registration.');
    } finally {
      setApprovingId(null);
    }
  }

  const firstName = profile?.firstName ?? data?.profile.firstName ?? 'Lecturer';

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle={
          data?.session
            ? `Here's an overview of your teaching activity · ${data.session}`
            : "Here's an overview of your teaching activity."
        }
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!data ? (
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Courses Allocated"
              value={data.stats.coursesAllocated}
              sub={data.session ?? 'Current session'}
              icon={BookOpen}
            />
            <StatCard
              label="Registered Students"
              value={data.stats.totalStudents}
              sub="Across all your courses"
              icon={Users}
              iconClassName="bg-indigo-100 text-indigo-600"
            />
            <StatCard
              label="Pending Registrations"
              value={data.stats.pendingRegistrations}
              sub="Awaiting adviser approval"
              icon={ClipboardCheck}
              iconClassName="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="Published Results"
              value={data.stats.publishedResults}
              sub="Visible to students"
              icon={FileCheck2}
              iconClassName="bg-emerald-100 text-emerald-600"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Allocated courses */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader
                  title="My Courses"
                  subtitle="Courses allocated to you this session"
                  action={
                    <Link
                      href="/courses"
                      className="text-xs font-semibold text-brand hover:text-brand-dark"
                    >
                      View all
                    </Link>
                  }
                />
                <CardBody className="space-y-3">
                  {data.courses.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">
                      No courses allocated yet.
                    </p>
                  )}
                  {data.courses.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                            {c.code}
                          </span>
                          <span className="text-xs text-slate-400">
                            {c.level} Level · {c.semester} Semester
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-slate-900">
                          {c.title}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Users className="h-3.5 w-3.5 text-brand" /> {c.studentCount}
                        </span>
                        <Link
                          href={`/upload-scores?course=${c.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20"
                        >
                          <Upload className="h-3.5 w-3.5" /> Enter scores
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>

            {/* Pending registrations */}
            <Card>
              <CardHeader
                title="Registration Approvals"
                subtitle="Course registrations awaiting your approval"
              />
              <CardBody className="space-y-3">
                {data.pendingRegistrations.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Nothing to approve right now.
                  </p>
                )}
                {data.pendingRegistrations.map((r) => (
                  <div key={r.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {r.studentName}
                      </p>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {r.totalUnits} units
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {r.matricNo ?? '—'} · {r.level} Level · {r.semester} Sem
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {r.courseCount} courses · {r.session}
                    </p>
                    <button
                      type="button"
                      onClick={() => approve(r.id)}
                      disabled={approvingId === r.id}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                    >
                      {approvingId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve registration
                    </button>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
