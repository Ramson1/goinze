'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Printer,
  X,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import PaymentModal, { type FlutterwaveResponse } from '@/components/PaymentModal';
import { studentApi, financeApi, type FeesResponse, type FeeItem, type VerifyPaymentResult } from '@/lib/api';
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
  const [payingItem, setPayingItem] = useState<FeeItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [receipt, setReceipt] = useState<VerifyPaymentResult | null>(null);
  const [publicKey, setPublicKey] = useState('');

  const refreshFees = () => {
    studentApi.fees()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load fees.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let alive = true;
    studentApi
      .fees()
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load fees.'))
      .finally(() => alive && setLoading(false));
    // Fetch Flutterwave public key from API
    financeApi.getFlutterwaveConfig()
      .then((cfg) => alive && setPublicKey(cfg.publicKey))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  /** Initiate payment — creates server-side record then opens modal */
  async function handlePayNow(item: FeeItem) {
    setPayingItem(item);
    setError(null);
    try {
      const res = await financeApi.initPayment({
        feeStructureId: item.id,
        amount: item.amount,
        customerEmail: profile?.email ?? undefined,
      });
      // Open the Flutterwave modal with the txRef from the server
      setPayingItem({ ...item, ref: res.reference });
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not initiate payment.');
      setPayingItem(null);
    }
  }

  /** Called when Flutterwave checkout completes successfully */
  async function handlePaymentSuccess(response: FlutterwaveResponse) {
    setModalOpen(false);
    setVerifying(true);
    try {
      const result = await financeApi.verifyPayment(response.tx_ref);
      setReceipt(result);
      refreshFees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment verification failed.');
    } finally {
      setVerifying(false);
      setPayingItem(null);
    }
  }

  /** Called when user closes the modal without paying */
  function handleModalClose() {
    setModalOpen(false);
    setPayingItem(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your fees…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  const { items, summary } = data!;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Payments"
        description="View your fee breakdown and make secure payments via Flutterwave."
      />

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{f.description}</span>
                        {f.isOptional && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">Optional</span>
                        )}
                      </td>
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
                            onClick={() => handlePayNow(f)}
                            disabled={!!payingItem}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            {payingItem?.id === f.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing…
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
          Payments are processed securely by <strong>Flutterwave</strong>. Pay with card, bank transfer or USSD.
          A receipt is generated automatically once payment is confirmed.
        </div>
      </Card>

      {/* Flutterwave Payment Modal */}
      {payingItem && (
        <PaymentModal
          open={modalOpen}
          onClose={handleModalClose}
          amount={payingItem.amount}
          email={profile?.email ?? ''}
          txRef={payingItem.ref ?? ''}
          publicKey={publicKey}
          title={`Pay ${payingItem.description}`}
          description={`Payment for ${payingItem.description}`}
          onSuccess={handlePaymentSuccess}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Verifying overlay */}
      {verifying && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white px-8 py-6 text-center shadow-xl">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm font-medium text-slate-700">Verifying your payment…</p>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl" id="payment-receipt">
            {/* Receipt header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-bold text-slate-900">Payment Receipt</h2>
              </div>
              <button
                onClick={() => setReceipt(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt body */}
            <div className="px-6 py-6">
              <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-xs font-medium uppercase text-emerald-600">Payment Successful</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatNaira(Number(receipt.amount))}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                  <span className="text-slate-500">Receipt No.</span>
                  <span className="font-mono font-semibold text-slate-900">{receipt.receipt?.receiptNumber ?? '—'}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-xs text-slate-700">{receipt.reference}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                  <span className="text-slate-500">Verification Code</span>
                  <span className="font-mono font-semibold text-blue-600">{receipt.receipt?.verificationCode ?? '—'}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                  <span className="text-slate-500">Date</span>
                  <span>{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> {receipt.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt actions */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
