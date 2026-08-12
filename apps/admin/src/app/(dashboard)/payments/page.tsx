'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
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
  type FinanceDashboard,
  type Paginated,
  type Payment,
} from '@/lib/api';

/* ── Helpers ── */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

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
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [payments, setPayments] = useState<Paginated<Payment> | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check user role on mount
  useEffect(() => {
    const token = getCookie('access_token');
    const role = token ? decodeRoleFromToken(token) : null;
    setIsSuperAdmin(role === 'SUPER_ADMIN');
  }, []);

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

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
        p.status === 'SUCCESS' && isSuperAdmin ? (
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
    </>
  );
}
