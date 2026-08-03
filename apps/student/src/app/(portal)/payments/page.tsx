'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type FeesResponse } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { formatNaira } from '@goinze/shared-utils';
import { cn } from '@/lib/utils';

type FeeStatus = 'PAID' | 'PENDING';

const statusConfig: Record<FeeStatus, { label: string; cls: string; icon: typeof Clock }> = {
  PAID: { label: 'Paid', cls: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700', icon: Clock },
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export default function PaymentsPage() {
  const { profile } = useStudent();
  const [data, setData] = useState<FeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    studentApi
      .fees()
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load fees.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  /** Simulated Flutterwave checkout — in production this opens the Flutterwave inline popup. */
  function handlePayNow(id: string) {
    setPayingId(id);
    setTimeout(() => setPayingId(null), 1800);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your fees…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-500">
        {error ?? 'Unable to load fees.'}
      </div>
    );
  }

  const { items, summary } = data;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Payments"
        description="View your fee breakdown and make secure payments via Flutterwave."
      />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Total Fees ({profile?.session ?? '—'})</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNaira(summary.total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{formatNaira(summary.paid)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatNaira(summary.outstanding)}</p>
        </Card>
      </div>

      {/* Fee breakdown */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Wallet className="h-4 w-4 text-brand" /> Fee Breakdown
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Secured by Flutterwave
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No fee structures have been published for your school yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((f) => {
                  const cfg = statusConfig[f.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={f.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{f.description}</td>
                      <td className="px-4 py-4 text-xs text-slate-500">{f.type}</td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-400">{f.ref ?? '—'}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">
                        {formatNaira(f.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.cls)}>
                          <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {f.status === 'PAID' ? (
                          <span className="text-xs font-medium text-slate-400">{formatDate(f.paidAt)}</span>
                        ) : (
                          <button
                            onClick={() => handlePayNow(f.id)}
                            disabled={payingId === f.id}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            {payingId === f.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting…
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3.5 w-3.5" /> Pay Now
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs leading-relaxed text-slate-500">
          Payments are processed securely by <strong>Flutterwave</strong>. You will be redirected to the
          Flutterwave checkout to complete your payment with card, bank transfer or USSD. A receipt is
          generated automatically once payment is confirmed.
        </div>
      </Card>
    </div>
  );
}
