'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Receipt,
  Search,
  Undo2,
  Wallet,
} from 'lucide-react';
import { formatNaira } from '@goinze/shared-utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  financeApi,
  type FeeStructure,
  type FinanceDashboard,
  type Paginated,
  type Payment,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const FEE_TYPES = ['SCHOOL', 'ACCEPTANCE', 'MEDICAL', 'HOSTEL', 'LIBRARY', 'GRADUATION', 'OTHER'];
const STATUS_FILTERS = ['', 'PENDING', 'SUCCESS', 'REFUNDED', 'FAILED'];
const PAGE_SIZE = 10;

function methodLabel(gateway: string): string {
  switch (gateway) {
    case 'FLUTTERWAVE':
      return 'Flutterwave';
    case 'PAYSTACK':
      return 'Paystack';
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'CASH':
      return 'Cash';
    default:
      return gateway;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PaymentsPage() {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [payments, setPayments] = useState<Paginated<Payment> | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Fee-structure form
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeType, setFeeType] = useState('SCHOOL');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeLevel, setFeeLevel] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const loadDashboard = useCallback(() => {
    financeApi
      .dashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load summary.'));
  }, []);

  const loadPayments = useCallback(() => {
    setLoading(true);
    setError(null);
    financeApi
      .payments({ page, pageSize: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined })
      .then(setPayments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load payments.'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  const loadFeeStructures = useCallback(() => {
    financeApi
      .feeStructures()
      .then(setFeeStructures)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load fee structures.'));
  }, []);

  useEffect(() => {
    loadDashboard();
    loadFeeStructures();
  }, [loadDashboard, loadFeeStructures]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  async function refund(p: Payment) {
    if (!window.confirm(`Refund ${formatNaira(Number(p.amount))} for ${p.reference}?`)) return;
    setRefundingId(p.id);
    setError(null);
    setNotice(null);
    try {
      await financeApi.refund(p.id, 'Refunded by admin');
      setNotice(`Payment ${p.reference} refunded.`);
      loadPayments();
      loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund failed.');
    } finally {
      setRefundingId(null);
    }
  }

  async function submitFeeStructure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingFee(true);
    setError(null);
    setNotice(null);
    try {
      await financeApi.createFeeStructure({
        name: feeName.trim(),
        amount: Number(feeAmount),
        type: feeType,
        level: feeLevel ? Number(feeLevel) : undefined,
      });
      setNotice(`Fee structure "${feeName.trim()}" created.`);
      setFeeName('');
      setFeeAmount('');
      setFeeLevel('');
      setFeeType('SCHOOL');
      setShowFeeForm(false);
      loadFeeStructures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create fee structure.');
    } finally {
      setSavingFee(false);
    }
  }

  const columns: Column<Payment>[] = [
    { key: 'reference', header: 'Reference', className: 'font-mono text-xs' },
    {
      key: 'student',
      header: 'Student',
      render: (p) =>
        p.student ? (
          <div>
            <p className="font-medium text-gray-900">
              {p.student.firstName} {p.student.lastName}
            </p>
            <p className="font-mono text-xs text-gray-400">{p.student.matricNumber ?? '—'}</p>
          </div>
        ) : (
          <span className="text-gray-400">Applicant</span>
        ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (p) => p.feeStructure?.name ?? (p.applicationId ? 'Acceptance Fee' : '—'),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'whitespace-nowrap font-semibold text-gray-900',
      render: (p) => formatNaira(Number(p.amount)),
    },
    { key: 'gateway', header: 'Method', render: (p) => methodLabel(p.gateway) },
    {
      key: 'date',
      header: 'Date',
      className: 'whitespace-nowrap',
      render: (p) => formatDate(p.paidAt ?? p.createdAt),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: 'Action',
      render: (p) =>
        p.status === 'SUCCESS' ? (
          <button
            type="button"
            onClick={() => refund(p)}
            disabled={refundingId === p.id}
            className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            {refundingId === p.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Undo2 className="h-3.5 w-3.5" />
            )}
            Refund
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ];

  const totalPages = payments?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Track fees, collections and transaction status."
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Collected"
          value={dashboard ? formatNaira(dashboard.totalCollected) : '—'}
          icon={Wallet}
        />
        <StatCard
          title="Pending"
          value={dashboard ? formatNaira(dashboard.pendingAmount) : '—'}
          delta={dashboard ? `${dashboard.pendingCount} awaiting payment` : undefined}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Refunded"
          value={dashboard ? formatNaira(dashboard.refundedAmount) : '—'}
          delta={dashboard ? `${dashboard.refundedCount} refunded` : undefined}
          trend="down"
          icon={Undo2}
          iconClassName="bg-rose-500/10 text-rose-600"
        />
        <StatCard
          title="Transactions"
          value={dashboard ? String(dashboard.totalCount) : '—'}
          icon={Receipt}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
      </div>

      {/* Payments table */}
      <Card
        title="Transactions"
        subtitle="Latest payments across all fee types"
        className="mt-6"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference…"
                className="input w-48 pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-36"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === '' ? 'All statuses' : titleCase(s)}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading payments…
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={payments?.items ?? []}
              keyField="id"
              emptyMessage="No payments match your filters."
            />
            {payments && payments.total > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-500">
                  Page {payments.page} of {totalPages} · {payments.total} transactions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Fee structures */}
      <Card
        title="Fee Structures"
        subtitle="Fees configured for this school"
        className="mt-6"
        action={
          <button
            type="button"
            onClick={() => setShowFeeForm((v) => !v)}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> {showFeeForm ? 'Close' : 'Add Fee'}
          </button>
        }
      >
        {showFeeForm && (
          <form
            onSubmit={submitFeeStructure}
            className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div className="lg:col-span-2">
              <label className="label">Name</label>
              <input
                type="text"
                required
                value={feeName}
                onChange={(e) => setFeeName(e.target.value)}
                placeholder="e.g. 100 Level Tuition"
                className="input"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={feeType} onChange={(e) => setFeeType(e.target.value)} className="input">
                {FEE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {titleCase(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount (₦)</label>
              <input
                type="number"
                required
                min={0}
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="250000"
                className="input"
              />
            </div>
            <div>
              <label className="label">Level (optional)</label>
              <input
                type="number"
                min={100}
                max={900}
                value={feeLevel}
                onChange={(e) => setFeeLevel(e.target.value)}
                placeholder="100"
                className="input"
              />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-5">
              <button type="submit" disabled={savingFee} className="btn-primary disabled:opacity-60">
                {savingFee ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Fee Structure
              </button>
            </div>
          </form>
        )}

        {feeStructures.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            No fee structures configured yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Type', 'Amount', 'Level', 'Mandatory', 'Installment'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feeStructures.map((f) => (
                  <tr key={f.id} className="odd:bg-white even:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                        {titleCase(f.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {formatNaira(Number(f.amount))}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{f.level ? `${f.level} Level` : 'All'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          f.isMandatory ? 'text-emerald-600' : 'text-gray-400',
                        )}
                      >
                        {f.isMandatory ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          f.allowInstallment ? 'text-emerald-600' : 'text-gray-400',
                        )}
                      >
                        {f.allowInstallment ? 'Allowed' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
