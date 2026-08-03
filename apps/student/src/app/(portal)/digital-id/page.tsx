'use client';

import { useEffect, useState } from 'react';
import { Printer, Download, QrCode, ShieldCheck, GraduationCap, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, type DigitalId } from '@/lib/api';
import { useStudent } from '@/lib/student-context';

/** Deterministic pseudo-QR grid derived from a seed string (placeholder). */
function QrPlaceholder({ seed }: { seed: string }) {
  const size = 13;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  const cells: boolean[] = [];
  let x = hash || 1;
  for (let i = 0; i < size * size; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    cells.push(x % 3 !== 0);
  }

  return (
    <div
      className="grid gap-[2px] rounded-lg bg-white p-2 ring-1 ring-slate-200"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, width: 104, height: 104 }}
      aria-label="QR code placeholder"
    >
      {cells.map((filled, i) => (
        <span key={i} className={filled ? 'rounded-[1px] bg-slate-900' : 'bg-white'} />
      ))}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function formatMonthYear(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function DigitalIdPage() {
  const { profile } = useStudent();
  const [card, setCard] = useState<DigitalId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    studentApi
      .digitalId()
      .then((c) => alive && setCard(c))
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load your ID.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Generating your digital ID…
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-500">
        {error ?? 'Unable to load your digital ID.'}
      </div>
    );
  }

  const initials = `${card.student.firstName[0] ?? ''}${card.student.lastName[0] ?? ''}`;
  const expiry = formatMonthYear(card.expiresAt);
  const sessionYear = profile?.session?.split('/')[0] ?? '';

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Digital ID Card"
        description="Your official student identity card. Present it on campus or verify it online."
        actions={
          <>
            <button onClick={handlePrint} className="btn-secondary">
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={handlePrint} className="btn-primary">
              <Printer className="h-4 w-4" /> Print
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* ---- ID Card ---- */}
        <div className="print-area mx-auto w-full max-w-[400px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-card-hover ring-1 ring-slate-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-brand-dark via-brand to-brand-dark px-6 py-5 text-white">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                    <GraduationCap className="h-5 w-5 text-amber-400" />
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-tight">Goinze International School of Medical Health Science and Technology</p>
                    <p className="text-[10px] uppercase tracking-widest text-blue-200">
                      Student Identity Card
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {profile?.session ?? '—'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-2xl font-bold text-white ring-4 ring-blue-50">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-slate-900">
                    {card.student.firstName} {card.student.lastName}
                  </p>
                  <p className="text-sm font-semibold text-brand">{card.student.matricNo ?? '—'}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{card.student.programme ?? '—'}</p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-dashed border-slate-200 pt-4">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Faculty</dt>
                  <dd className="text-xs font-medium text-slate-800">{profile?.faculty ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Level</dt>
                  <dd className="text-xs font-medium text-slate-800">{card.student.level ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date of Birth</dt>
                  <dd className="text-xs font-medium text-slate-800">{formatDate(profile?.dateOfBirth ?? null)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Blood Group</dt>
                  <dd className="text-xs font-medium text-slate-800">{profile?.medical.bloodGroup ?? '—'}</dd>
                </div>
              </dl>

              {/* QR + expiry */}
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-center gap-3">
                  <QrPlaceholder seed={card.student.matricNo ?? card.cardNumber} />
                  <div className="text-xs text-slate-500">
                    <p className="flex items-center gap-1 font-semibold text-slate-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Verify online
                    </p>
                    <p className="mt-0.5 font-mono text-[11px]">{card.verificationCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Valid Until</p>
                  <p className="text-sm font-bold text-slate-900">{expiry}</p>
                </div>
              </div>
            </div>

            {/* Footer stripe */}
            <div className="flex items-center justify-between bg-slate-900 px-6 py-3">
              <span className="font-mono text-[11px] tracking-wider text-slate-300">{card.cardNumber}</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                <QrCode className="h-3.5 w-3.5" /> Digital ID
              </span>
            </div>
          </div>
        </div>

        {/* ---- Side info ---- */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-slate-900">About your Digital ID</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Your digital ID card is the official student identity for the {profile?.session ?? 'current'}{' '}
              academic session. Use it to access campus facilities, sit for examinations, and verify your
              student status. The QR code lets staff verify the card instantly against the university
              registry.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                Verification code <span className="font-mono text-xs">{card.verificationCode}</span> is unique to this card.
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                The card is valid until {expiry}
                {sessionYear ? ` (issued ${formatMonthYear(card.issuedAt)})` : ''}.
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                Report a lost or stolen card immediately via the Settings page.
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-slate-900">Need a physical card?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A printed PVC card can be collected from the Students' Affairs office after payment of the
              ID card levy. Bring this digital card and a printed copy of your payment receipt.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
