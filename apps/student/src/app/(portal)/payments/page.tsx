'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Lock,
  ShieldCheck,
  Printer,
  Info,
  X,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import PaymentModal, { type PaymentResponse, type GatewayId } from '@/components/PaymentModal';
import { studentApi, financeApi, type FeesResponse, type FeeItem, type VerifyPaymentResult, type GatewayConfig } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { formatNaira } from '@/lib/utils';
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

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SemesterGroup {
  key: string;
  sessionName: string;
  semester: string;
  items: FeeItem[];
  total: number;
  paid: number;
  outstanding: number;
  fullyPaid: boolean;
  allLocked: boolean;
}

function groupBySemester(items: FeeItem[]): SemesterGroup[] {
  const semesterOrder: Record<string, number> = { FIRST: 0, SECOND: 1, THIRD: 2 };
  const map = new Map<string, SemesterGroup>();
  for (const item of items) {
    const sn = item.sessionName ?? 'General';
    const sem = item.semester ?? 'FIRST';
    const key = `${sn}|||${sem}`;
    if (!map.has(key)) {
      map.set(key, { key, sessionName: sn, semester: sem, items: [], total: 0, paid: 0, outstanding: 0, fullyPaid: false, allLocked: true });
    }
    const g = map.get(key)!;
    g.items.push(item);
    g.total += item.amount;
    if (item.status === 'PAID') g.paid += item.amount;
    if (!item.locked) g.allLocked = false;
  }
  for (const g of map.values()) {
    g.outstanding = g.total - g.paid;
    g.fullyPaid = g.outstanding <= 0;
  }
  return [...map.values()].sort((a, b) => {
    // Sort by session name (chronological), then semester order
    if (a.sessionName !== b.sessionName) return a.sessionName.localeCompare(b.sessionName);
    return (semesterOrder[a.semester] ?? 0) - (semesterOrder[b.semester] ?? 0);
  });
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
  const [portalAccessPublicKey, setPortalAccessPublicKey] = useState('');
  const [availableGateways, setAvailableGateways] = useState<GatewayConfig[]>([]);
  const [portalAccessGateways, setPortalAccessGateways] = useState<GatewayConfig[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<GatewayId>('FLUTTERWAVE');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const [showAccessBanner, setShowAccessBanner] = useState(
    searchParams.get('portal_access_required') === 'true',
  );
  const [showTuitionBanner, setShowTuitionBanner] = useState(
    searchParams.get('tuition_required') === 'true',
  );
  const [showOptionalGroups, setShowOptionalGroups] = useState<Set<string>>(new Set());
  const [showSequenceBanner, setShowSequenceBanner] = useState(true);

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
    // Fetch available payment gateways from API
    financeApi.getPaymentGateways()
      .then((res) => {
        alive && setAvailableGateways(res.gateways);
        if (res.gateways.length > 0) {
          setPublicKey(res.gateways[0].publicKey);
          setSelectedGateway(res.gateways[0].id as GatewayId);
        }
      })
      .catch(() => {
        // Fallback to legacy endpoint
        financeApi.getFlutterwaveConfig()
          .then((cfg) => alive && setPublicKey(cfg.publicKey))
          .catch(() => {});
      });
    // Fetch Portal Access payment gateways from API
    financeApi.getPortalAccessGateways()
      .then((res) => {
        alive && setPortalAccessGateways(res.gateways);
        if (res.gateways.length > 0) {
          setPortalAccessPublicKey(res.gateways[0].publicKey);
        }
      })
      .catch(() => {
        // Fallback to legacy endpoint
        financeApi.getPortalAccessPublicKey()
          .then((cfg) => alive && setPortalAccessPublicKey(cfg.publicKey))
          .catch(() => {});
      });
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
        studentId: profile?.id,
        customerEmail: profile?.email ?? undefined,
        gateway: selectedGateway,
      });
      // Open the Flutterwave modal with the txRef from the server
      setPayingItem({ ...item, ref: res.reference });
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not initiate payment.');
      setPayingItem(null);
    }
  }

  /** Called when payment checkout completes successfully */
  async function handlePaymentSuccess(response: PaymentResponse) {
    setModalOpen(false);
    setVerifying(true);
    try {
      const result = await financeApi.verifyPayment(response.txRef);
      setReceipt(result);
      setShowAccessBanner(false);
      setShowTuitionBanner(false);
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

  // Auto-expand the first unpaid semester group when data loads
  useEffect(() => {
    if (!data || data.items.length === 0) return;
    const groups = groupBySemester(data.items);
    const firstUnpaid = groups.find((g) => !g.fullyPaid);
    if (firstUnpaid && expandedGroups.size === 0) {
      setExpandedGroups(new Set([firstUnpaid.key]));
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleOptional(key: string) {
    setShowOptionalGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
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
  const groups = groupBySemester(items);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Payments"
        description="View your fee breakdown and make secure online payments."
      />

      {/* Portal access required banner */}
      {showAccessBanner && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-800">Portal Access Required</p>
            <p className="mt-0.5 text-amber-700">
              You must pay the Portal Access fee for the current session before accessing other pages.
              Please complete your payment below to continue.
            </p>
          </div>
          <button
            onClick={() => setShowAccessBanner(false)}
            className="flex-shrink-0 text-amber-400 hover:text-amber-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tuition fee required banner */}
      {showTuitionBanner && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-800">Tuition Fee Required</p>
            <p className="mt-0.5 text-amber-700">
              You must pay your tuition fee for the current session before viewing your results.
              Please complete your payment below.
            </p>
          </div>
          <button
            onClick={() => setShowTuitionBanner(false)}
            className="flex-shrink-0 text-amber-400 hover:text-amber-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

      {/* Gateway selector — shown when multiple gateways are available */}
      {availableGateways.length > 1 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-slate-700">Choose payment method:</p>
          <div className="flex flex-wrap gap-3">
            {availableGateways.map((gw) => (
              <button
                key={gw.id}
                type="button"
                onClick={() => {
                  setSelectedGateway(gw.id as GatewayId);
                  setPublicKey(gw.publicKey);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition',
                  selectedGateway === gw.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <CreditCard className="h-4 w-4" />
                {gw.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Both options are equally secure and work the same way. Choose whichever you prefer.
          </p>
        </div>
      )}

      {/* Payment sequence info banner */}
      {showSequenceBanner && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-blue-800">Payment Order</p>
            <p className="mt-0.5 text-blue-700">
              Fees must be paid in sequence. Each fee must be cleared before the next one becomes available for payment. Please pay your fees one at a time, starting from the first.
            </p>
          </div>
          <button
            onClick={() => setShowSequenceBanner(false)}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Fee breakdown by semester */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Wallet className="h-4 w-4 text-brand" /> Fee Breakdown
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Secured online payments
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No fee structures have been published for your school yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              return (
                <div key={group.key}>
                  {/* Semester header (collapsible) */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center justify-between px-6 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', !isExpanded && '-rotate-90')} />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {group.sessionName} — {titleCase(group.semester)} Semester
                        </h3>
                        <p className="text-xs text-slate-400">
                          {formatNaira(group.paid)} of {formatNaira(group.total)} paid
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.fullyPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Fully Paid
                        </span>
                      ) : group.allLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          <Lock className="h-3 w-3" /> Clear previous semester first
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {formatNaira(group.outstanding)} outstanding
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded table */}
                  {isExpanded && (() => {
                    const mandatory = group.items.filter((i) => !i.isOptional);
                    const optional = group.items.filter((i) => i.isOptional);
                    const showOptional = showOptionalGroups.has(group.key);

                    function renderRow(f: FeeItem) {
                      const cfg = statusConfig[f.status];
                      const StatusIcon = cfg.icon;
                      const isLocked = !!f.locked;
                      return (
                        <tr key={f.id} className={cn('transition', isLocked ? 'opacity-50' : 'hover:bg-slate-50')}>
                          <td className="px-6 py-3">
                            <span className="font-medium text-slate-900">{f.description}</span>
                            {isLocked && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                                <Lock className="h-2.5 w-2.5" /> Locked
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{f.type}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">{f.ref ?? '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatNaira(f.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.cls)}>
                              <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {f.status === 'PAID' ? (
                              <span className="text-xs font-medium text-slate-400">{formatDate(f.paidAt)}</span>
                            ) : isLocked ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                                <Lock className="h-3 w-3" /> {group.allLocked ? 'Clear previous semester first' : 'Pay preceding fees first'}
                              </span>
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
                    }

                    return (
                      <div className="overflow-x-auto bg-slate-50/50">
                        {/* Optional Fees at the top */}
                        {optional.length > 0 && (
                          <div className="border-b border-dashed border-slate-200">
                            <button
                              onClick={() => toggleOptional(group.key)}
                              className="flex w-full items-center gap-2 px-6 py-2.5 text-left text-xs font-semibold text-violet-600 transition hover:bg-violet-50/50"
                            >
                              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !showOptional && '-rotate-90')} />
                              Optional Fees ({optional.length})
                              <span className="font-normal text-slate-400">— voluntary fees you can choose to pay</span>
                            </button>
                            {showOptional && (
                              <table className="w-full min-w-[720px] text-sm">
                                <tbody className="divide-y divide-slate-100">
                                  {optional.map(renderRow)}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}

                        {/* Mandatory Fees */}
                        <table className="w-full min-w-[720px] text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="px-6 py-2.5">Description</th>
                              <th className="px-4 py-2.5">Type</th>
                              <th className="px-4 py-2.5">Reference</th>
                              <th className="px-4 py-2.5 text-right">Amount</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-6 py-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {mandatory.map(renderRow)}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs leading-relaxed text-slate-500">
          Payments are processed securely online. Pay with card, bank transfer or USSD.
          A receipt is generated automatically once payment is confirmed.
        </div>
      </Card>

      {/* Payment Modal */}
      {payingItem && (
        <PaymentModal
          open={modalOpen}
          onClose={handleModalClose}
          amount={payingItem.amount}
          email={profile?.email ?? ''}
          txRef={payingItem.ref ?? ''}
          publicKey={payingItem.type === 'PORTAL_ACCESS'
            ? (portalAccessGateways.find(g => g.id === selectedGateway)?.publicKey ?? portalAccessPublicKey)
            : (availableGateways.find(g => g.id === selectedGateway)?.publicKey ?? publicKey)
          }
          title={`Pay ${payingItem.description}`}
          description={`Payment for ${payingItem.description}`}
          gateway={selectedGateway}
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
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Close button (outside receipt area) */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-700">Payment Receipt</h3>
              <button onClick={() => setReceipt(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
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
                          {receipt.school?.name ?? 'Goinze International School'}</h1>
                        {receipt.school?.address && (
                          <p className="text-xs text-slate-600">{receipt.school.address}</p>
                        )}
                        <div className="mt-0.5 flex items-center justify-center gap-3 text-[11px] text-slate-500">
                          {receipt.school?.phone && <span>Tel: {receipt.school.phone}</span>}
                          {receipt.school?.email && <span>{receipt.school.email}</span>}
                        </div>
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
                      <span className="font-mono font-bold text-blue-900">{receipt.receipt?.receiptNumber ?? '—'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Date:</span>{' '}
                      <span className="text-slate-700">{receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Time:</span>{' '}
                      <span className="text-slate-700">{receipt.paidAt ? new Date(receipt.paidAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="mb-5 rounded border border-slate-200 bg-slate-50 p-3 text-xs">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Received From</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {receipt.student
                        ? `${receipt.student.firstName} ${receipt.student.middleName ?? ''} ${receipt.student.lastName}`.replace(/\s+/g, ' ')
                        : '—'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-slate-600">
                      {receipt.student?.matricNumber && <span>Matric No: <strong>{receipt.student.matricNumber}</strong></span>}
                      {receipt.student?.department?.name && <span>Dept: {receipt.student.department.name}</span>}
                      {receipt.student?.email && <span>{receipt.student.email}</span>}
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
                            <p className="font-semibold text-slate-900">
                              {receipt.feeStructure?.name ?? 'Fee Payment'}
                            </p>
                            {receipt.feeStructure?.type && (
                              <p className="text-[11px] text-slate-500">Type: {receipt.feeStructure.type.replace(/_/g, ' ')}</p>
                            )}
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900">{formatNaira(Number(receipt.amount))}</td>
                        </tr>
                        <tr className="border-b-2 border-blue-800 bg-blue-50">
                          <td className="py-2 text-right font-bold text-blue-900">TOTAL PAID</td>
                          <td className="py-2 text-right font-bold text-blue-900">{formatNaira(Number(receipt.amount))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Transaction References */}
                  <div className="mb-5 space-y-1.5 rounded border border-slate-200 p-3 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Reference:</span>
                      <span className="font-mono font-semibold text-slate-800">{receipt.reference}</span>
                    </div>
                    {receipt.gatewayRef && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID:</span>
                        <span className="font-mono font-semibold text-slate-800">{receipt.gatewayRef}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Method:</span>
                      <span className="font-semibold text-slate-800">{receipt.gateway ? `${receipt.gateway} (Online)` : 'Online Payment'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verification Code:</span>
                      <span className="font-mono font-bold text-blue-700">{receipt.receipt?.verificationCode ?? '—'}</span>
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
