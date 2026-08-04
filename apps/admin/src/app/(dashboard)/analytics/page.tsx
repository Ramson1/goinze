'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Download, FileText, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import {
  EnrollmentBarChart,
  GenderDonutChart,
  PaymentMethodsChart,
  RevenueTrendChart,
  StaffByDepartmentChart,
  StaffCategoryChart,
  StaffBreakdownChart,
  StudentStaffRatioChart,
  PaymentStatusChart,
  EnrollmentTrendChart,
  ProgrammeEnrollmentChart,
} from '@/components/charts/AnalyticsCharts';
import {
  analyticsApi,
  type NameValue,
  type RevenuePoint,
  type RatioPoint,
  type PaymentStatusPoint,
  type EnrollmentTrendPoint,
  type StaffBreakdownPoint,
} from '@/lib/api';

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function gatewayLabel(gateway: string): string {
  const map: Record<string, string> = {
    FLUTTERWAVE: 'Flutterwave',
    PAYSTACK: 'Paystack',
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
  };
  return map[gateway] ?? titleCase(gateway);
}

function toPercent(rows: NameValue[]): NameValue[] {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  if (total === 0) return [];
  return rows.map((r) => ({ name: r.name, value: Math.round((r.value / total) * 100) }));
}

function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printSection(title: string) {
  window.print();
}

export default function AnalyticsPage() {
  const [enrollment, setEnrollment] = useState<NameValue[]>([]);
  const [gender, setGender] = useState<NameValue[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [methods, setMethods] = useState<NameValue[]>([]);
  const [staffDept, setStaffDept] = useState<NameValue[]>([]);
  const [staffCat, setStaffCat] = useState<NameValue[]>([]);
  const [staffBreakdown, setStaffBreakdown] = useState<StaffBreakdownPoint[]>([]);
  const [ratio, setRatio] = useState<RatioPoint[]>([]);
  const [payStatus, setPayStatus] = useState<PaymentStatusPoint[]>([]);
  const [enrollTrend, setEnrollTrend] = useState<EnrollmentTrendPoint[]>([]);
  const [programme, setProgramme] = useState<NameValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [enr, gen, rev, pay, sd, sc, sb, rt, ps, et, prog] = await Promise.all([
        analyticsApi.enrollmentByDepartment(),
        analyticsApi.genderDistribution(),
        analyticsApi.revenueByMonth(),
        analyticsApi.paymentMethods(),
        analyticsApi.staffByDepartment(),
        analyticsApi.staffByCategory(),
        analyticsApi.staffBreakdown(),
        analyticsApi.studentStaffRatio(),
        analyticsApi.paymentStatusBreakdown(),
        analyticsApi.enrollmentTrend(),
        analyticsApi.programmeEnrollment(),
      ]);
      setEnrollment(enr);
      setGender(gen.map((g) => ({ name: titleCase(g.name), value: g.value })));
      setRevenue(rev);
      setMethods(toPercent(pay).map((p) => ({ name: gatewayLabel(p.name), value: p.value })));
      setStaffDept(sd);
      setStaffCat(sc.map((s) => ({ name: titleCase(s.name), value: s.value })));
      setStaffBreakdown(sb);
      setRatio(rt);
      setPayStatus(ps.map((p) => ({ name: titleCase(p.name), count: p.count, amount: p.amount })));
      setEnrollTrend(et);
      setProgramme(prog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function exportAllCSV() {
    downloadCSV('enrollment-by-department.csv', enrollment);
    setTimeout(() => downloadCSV('gender-distribution.csv', gender), 100);
    setTimeout(() => downloadCSV('revenue-by-month.csv', revenue), 200);
    setTimeout(() => downloadCSV('staff-by-department.csv', staffDept), 300);
    setTimeout(() => downloadCSV('staff-by-category.csv', staffCat), 400);
    setTimeout(() => downloadCSV('staff-breakdown.csv', staffBreakdown), 500);
    setTimeout(() => downloadCSV('student-staff-ratio.csv', ratio), 600);
    setTimeout(() => downloadCSV('enrollment-trend.csv', enrollTrend), 700);
    setTimeout(() => downloadCSV('programme-enrollment.csv', programme), 800);
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #analytics-print, #analytics-print * { visibility: visible !important; }
          #analytics-print {
            display: block !important;
            position: absolute;
            inset: 0;
            padding: 16px;
            background: white;
          }
          #analytics-print .print-card {
            page-break-inside: avoid;
            margin-bottom: 16px;
            border: 1px solid #e5e7eb;
            padding: 12px;
            border-radius: 8px;
          }
        }
      `}</style>

      <PageHeader
        title="Analytics"
        subtitle="Institutional insights across enrollment, finance, staff and demographics."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportAllCSV} className="btn-secondary flex items-center gap-1.5">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button type="button" onClick={() => printSection('Analytics')} className="btn-primary flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Export PDF
            </button>
          </div>
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
          <Loader2 className="h-5 w-5 animate-spin" /> Loading analytics…
        </div>
      ) : (
        <div ref={printRef}>
          {/* Row 1: Enrollment + Gender */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Enrollment by Department" subtitle="Students per department">
              <div className="p-5">
                <EnrollmentBarChart data={enrollment} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('enrollment-by-department.csv', enrollment)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
            <Card title="Gender Distribution" subtitle="Student population by gender">
              <div className="p-5">
                <GenderDonutChart data={gender} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('gender-distribution.csv', gender)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
          </div>

          {/* Row 2: Revenue + Payment Methods */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Revenue Trend" subtitle="Collected fees — last 12 months">
              <div className="p-5">
                <RevenueTrendChart data={revenue} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('revenue-by-month.csv', revenue)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
            <Card title="Payment Methods" subtitle="Share of transactions by channel">
              <div className="p-5">
                <PaymentMethodsChart data={methods} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('payment-methods.csv', methods)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
          </div>

          {/* Row 3: Staff charts */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Staff by Department" subtitle="Total staff distribution across departments">
              <div className="p-5">
                <StaffByDepartmentChart data={staffDept} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('staff-by-department.csv', staffDept)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
            <Card title="Staff Category" subtitle="Breakdown by category (Academic / Non-Academic / Admin)">
              <div className="p-5">
                <StaffCategoryChart data={staffCat} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('staff-by-category.csv', staffCat)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
          </div>

          {/* Row 3b: Staff Breakdown */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Staff Breakdown by Department" subtitle="Lecturers vs Non-Academic vs Administrative staff per department">
              <div className="p-5">
                <StaffBreakdownChart data={staffBreakdown} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('staff-breakdown.csv', staffBreakdown)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
            <Card title="Student-to-Staff Ratio" subtitle="Comparison per department">
              <div className="p-5">
                <StudentStaffRatioChart data={ratio} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('student-staff-ratio.csv', ratio)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
          </div>

          {/* Row 4: Payment Status + Enrollment Trend */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Payment Status Breakdown" subtitle="Transaction count and amount by status">
              <div className="p-5">
                <PaymentStatusChart data={payStatus} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('payment-status-breakdown.csv', payStatus)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
            <Card title="Enrollment Trend" subtitle="New students registered per month — last 12 months">
              <div className="p-5">
                <EnrollmentTrendChart data={enrollTrend} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('enrollment-trend.csv', enrollTrend)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
          </div>

          {/* Row 5: Programme Enrollment */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Programme Enrollment" subtitle="Students per academic programme">
              <div className="p-5">
                <ProgrammeEnrollmentChart data={programme} />
              </div>
              <div className="border-t border-gray-100 px-5 py-2 text-right">
                <button onClick={() => downloadCSV('programme-enrollment.csv', programme)} className="text-xs text-brand hover:underline">
                  <Download className="mr-1 inline h-3 w-3" /> CSV
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Print-only area */}
      <div id="analytics-print" className="hidden">
        <h1 className="mb-4 text-xl font-bold">Goinzeschool Analytics Report</h1>
        <p className="mb-4 text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
        <div className="print-card">
          <h2 className="font-semibold">Enrollment by Department</h2>
          <table className="mt-2 w-full text-sm"><thead><tr><th className="text-left">Department</th><th>Students</th></tr></thead>
            <tbody>{enrollment.map((r) => <tr key={r.name}><td>{r.name}</td><td className="text-center">{r.value}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="print-card">
          <h2 className="font-semibold">Gender Distribution</h2>
          <table className="mt-2 w-full text-sm"><thead><tr><th className="text-left">Gender</th><th>Count</th></tr></thead>
            <tbody>{gender.map((r) => <tr key={r.name}><td>{r.name}</td><td className="text-center">{r.value}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="print-card">
          <h2 className="font-semibold">Revenue by Month</h2>
          <table className="mt-2 w-full text-sm"><thead><tr><th className="text-left">Month</th><th>Revenue</th></tr></thead>
            <tbody>{revenue.map((r) => <tr key={r.month}><td>{r.month}</td><td className="text-center">₦{r.revenue.toLocaleString()}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="print-card">
          <h2 className="font-semibold">Staff by Department</h2>
          <table className="mt-2 w-full text-sm"><thead><tr><th className="text-left">Department</th><th>Staff</th></tr></thead>
            <tbody>{staffDept.map((r) => <tr key={r.name}><td>{r.name}</td><td className="text-center">{r.value}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="print-card">
          <h2 className="font-semibold">Student-to-Staff Ratio</h2>
          <table className="mt-2 w-full text-sm"><thead><tr><th className="text-left">Department</th><th>Students</th><th>Staff</th></tr></thead>
            <tbody>{ratio.map((r) => <tr key={r.name}><td>{r.name}</td><td className="text-center">{r.students}</td><td className="text-center">{r.staff}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="print-card">
          <h2 className="font-semibold">Enrollment Trend</h2>
          <table className="mt-2 w-full text-sm"><thead><tr><th className="text-left">Month</th><th>New Students</th></tr></thead>
            <tbody>{enrollTrend.map((r) => <tr key={r.month}><td>{r.month}</td><td className="text-center">{r.count}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
