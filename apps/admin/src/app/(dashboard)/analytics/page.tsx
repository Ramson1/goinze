'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import {
  EnrollmentBarChart,
  GenderDonutChart,
  PaymentMethodsChart,
  RevenueTrendChart,
} from '@/components/charts/AnalyticsCharts';
import {
  analyticsApi,
  type NameValue,
  type RevenuePoint,
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

/** Convert raw counts into whole-number percentages that sum to ~100. */
function toPercent(rows: NameValue[]): NameValue[] {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  if (total === 0) return [];
  return rows.map((r) => ({ name: r.name, value: Math.round((r.value / total) * 100) }));
}

export default function AnalyticsPage() {
  const [enrollment, setEnrollment] = useState<NameValue[]>([]);
  const [gender, setGender] = useState<NameValue[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [methods, setMethods] = useState<NameValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [enr, gen, rev, pay] = await Promise.all([
          analyticsApi.enrollmentByDepartment(),
          analyticsApi.genderDistribution(),
          analyticsApi.revenueByMonth(),
          analyticsApi.paymentMethods(),
        ]);
        if (cancelled) return;

        setEnrollment(enr);
        setGender(gen.map((g) => ({ name: titleCase(g.name), value: g.value })));
        setRevenue(rev);
        setMethods(
          toPercent(pay).map((p) => ({ name: gatewayLabel(p.name), value: p.value })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics.');
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
        title="Analytics"
        subtitle="Institutional insights across enrollment, finance and demographics."
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card title="Enrollment by Department" subtitle="Students per department">
            <div className="p-5">
              <EnrollmentBarChart data={enrollment} />
            </div>
          </Card>
          <Card title="Gender Distribution" subtitle="Student population by gender">
            <div className="p-5">
              <GenderDonutChart data={gender} />
            </div>
          </Card>
          <Card title="Revenue Trend" subtitle="Collected fees — last 12 months">
            <div className="p-5">
              <RevenueTrendChart data={revenue} />
            </div>
          </Card>
          <Card title="Payment Methods" subtitle="Share of transactions by channel">
            <div className="p-5">
              <PaymentMethodsChart data={methods} />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
