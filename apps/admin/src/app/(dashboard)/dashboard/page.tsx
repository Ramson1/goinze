'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import RevenueChart from '@/components/charts/RevenueChart';
import AdmissionsChart from '@/components/charts/AdmissionsChart';
import {
  analyticsApi,
  admissionsApi,
  financeApi,
  type AdmissionsPoint,
  type DashboardSummary,
  type RevenuePoint,
} from '@/lib/api';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' });
}

const activityColumns: Column<ActivityItem>[] = [
  {
    key: 'user',
    header: 'User',
    render: (row) => (
      <span className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
          {initials(row.user)}
        </span>
        <span className="font-medium text-gray-900">{row.user}</span>
      </span>
    ),
  },
  { key: 'action', header: 'Action' },
  { key: 'target', header: 'Target', className: 'font-mono text-xs' },
  {
    key: 'time',
    header: 'Time',
    className: 'whitespace-nowrap text-gray-400',
    render: (row) => relativeTime(row.time),
  },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionsPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dash, rev, adm, apps, pays] = await Promise.all([
          analyticsApi.dashboard(),
          analyticsApi.revenueByMonth(),
          analyticsApi.admissionsByMonth(),
          admissionsApi.list({ page: 1, pageSize: 5 }).catch(() => null),
          financeApi.payments({ page: 1, pageSize: 5 }).catch(() => null),
        ]);
        if (cancelled) return;

        setSummary(dash);
        setRevenue(rev);
        setAdmissions(adm);

        const items: ActivityItem[] = [];
        for (const a of apps?.items ?? []) {
          items.push({
            id: `app-${a.id}`,
            user: `${a.firstName} ${a.lastName}`,
            action: 'Submitted application',
            target: a.applicationNo,
            time: a.createdAt,
          });
        }
        for (const p of pays?.items ?? []) {
          const name = p.student
            ? `${p.student.firstName} ${p.student.lastName}`
            : 'Applicant';
          items.push({
            id: `pay-${p.id}`,
            user: name,
            action: p.status === 'SUCCESS' ? `Paid ${formatNaira(Number(p.amount))}` : `Payment ${p.status.toLowerCase()}`,
            target: p.reference,
            time: p.paidAt ?? p.createdAt,
          });
        }
        items.sort((x, y) => new Date(y.time).getTime() - new Date(x.time).getTime());
        setActivity(items.slice(0, 8));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening at your school today."
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Students"
              value={summary ? summary.counts.students.toLocaleString() : '—'}
              icon={Users}
            />
            <StatCard
              title="Applications"
              value={summary ? summary.counts.applications.toLocaleString() : '—'}
              icon={UserPlus}
              iconClassName="bg-amber-500/10 text-amber-600"
            />
            <StatCard
              title="Revenue Collected"
              value={summary ? formatNaira(summary.revenue) : '—'}
              icon={Wallet}
            />
            <StatCard
              title="Pending Payments"
              value={summary ? summary.counts.pendingPayments.toLocaleString() : '—'}
              icon={ClipboardCheck}
              iconClassName="bg-rose-500/10 text-rose-600"
            />
          </div>

          {/* Staff breakdown cards */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Staff"
              value={summary ? summary.counts.staff.toLocaleString() : '—'}
              icon={Briefcase}
              iconClassName="bg-teal-500/10 text-teal-600"
            />
            <StatCard
              title="Lecturers"
              value={summary ? summary.staffCounts.lecturers.toLocaleString() : '—'}
              icon={GraduationCap}
              iconClassName="bg-indigo-500/10 text-indigo-600"
            />
            <StatCard
              title="Non-Academic Staff"
              value={summary ? summary.staffCounts.nonAcademic.toLocaleString() : '—'}
              icon={Users}
              iconClassName="bg-orange-500/10 text-orange-600"
            />
            <StatCard
              title="Administrative Staff"
              value={summary ? summary.staffCounts.administrative.toLocaleString() : '—'}
              icon={Briefcase}
              iconClassName="bg-violet-500/10 text-violet-600"
            />
          </div>

          {/* Charts */}
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Revenue" subtitle="Collected fees — last 12 months">
              <div className="p-5">
                <RevenueChart data={revenue} />
              </div>
            </Card>
            <Card title="Admissions" subtitle="Applications vs admits — last 12 months">
              <div className="p-5">
                <AdmissionsChart data={admissions} />
              </div>
            </Card>
          </div>

          {/* Recent activity */}
          <Card
            title="Recent Activity"
            subtitle="Latest applications and payments"
            className="mt-6"
          >
            <DataTable
              columns={activityColumns}
              rows={activity}
              keyField="id"
              emptyMessage="No recent activity yet."
            />
          </Card>
        </>
      )}
    </>
  );
}
