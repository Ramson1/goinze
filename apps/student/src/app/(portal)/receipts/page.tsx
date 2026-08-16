'use client';

import { useEffect, useState } from 'react';
import {
  Receipt as ReceiptIcon,
  Download,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  Printer,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type ReceiptItem } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { formatNaira } from '@goinze/shared-utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReceiptsPage() {
  const { profile } = useStudent();
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);

  useEffect(() => {
    studentApi
      .fees()
      .then((res) => setReceipts(res.receipts))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load receipts.'))
      .finally(() => setLoading(false));
  }, []);

  function viewReceipt(receipt: ReceiptItem) {
    setSelectedReceipt(receipt);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Receipts"
        description="Download and verify your official payment receipts."
      />

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading receipts…
        </Card>
      )}

      {!loading && error && !receipts.length && (
        <Card className="p-10 text-center">
          <ReceiptIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && receipts.length === 0 && (
        <Card className="p-10 text-center">
          <ReceiptIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No receipts yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Receipts appear here as soon as your payments are confirmed.
          </p>
        </Card>
      )}

      {!loading && receipts.length > 0 && (
        <div className="space-y-4">
          {/* Error banner (non-fatal, e.g. receipt detail fetch failed) */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {receipts.map((r) => (
            <Card
              key={r.id}
              hover
              className="p-5 transition hover:border-blue-200 hover:shadow-md"
              onClick={() => viewReceipt(r)}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                    <ReceiptIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{r.description}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{r.receiptNo}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{formatDate(r.date)}</span>
                      <span>{r.method}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {r.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{formatNaira(Number(r.amount))}</p>
                    {r.verificationCode && (
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                        <ShieldCheck className="h-3 w-3 text-brand" />
                        Verify: <span className="font-mono font-semibold text-slate-600">{r.verificationCode}</span>
                      </p>
                    )}
                  </div>
                  <span className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs">
                    <Download className="h-3.5 w-3.5" /> View
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-brand" /> Verifying a receipt
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Every receipt carries a unique verification code. Third parties (embassies, employers, other
          institutions) can confirm a receipt's authenticity by entering the code on the university's
          verification portal, without needing an account.
        </p>
      </Card>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Close button (outside receipt area) */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-700">Payment Receipt</h3>
              <button onClick={() => setSelectedReceipt(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable receipt area */}
            <div className="overflow-y-auto flex-1 p-6">
              <div
                className="relative mx-auto max-w-xl rounded-lg border-2 border-blue-800 bg-white p-8"
                id="payment-receipt"
                style={{ fontFamily: 'serif' }}
              >
                {/* Watermark */}
                <div
                  className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.04]"
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center" style={{ transform: 'rotate(-30deg)', transformOrigin: 'center' }}>
                    {Array.from({ length: 80 }).map((_, i) => (
                      <span key={i} className="mx-8 my-4 whitespace-nowrap text-xl font-bold text-blue-900">
                        OFFICIAL RECEIPT
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* School Header */}
                  <div className="mb-6 border-b-2 border-blue-800 pb-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src="/logo.png"
                        alt="School Logo"
                        className="h-14 w-14 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div>
                        <h1 className="text-lg font-bold uppercase tracking-wide text-blue-900">
                          Goinze International School
                        </h1>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="inline-block rounded bg-blue-800 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                        Official Payment Receipt
                      </span>
                    </div>
                  </div>

                  {/* Receipt Meta */}
                  <div className="mb-5 flex flex-wrap justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Receipt No:</span>{' '}
                      <span className="font-mono font-bold text-blue-900">{selectedReceipt.receiptNo}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Date:</span>{' '}
                      <span className="text-slate-700">{new Date(selectedReceipt.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Time:</span>{' '}
                      <span className="text-slate-700">{new Date(selectedReceipt.date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="mb-5 rounded border border-slate-200 bg-slate-50 p-3 text-xs">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Received From</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {profile ? `${profile.firstName} ${profile.middleName ?? ''} ${profile.lastName}`.replace(/\s+/g, ' ') : '—'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-slate-600">
                      {profile?.matricNo && <span>Matric No: <strong>{profile.matricNo}</strong></span>}
                      {profile?.department && <span>Dept: {profile.department}</span>}
                      {profile?.email && <span>{profile.email}</span>}
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="mb-5">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-blue-800">
                          <th className="pb-1.5 text-left font-bold text-slate-700">Description</th>
                          <th className="pb-1.5 text-right font-bold text-slate-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-2">
                            <p className="font-semibold text-slate-900">{selectedReceipt.description}</p>
                            <p className="text-[11px] text-slate-500">Method: {selectedReceipt.method}</p>
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900">{formatNaira(Number(selectedReceipt.amount))}</td>
                        </tr>
                        <tr className="border-b-2 border-blue-800 bg-blue-50">
                          <td className="py-2 text-right font-bold text-blue-900">TOTAL PAID</td>
                          <td className="py-2 text-right font-bold text-blue-900">{formatNaira(Number(selectedReceipt.amount))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Verification */}
                  <div className="mb-5 space-y-1.5 rounded border border-slate-200 p-3 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verification Code:</span>
                      <span className="font-mono font-bold text-blue-700">{selectedReceipt.verificationCode ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> CONFIRMED
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-dashed border-slate-300 pt-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      This is a computer-generated receipt. No physical signature required.
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Verify authenticity at the school&apos;s finance office using the verification code above.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions (outside receipt) */}
            <div className="flex items-center justify-between border-t px-5 py-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
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
