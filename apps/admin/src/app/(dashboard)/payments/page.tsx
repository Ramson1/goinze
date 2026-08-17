'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Receipt,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  financeApi,
  studentsApi,
  type StudentFeeBreakdown,
  type FinanceDashboard,
  type Paginated,
  type Payment,
  type Student,
  type StudentPayment,
} from '@/lib/api';

/* ── Helpers ── */

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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Student payments modal
  const [studentPaymentsModal, setStudentPaymentsModal] = useState<Student | null>(null);
  const [studentPaymentsLoading, setStudentPaymentsLoading] = useState(false);
  const [studentPaymentsLoadingId, setStudentPaymentsLoadingId] = useState<string | null>(null);
  const [studentFeeBreakdown, setStudentFeeBreakdown] = useState<StudentFeeBreakdown | null>(null);

  // Manual payment modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualStudentSearch, setManualStudentSearch] = useState('');
  const [manualStudentResults, setManualStudentResults] = useState<Student[]>([]);
  const [manualStudentSearching, setManualStudentSearching] = useState(false);
  const [manualSelectedStudent, setManualSelectedStudent] = useState<Student | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualNarration, setManualNarration] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

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

  async function openStudentPayments(studentId: string) {
    setStudentPaymentsLoadingId(studentId);
    setStudentPaymentsLoading(true);
    try {
      const [student, fees] = await Promise.all([
        studentsApi.get(studentId),
        financeApi.studentFees(studentId).catch(() => ({ items: [], summary: { total: 0, paid: 0, outstanding: 0 } }) as StudentFeeBreakdown),
      ]);
      setStudentPaymentsModal(student);
      setStudentFeeBreakdown(fees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student payments.');
      setStudentPaymentsModal(null);
    } finally {
      setStudentPaymentsLoading(false);
      setStudentPaymentsLoadingId(null);
    }
  }

  /** Open the manual payment modal and reset form state. */
  function openManualModal() {
    setManualModalOpen(true);
    setManualStudentSearch('');
    setManualStudentResults([]);
    setManualSelectedStudent(null);
    setManualAmount('');
    setManualDescription('');
    setManualNarration('');
    setError(null);
    setNotice(null);
  }

  /** Search students for the manual payment student picker. */
  useEffect(() => {
    if (!manualModalOpen || !manualStudentSearch.trim() || manualSelectedStudent) return;
    const timer = setTimeout(async () => {
      setManualStudentSearching(true);
      try {
        const res = await studentsApi.list({ search: manualStudentSearch, pageSize: 8 });
        setManualStudentResults(res.items);
      } catch {
        setManualStudentResults([]);
      } finally {
        setManualStudentSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [manualStudentSearch, manualModalOpen, manualSelectedStudent]);

  /** Submit a manual payment. */
  async function handleManualPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!manualSelectedStudent || !manualAmount || !manualDescription) return;
    setManualSubmitting(true);
    setError(null);
    try {
      await financeApi.createManualPayment({
        studentId: manualSelectedStudent.id,
        amount: Number(manualAmount),
        description: manualDescription,
        narration: manualNarration || undefined,
      });
      setNotice(`Payment of ${formatNaira(Number(manualAmount))} recorded for ${manualSelectedStudent.firstName} ${manualSelectedStudent.lastName}.`);
      setManualModalOpen(false);
      loadPayments();
      loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setManualSubmitting(false);
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
            <div className="flex items-center gap-2">
              <div>
                <p className="font-medium text-gray-900">
                  {p.student.firstName} {p.student.lastName}
                </p>
                <p className="font-mono text-xs text-gray-400">{p.student.matricNumber ?? '—'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openStudentPayments(p.student!.id)}
              disabled={studentPaymentsLoadingId === p.student!.id}
              title="View all payments for this student"
              className="mt-1 inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
            >
              {studentPaymentsLoadingId === p.student!.id ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" /> View Record
                </>
              )}
            </button>
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
  ];

  const totalPages = payments?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Track fees, collections and transaction status."
        action={
          <button onClick={openManualModal} className="btn-primary flex items-center gap-2 text-sm">
            <Banknote className="h-4 w-4" /> Record Payment
          </button>
        }
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      {/* Student Payments Modal */}
      {studentPaymentsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setStudentPaymentsModal(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student Payment Record</h2>
                <p className="text-xs text-gray-500">
                  {studentPaymentsModal.firstName} {studentPaymentsModal.lastName}
                  {studentPaymentsModal.matricNumber ? ` — ${studentPaymentsModal.matricNumber}` : ''}
                  {studentPaymentsModal.department?.name ? ` — ${studentPaymentsModal.department.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentPaymentsModal(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {studentPaymentsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading payment record…
                </div>
              ) : (
                <>
                  {/* Payment History */}
                  <section className="mb-8">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Payment History</h3>
                    {studentPaymentsModal.payments && studentPaymentsModal.payments.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Fee Type</th>
                              <th className="px-3 py-2">Reference</th>
                              <th className="px-3 py-2 text-right">Amount</th>
                              <th className="px-3 py-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {studentPaymentsModal.payments.map((p: StudentPayment) => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-3 py-2 text-xs">
                                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2">{p.feeStructure?.name ?? p.feeStructure?.type ?? '—'}</td>
                                <td className="px-3 py-2 font-mono text-xs text-gray-500">{p.reference}</td>
                                <td className="px-3 py-2 text-right font-semibold">₦{Number(p.amount).toLocaleString()}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                    p.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                    p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    p.status === 'REFUNDED' ? 'bg-gray-100 text-gray-600' :
                                    'bg-red-100 text-red-700'
                                  }`}>{p.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No payments recorded yet.</p>
                    )}
                  </section>

                  {/* Fee Breakdown */}
                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Fee Breakdown</h3>
                    {studentFeeBreakdown ? (() => {
                      const { items, summary } = studentFeeBreakdown;
                      const paidItems = items.filter((i) => i.status === 'PAID');
                      const unpaidItems = items.filter((i) => i.status === 'PENDING');
                      const { total, paid, outstanding } = summary;

                      return (
                        <>
                          {/* Summary Cards */}
                          <div className="mb-4 grid grid-cols-3 gap-4">
                            <div className="rounded-lg border border-gray-200 p-4 text-center">
                              <p className="text-xs text-gray-500">Total Expected</p>
                              <p className="mt-1 text-xl font-bold text-gray-900">₦{total.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                              <p className="text-xs text-green-600">Total Paid</p>
                              <p className="mt-1 text-xl font-bold text-green-700">₦{paid.toLocaleString()}</p>
                            </div>
                            <div className={`rounded-lg border p-4 text-center ${outstanding > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                              <p className={`text-xs ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{outstanding > 0 ? 'Outstanding' : 'Fully Paid'}</p>
                              <p className={`mt-1 text-xl font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>₦{Math.abs(outstanding).toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Paid Fees */}
                          {paidItems.length > 0 && (
                            <div className="mb-4">
                              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-700">
                                <CheckCircle2 className="h-4 w-4" /> Paid Fees
                              </h4>
                              <div className="overflow-x-auto rounded-lg border border-green-200">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-green-50 text-xs uppercase tracking-wide text-green-700">
                                    <tr>
                                      <th className="px-3 py-2">Fee Name</th>
                                      <th className="px-3 py-2">Session</th>
                                      <th className="px-3 py-2">Type</th>
                                      <th className="px-3 py-2 text-right">Amount</th>
                                      <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-green-100">
                                    {paidItems.map((item) => (
                                      <tr key={item.id} className="hover:bg-green-50">
                                        <td className="px-3 py-2 font-medium">{item.description}</td>
                                        <td className="px-3 py-2 text-xs text-gray-600">
                                          {item.sessionName ?? '—'}{item.semester ? ` — ${titleCase(item.semester)}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{item.type}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-green-700">₦{item.amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                            <CheckCircle2 className="h-3 w-3" /> Paid
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Unpaid Fees */}
                          {unpaidItems.length > 0 && (
                            <div>
                              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
                                <AlertCircle className="h-4 w-4" /> Unpaid Fees
                              </h4>
                              <div className="overflow-x-auto rounded-lg border border-red-200">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-red-50 text-xs uppercase tracking-wide text-red-700">
                                    <tr>
                                      <th className="px-3 py-2">Fee Name</th>
                                      <th className="px-3 py-2">Session</th>
                                      <th className="px-3 py-2">Type</th>
                                      <th className="px-3 py-2 text-right">Amount</th>
                                      <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-red-100">
                                    {unpaidItems.map((item) => (
                                      <tr key={item.id} className="hover:bg-red-50">
                                        <td className="px-3 py-2 font-medium">{item.description}</td>
                                        <td className="px-3 py-2 text-xs text-gray-600">
                                          {item.sessionName ?? '—'}{item.semester ? ` — ${titleCase(item.semester)}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{item.type}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-red-700">₦{item.amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                            <AlertCircle className="h-3 w-3" /> Unpaid
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {paidItems.length === 0 && unpaidItems.length === 0 && (
                            <p className="text-sm text-gray-400">No fees configured for this student.</p>
                          )}
                        </>
                      );
                    })() : (
                      <p className="text-sm text-gray-400">Loading fee breakdown…</p>
                    )}
                  </section>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setStudentPaymentsModal(null)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Modal */}
      {manualModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setManualModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Record Manual Payment</h2>
                <p className="text-xs text-gray-500">Record a cash or offline payment for a student.</p>
              </div>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualPayment} className="px-6 py-5">
              {/* Student Search */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Student</label>
                {manualSelectedStudent ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {manualSelectedStudent.firstName} {manualSelectedStudent.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {manualSelectedStudent.matricNumber ?? 'No matric no.'}
                        {manualSelectedStudent.department?.name ? ` — ${manualSelectedStudent.department.name}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setManualSelectedStudent(null); setManualStudentSearch(''); }}
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={manualStudentSearch}
                        onChange={(e) => setManualStudentSearch(e.target.value)}
                        placeholder="Search by name or matric number…"
                        className="input w-full pl-9"
                        autoFocus
                      />
                    </div>
                    {manualStudentSearching && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                      </div>
                    )}
                    {!manualStudentSearching && manualStudentSearch.trim() && manualStudentResults.length === 0 && (
                      <p className="mt-2 text-xs text-gray-400">No students found.</p>
                    )}
                    {manualStudentResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                        {manualStudentResults.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setManualSelectedStudent(s); setManualStudentSearch(''); }}
                            className="flex w-full items-center justify-between border-b border-gray-50 px-3 py-2 text-left last:border-0 hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-gray-500">{s.matricNumber ?? '—'}</p>
                            </div>
                            <span className="text-xs text-gray-400">{s.department?.name ?? ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount (₦)</label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0.00"
                  className="input w-full"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="e.g. School fees, Hostel fee, etc."
                  className="input w-full"
                  required
                />
              </div>

              {/* Narration (optional) */}
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium text-gray-700">Narration <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                <textarea
                  value={manualNarration}
                  onChange={(e) => setManualNarration(e.target.value)}
                  placeholder="Additional notes about this payment…"
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualSelectedStudent || !manualAmount || !manualDescription || manualSubmitting}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                >
                  {manualSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Recording…
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4" /> Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
