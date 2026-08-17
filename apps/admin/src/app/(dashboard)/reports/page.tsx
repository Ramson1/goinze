'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import {
  reportsApi,
  type AdmissionsReport,
  type AttendanceReport,
  type PaymentsReport,
  type ResultsReport,
  type StudentsReport,
} from '@/lib/api';

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shareOf(count: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface BreakdownRow {
  label: string;
  count: number;
  amount?: number;
}

interface Section {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  rows: BreakdownRow[];
  money?: boolean;
  footnote?: string;
}

const CSV_HEADER = ['Section', 'Label', 'Count', 'Amount'];

function sectionCsvRows(section: Section): (string | number)[][] {
  return section.rows.map((r) => [section.title, r.label, r.count, r.amount ?? '']);
}

function BreakdownCard({ section }: { section: Section }) {
  const total = section.rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <Card
      title={section.title}
      subtitle={section.subtitle}
      action={
        <button
          type="button"
          onClick={() => downloadCsv(`${section.key}.csv`, CSV_HEADER, sectionCsvRows(section))}
          className="btn-secondary px-2.5 py-1.5"
          aria-label={`Export ${section.title} as CSV`}
          title="Download CSV"
        >
          <Download className="h-4 w-4" />
        </button>
      }
    >
      <div className="p-5">
        {section.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No records yet.</p>
        ) : (
          <ul className="space-y-3.5">
            {section.rows.map((row) => {
              const pct = total > 0 ? (row.count / total) * 100 : 0;
              return (
                <li key={row.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-gray-700">{row.label}</span>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      {row.amount !== undefined && (
                        <span className="text-xs font-semibold text-emerald-700">
                          {formatNaira(row.amount)}
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">
                        {row.count.toLocaleString()}
                      </span>
                      <span className="w-9 text-right text-xs text-gray-400">
                        {shareOf(row.count, total)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-brand transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {section.footnote && (
          <p className="mt-4 border-t border-gray-100 pt-3 text-xs font-medium text-gray-500">
            {section.footnote}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function ReportsPage() {
  const [students, setStudents] = useState<StudentsReport | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionsReport | null>(null);
  const [payments, setPayments] = useState<PaymentsReport | null>(null);
  const [results, setResults] = useState<ResultsReport | null>(null);
  const [attendance, setAttendance] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [st, ad, pa, re, at] = await Promise.all([
          reportsApi.students(),
          reportsApi.admissions(),
          reportsApi.payments(),
          reportsApi.results(),
          reportsApi.attendance(),
        ]);
        if (cancelled) return;
        setStudents(st);
        setAdmissions(ad);
        setPayments(pa);
        setResults(re);
        setAttendance(at);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reports.');
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

  const sections = useMemo<Section[]>(() => {
    const list: Section[] = [];

    if (students) {
      list.push(
        {
          key: 'students-by-status',
          title: 'Students by Status',
          subtitle: `${students.total.toLocaleString()} student${students.total === 1 ? '' : 's'} on record`,
          icon: Users,
          rows: students.byStatus.map((r) => ({
            label: titleCase(r.status),
            count: r.count,
          })),
        },
        {
          key: 'students-by-gender',
          title: 'Students by Gender',
          subtitle: 'Demographic distribution',
          icon: Users,
          rows: students.byGender.map((r) => ({
            label: r.gender ? titleCase(r.gender) : 'Not specified',
            count: r.count,
          })),
        },
      );
    }

    if (admissions) {
      list.push({
        key: 'admissions-by-status',
        title: 'Applications by Status',
        subtitle: `${admissions.total.toLocaleString()} application${admissions.total === 1 ? '' : 's'} received`,
        icon: UserPlus,
        rows: admissions.byStatus.map((r) => ({
          label: titleCase(r.status),
          count: r.count,
        })),
      });
    }

    if (payments) {
      list.push({
        key: 'payments-by-status',
        title: 'Payments by Status',
        subtitle: `${formatNaira(payments.totalCollected)} collected`,
        icon: Wallet,
        money: true,
        rows: payments.byStatus.map((r) => ({
          label: titleCase(r.status),
          count: r.count,
          amount: r.amount,
        })),
      });
    }

    if (results) {
      list.push({
        key: 'results-by-grade',
        title: 'Results by Grade',
        subtitle: `${results.total.toLocaleString()} result${results.total === 1 ? '' : 's'} recorded`,
        icon: GraduationCap,
        rows: results.byGrade.map((r) => ({
          label: r.grade ?? 'Ungraded',
          count: r.count,
        })),
      });
    }

    if (attendance) {
      const total = attendance.byStatus.reduce((sum, r) => sum + r.count, 0);
      const attended = attendance.byStatus
        .filter((r) => r.status === 'PRESENT' || r.status === 'LATE')
        .reduce((sum, r) => sum + r.count, 0);
      list.push({
        key: 'attendance-by-status',
        title: 'Attendance by Status',
        subtitle: `${total.toLocaleString()} attendance record${total === 1 ? '' : 's'}`,
        icon: ClipboardCheck,
        rows: attendance.byStatus.map((r) => ({
          label: titleCase(r.status),
          count: r.count,
        })),
        footnote:
          total > 0
            ? `Attendance rate (present + late): ${Math.round((attended / total) * 100)}%`
            : undefined,
      });
    }

    return list;
  }, [students, admissions, payments, results, attendance]);

  const exportAll = () =>
    downloadCsv(
      'goinzeschool-reports.csv',
      CSV_HEADER,
      sections.flatMap(sectionCsvRows),
    );

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Institutional summaries across students, admissions, finance, results and attendance."
        action={
          <button
            type="button"
            onClick={exportAll}
            disabled={loading || sections.length === 0}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export All (CSV)
          </button>
        }
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading reports…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Students"
              value={students ? students.total.toLocaleString() : '—'}
              icon={Users}
            />
            <StatCard
              title="Applications"
              value={admissions ? admissions.total.toLocaleString() : '—'}
              icon={UserPlus}
              iconClassName="bg-sky-500/10 text-sky-600"
            />
            <StatCard
              title="Fees Collected"
              value={payments ? formatNaira(payments.totalCollected) : '—'}
              icon={Wallet}
              iconClassName="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              title="Results Recorded"
              value={results ? results.total.toLocaleString() : '—'}
              icon={GraduationCap}
              iconClassName="bg-violet-500/10 text-violet-600"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <BreakdownCard key={section.key} section={section} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
