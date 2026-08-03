'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Wallet,
  BookOpen,
  MonitorSmartphone,
  ArrowRight,
  ClipboardList,
  Receipt,
  IdCard,
  CalendarDays,
  Megaphone,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import { studentApi, type DashboardResponse, type ResultsResponse } from '@/lib/api';
import { formatNaira } from '@goinze/shared-utils';

const quickLinks = [
  { label: 'Register Courses', href: '/course-registration', icon: ClipboardList },
  { label: 'Make a Payment', href: '/payments', icon: Wallet },
  { label: 'View Results', href: '/results', icon: GraduationCap },
  { label: 'Digital ID', href: '/digital-id', icon: IdCard },
  { label: 'Download Receipts', href: '/receipts', icon: Receipt },
  { label: 'Academic Calendar', href: '/academic-calendar', icon: CalendarDays },
];

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [trend, setTrend] = useState<{ semester: string; gpa: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([studentApi.dashboard(), studentApi.results()])
      .then(([dash, results]: [DashboardResponse, ResultsResponse]) => {
        if (!alive) return;
        setData(dash);
        setTrend(
          results.semesters.map((s) => ({
            semester: `${s.session} ${s.semester}`.trim(),
            gpa: s.gpa,
          })),
        );
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-500">
        {error ?? 'Unable to load dashboard.'}
      </div>
    );
  }

  const { profile, cgpa, classification, outstandingFees, registeredUnits, registeredCount, upcomingExams, announcements } = data;
  const nextExam = upcomingExams[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-dark via-brand to-brand-light p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-red-400/20" />
        <div className="relative">
          <p className="text-sm font-medium text-blue-100">
            {profile.session ?? '—'} · {profile.programme ?? ''}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Welcome back, {profile.firstName}! 👋
          </h1>
          <p className="mt-2 max-w-xl text-sm text-blue-100">
            {profile.currentLevel ? `You're in ${profile.currentLevel} level` : 'Welcome to your portal'}
            {profile.department ? ` studying ${profile.department}` : ''}. Here's what's happening
            with your academics today.
          </p>
          <Link
            href="/course-registration"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Complete Course Registration <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Current CGPA"
          value={cgpa.toFixed(2)}
          sub={`${classification} · ${registeredUnits} units registered`}
          iconClass="bg-blue-50 text-brand"
        />
        <StatCard
          icon={Wallet}
          label="Outstanding Fees"
          value={formatNaira(outstandingFees)}
          sub={outstandingFees > 0 ? 'Settle to avoid restrictions' : 'All fees settled'}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={BookOpen}
          label="Registered Courses"
          value={String(registeredCount)}
          sub={`${registeredUnits} credit units`}
          iconClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={MonitorSmartphone}
          label="Upcoming Exams"
          value={String(upcomingExams.length)}
          sub={nextExam ? `Next: ${nextExam.title}` : 'No exams scheduled'}
          iconClass="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Chart + announcements */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* GPA trend */}
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Semester GPA Trend</h2>
              <p className="text-sm text-slate-500">Your performance across all released semesters</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">
              5.0 scale
            </span>
          </div>
          <div className="h-72 w-full">
            {trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No released results yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="semester"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
                    }}
                    formatter={(value) => [Number(value).toFixed(2), 'GPA']}
                  />
                  <ReferenceLine y={4.5} stroke="#f59e0b" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Announcements */}
        <Card className="flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Megaphone className="h-4 w-4 text-amber-500" /> Announcements
            </h2>
            <Link href="/notifications" className="text-xs font-medium text-brand hover:text-brand-dark">
              View all
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-400">No announcements right now.</p>
          ) : (
            <ul className="flex-1 space-y-4">
              {announcements.map((a) => (
                <li key={a.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Announcement
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDate(a.date)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Quick Links</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {quickLinks.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group flex flex-col items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-5 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-brand transition group-hover:bg-brand group-hover:text-white">
                <q.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-700">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
