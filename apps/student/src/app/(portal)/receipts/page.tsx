'use client';

import { useEffect, useState } from 'react';
import { Receipt as ReceiptIcon, Download, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type ReceiptItem } from '@/lib/api';
import { formatNaira } from '@goinze/shared-utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentApi
      .fees()
      .then((res) => setReceipts(res.receipts))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load receipts.'))
      .finally(() => setLoading(false));
  }, []);

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

      {!loading && error && (
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

      {!loading && !error && receipts.length > 0 && (
        <div className="space-y-4">
          {receipts.map((r) => (
            <Card key={r.id} hover className="p-5">
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
                  <button onClick={() => window.print()} className="btn-secondary px-3 py-2 text-xs">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
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
    </div>
  );
}
