'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Download,
  Eye,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { cn } from '@/lib/utils';
import {
  sessionsApi,
  staffApi,
  studentsApi,
  settingsApi,
  idCardsApi,
  type AcademicSessionRecord,
  type DepartmentRef,
  type SchoolProfile,
  type StaffRecord,
  type Student,
  type IdCardRecord,
} from '@/lib/api';

/* ── Helpers ─────────────────────────────────────────────────────── */

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1])).role ?? null;
  } catch {
    return null;
  }
}

function hashCode(input: string): string {
  let h = 7;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

function initialsOf(person: { firstName: string; lastName: string }): string {
  return `${person.firstName[0] ?? ''}${person.lastName[0] ?? ''}`.toUpperCase();
}

function fullName(person: { firstName: string; lastName: string; middleName?: string | null }): string {
  return `${person.firstName} ${person.middleName ?? ''} ${person.lastName}`.replace(/\s+/g, ' ').trim();
}

/** Build a verification payload embedding user information for QR encoding. */
function buildVerificationPayload(params: {
  verificationCode: string;
  cardNumber: string;
  personId: string;
  firstName: string;
  lastName: string;
  type: 'STUDENT' | 'STAFF';
}): string {
  return JSON.stringify({
    v: params.verificationCode,
    c: params.cardNumber,
    id: params.personId,
    n: `${params.firstName} ${params.lastName}`,
    t: params.type,
  });
}

type CardMode = 'student' | 'staff';
type StatusFilter = 'all' | 'issued' | 'pending';

const SCHOOL_NAME = 'Goinze International School of Medical Health Science and Technology';

/* ── ID Card Front ───────────────────────────────────────────────── */

function IdCardFront({
  person,
  mode,
  cardNo,
  expiry,
  photoUrl,
  school,
  innerRef,
}: {
  person: { id?: string; firstName: string; lastName: string; middleName?: string | null };
  mode: CardMode;
  cardNo: string;
  expiry: string;
  photoUrl: string | null;
  school: SchoolProfile | null;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const isStudent = mode === 'student';
  const student = isStudent ? (person as Student) : null;
  const staff = !isStudent ? (person as StaffRecord) : null;
  const accent = isStudent ? 'from-blue-900 to-blue-700' : 'from-emerald-900 to-emerald-700';
  const badgeBg = isStudent ? 'bg-amber-500 text-blue-950' : 'bg-amber-500 text-emerald-950';
  const avatarBg = isStudent ? 'bg-blue-100 text-blue-700 ring-blue-200' : 'bg-emerald-100 text-emerald-700 ring-emerald-200';

  const idNumber = isStudent
    ? (student?.matricNumber ?? student?.regNumber ?? 'Not assigned')
    : (staff?.staffNumber ?? staff?.email ?? 'Not assigned');

  const dept = (student?.department?.name ?? staff?.department?.name ?? '—');
  const role = isStudent
    ? 'Student'
    : (staff?.designation ?? (staff?.staffCategory === 'ACADEMIC' ? 'Academic Staff' : staff?.staffCategory === 'NON_ACADEMIC' ? 'Non-Academic Staff' : 'Staff'));
  const subInfo = isStudent
    ? { label: 'Level', value: student?.currentLevel ? `${student.currentLevel} Level` : '—' }
    : { label: 'Category', value: staff?.staffCategory === 'ACADEMIC' ? 'Academic Staff' : staff?.staffCategory === 'NON_ACADEMIC' ? 'Non-Academic Staff' : staff?.isLecturer ? 'Academic Staff' : 'Staff' };

  return (
    <div ref={innerRef} data-card className="flex h-[214px] w-[340px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className={cn('flex items-center gap-2 bg-gradient-to-r px-3 pt-1 pb-2 text-white', accent)}>
        {(school?.logoUrl || '/logo.png') ? (
          <img src={school?.logoUrl || '/logo.png'} alt="" className="mt-auto mb-auto h-7 w-7 shrink-0 rounded-full object-contain bg-white/90 p-0.5 ring-1 ring-white/30" />
        ) : (
          <ShieldCheck className="mt-auto mb-auto h-5 w-5 shrink-0 text-white/80" />
        )}
        <div className="mt-auto mb-auto min-w-0 flex-1">
          <p className="text-[9px] font-bold leading-[1.2]">Goinze International School</p>
          <p className="text-[7px] font-semibold leading-[1.2] opacity-90">of Medical Health Science and Technology</p>
        </div>
        <span className={cn('mt-auto mb-auto inline-flex items-center justify-center shrink-0 rounded-full px-2 py-[3px] text-[7px] font-bold uppercase tracking-wider leading-none', badgeBg)}>
          {isStudent ? 'Student' : 'Staff'} ID
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-3 px-3 py-2">
        {/* Photo */}
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-[64px] w-[52px] shrink-0 rounded-lg object-cover ring-1 ring-gray-200" />
        ) : (
          <span className={cn('flex h-[64px] w-[52px] shrink-0 items-center justify-center rounded-lg text-lg font-bold ring-1', avatarBg)}>
            {initialsOf(person)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-gray-900 leading-tight break-words">{fullName(person)}</p>
          <p className="font-mono text-[9px] text-gray-500 mt-0.5 break-all">{idNumber}</p>
          <dl className="mt-1.5 space-y-1 text-[9px]">
            {isStudent && (
              <div className="flex gap-2">
                <dt className="w-12 shrink-0 text-gray-400">Role</dt>
                <dd className="min-w-0 font-semibold text-gray-800 break-words">{role}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-gray-400">Department</dt>
              <dd className="min-w-0 font-medium text-gray-700 break-words">{dept}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-gray-400">{subInfo.label}</dt>
              <dd className="font-medium text-gray-700">{subInfo.value}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-gray-400">Expires</dt>
              <dd className="font-medium text-gray-700">{expiry}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Footer with barcode */}
      <div className="flex items-center justify-center border-t border-dashed border-gray-200 px-3 py-1.5">
        <div className="overflow-hidden text-center">
          <p className="font-mono text-[8px] text-gray-500">{cardNo}</p>
          <div className="mt-0.5 flex justify-center">
            <Barcode
              value={cardNo}
              format="CODE128"
              height={18}
              width={1.1}
              margin={0}
              fontSize={0}
              displayValue={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ID Card Back ────────────────────────────────────────────────── */

function IdCardBack({
  person,
  mode,
  cardNo,
  verificationCode,
  expiry,
  school,
  innerRef,
}: {
  person: { id?: string; firstName: string; lastName: string };
  mode: CardMode;
  cardNo: string;
  verificationCode: string;
  expiry: string;
  school: SchoolProfile | null;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const isStudent = mode === 'student';
  const accent = isStudent ? 'from-blue-900 to-blue-700' : 'from-emerald-900 to-emerald-700';

  // Build QR payload with full user verification data
  const qrData = buildVerificationPayload({
    verificationCode,
    cardNumber: cardNo,
    personId: person.id ?? '',
    firstName: person.firstName,
    lastName: person.lastName,
    type: isStudent ? 'STUDENT' : 'STAFF',
  });

  return (
    <div ref={innerRef} data-card className="flex h-[214px] w-[340px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className={cn('flex items-center justify-center bg-gradient-to-r px-3 py-1.5 text-white', accent)}>
        {(school?.logoUrl || '/logo.png') ? (
          <img src={school?.logoUrl || '/logo.png'} alt="" className="h-6 w-6 rounded-full object-contain bg-white/90 p-0.5 mr-1.5 ring-1 ring-white/30" />
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-between px-3 py-2">
        {/* Large QR code for scanning + verification code beside it */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1">
            <QRCodeSVG
              value={qrData}
              size={100}
              level="Q"
              includeMargin={false}
            />
          </div>
          <div className="text-left">
            <p className="text-[6px] uppercase tracking-wide text-gray-400">Verification Code</p>
            <p className="font-mono text-[11px] font-bold text-gray-800">{verificationCode}</p>
          </div>
        </div>

        {/* Contact info - full width */}
        <div className="w-full border-t border-dashed border-gray-200 pt-1">
          <p className="text-center text-[6px] font-semibold uppercase tracking-wide text-gray-400">If found, please return to:</p>
          <p className="text-center text-[8px] font-bold text-gray-800 leading-tight">Goinze International School</p>
          <p className="text-center text-[6px] font-medium text-gray-600 leading-tight">of Medical Health Science and Technology</p>
          <div className="mt-0.5 flex justify-center gap-3">
            <p className="text-[6px] text-gray-500">Tel: 08105576617, 08058176193, 09163316143</p>
            <p className="text-[6px] text-gray-500">Email: gonzenicmhst@gmail.com</p>
          </div>
          <p className="mt-0.5 text-center text-[6px] leading-tight text-gray-400">
            This card is the property of the school. Unauthorized use is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Preview Modal ───────────────────────────────────────────────── */

function PreviewModal({
  person,
  mode,
  cardNo,
  expiry,
  verificationCode,
  photoUrl,
  school,
  hasCard,
  onClose,
  onGenerate,
  onExportPdf,
}: {
  person: any;
  mode: CardMode;
  cardNo: string;
  expiry: string;
  verificationCode: string;
  photoUrl: string | null;
  school: SchoolProfile | null;
  hasCard: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onExportPdf: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <div className="p-6">
          <h3 className="mb-1 text-lg font-bold text-gray-900">ID Card Preview</h3>
          <p className="mb-6 text-sm text-gray-500">{fullName(person)} — {mode === 'student' ? 'Student' : 'Staff'}</p>

          {/* Cards */}
          <div className="flex flex-col items-center gap-6">
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Front</p>
              <IdCardFront person={person} mode={mode} cardNo={cardNo} expiry={expiry} photoUrl={photoUrl} school={school} />
            </div>
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Back</p>
              <IdCardBack
                person={person}
                mode={mode}
                cardNo={cardNo}
                verificationCode={verificationCode}
                expiry={expiry}
                school={school}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!hasCard && (
              <button onClick={onGenerate} className="btn-primary px-4 py-2 text-sm">
                <ShieldCheck className="h-4 w-4" /> Generate Card
              </button>
            )}
            {hasCard && (
              <button onClick={onExportPdf} className="btn-primary px-4 py-2 text-sm">
                <Download className="h-4 w-4" /> Download PDF
              </button>
            )}
            <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function DigitalIdCardsPage() {
  const router = useRouter();

  // Role guard
  useEffect(() => {
    const token = getCookie('access_token');
    const role = token ? decodeRoleFromToken(token) : null;
    if (role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [router]);

  const [mode, setMode] = useState<CardMode>('student');

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [cardMap, setCardMap] = useState<Record<string, IdCardRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Hidden render area for PDF
  const pdfAreaRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [sessionList, deptList, schoolProfile, studentPage, staffPage, statusMap] = await Promise.all([
          sessionsApi.list(),
          studentsApi.departments(),
          settingsApi.profile().catch(() => null),
          studentsApi.list({ status: 'ACTIVE', pageSize: 500 }),
          staffApi.list({ pageSize: 500 }),
          idCardsApi.statusMap().catch(() => ({})),
        ]);
        if (cancelled) return;
        setSessions(sessionList);
        setDepartments(deptList);
        if (schoolProfile) setSchool(schoolProfile);
        setStudents(studentPage.items);
        setStaff(staffPage.items);
        setCardMap(statusMap);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const currentSession = sessions.find((s) => s.isCurrent) ?? null;

  const expiry = useMemo(() => {
    const end = new Date(Date.now() + 4 * 365 * 86_400_000);
    if (Number.isNaN(end.getTime())) return '—';
    return `${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
  }, [currentSession]);

  const sessionYear = useMemo(() => {
    const start = currentSession?.startDate ? new Date(currentSession.startDate) : null;
    return String(start && !Number.isNaN(start.getTime()) ? start.getFullYear() : new Date().getFullYear());
  }, [currentSession]);

  const cardNoFor = (id: string) => `GZ-${mode === 'student' ? 'STU' : 'STF'}-${sessionYear}-${hashCode(id)}`;
  const verifyCodeFor = (id: string) => {
    const existing = cardMap[id];
    return existing?.verificationCode ?? `${hashCode(id).slice(0, 4)}-${hashCode(id + 'v').slice(0, 4)}`;
  };

  const photoFor = (item: any): string | null => {
    if (mode === 'student') return (item as Student).passportUrl ?? null;
    return (item as StaffRecord).photoUrl ?? null;
  };

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = mode === 'student' ? students : staff;
    return items.filter((s: any) => {
      if (departmentId && s.departmentId !== departmentId) return false;
      if (q) {
        const hay = `${fullName(s)} ${s.matricNumber ?? ''} ${s.regNumber ?? ''} ${s.staffNumber ?? ''} ${s.email ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Status filter
      const hasCard = !!cardMap[s.id];
      if (statusFilter === 'issued' && !hasCard) return false;
      if (statusFilter === 'pending' && hasCard) return false;
      return true;
    });
  }, [mode, students, staff, search, departmentId, statusFilter, cardMap]);

  // Selection
  const allSelected = filtered.length > 0 && filtered.every((item: any) => selectedIds.has(item.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((item: any) => item.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Batch generate
  async function handleBatchGenerate() {
    const idsWithoutCards = filtered.filter((item: any) => !cardMap[item.id]).map((item: any) => item.id);
    if (idsWithoutCards.length === 0) return;
    setGenerating(true);
    try {
      const payload = mode === 'student'
        ? { type: 'STUDENT' as const, studentIds: idsWithoutCards }
        : { type: 'STAFF' as const, staffIds: idsWithoutCards };
      const results = await idCardsApi.batchGenerate(payload);
      // Update card map
      const newMap = { ...cardMap };
      for (const card of results) {
        const key = card.studentId ?? card.staffId;
        if (key) newMap[key] = card;
      }
      setCardMap(newMap);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cards.');
    } finally {
      setGenerating(false);
    }
  }

  // Single generate
  async function handleGenerateOne(personId: string) {
    setGenerating(true);
    try {
      const payload = mode === 'student'
        ? { type: 'STUDENT' as const, studentId: personId }
        : { type: 'STAFF' as const, staffId: personId };
      const card = await idCardsApi.generate(payload);
      setCardMap((prev) => ({ ...prev, [personId]: card }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate card.');
    } finally {
      setGenerating(false);
    }
  }

  // PDF export
  const exportPdf = useCallback(async (items: any[]) => {
    if (items.length === 0) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // CRDF credit card size in mm: 85.6 x 53.98
      const cardW = 85.6;
      const cardH = 53.98;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [cardW, cardH] });

      const container = pdfAreaRef.current;
      if (!container) throw new Error('PDF render area not found');

      // Temporarily remove overflow-hidden so html2canvas captures all content
      const cards = container.querySelectorAll<HTMLElement>('[data-card]');
      cards.forEach((el) => { el.style.overflow = 'visible'; });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const card = cardMap[item.id];
        const cNo = card?.cardNumber ?? cardNoFor(item.id);
        const vCode = card?.verificationCode ?? verifyCodeFor(item.id);

        // Render front
        const frontEl = container.querySelector(`#front-${item.id}`) as HTMLElement;
        if (frontEl) {
          const canvas = await html2canvas(frontEl, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
          if (i > 0) pdf.addPage([cardW, cardH], 'landscape');
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, cardW, cardH);
        }

        // Render back
        const backEl = container.querySelector(`#back-${item.id}`) as HTMLElement;
        if (backEl) {
          const canvas = await html2canvas(backEl, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
          pdf.addPage([cardW, cardH], 'landscape');
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, cardW, cardH);
        }
      }

      // Restore overflow-hidden
      cards.forEach((el) => { el.style.overflow = ''; });

      pdf.save(`id-cards-${mode}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed.');
    } finally {
      setExporting(false);
    }
  }, [cardMap, cardNoFor, mode, verifyCodeFor]);

  const selectedItems = filtered.filter((item: any) => selectedIds.has(item.id));
  const selectedWithCards = selectedItems.filter((item: any) => !!cardMap[item.id]);
  const selectedWithoutCards = selectedItems.filter((item: any) => !cardMap[item.id]);

  return (
    <>
      <PageHeader
        title="Digital ID Cards"
        subtitle="Generate, preview, and export identity cards for students and staff."
        action={
          <div className="flex items-center gap-2">
            {selectedWithCards.length > 0 && (
              <button
                onClick={() => exportPdf(selectedWithCards)}
                disabled={exporting}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export PDF ({selectedWithCards.length})
              </button>
            )}
            {selectedWithoutCards.length > 0 && (
              <button
                onClick={handleBatchGenerate}
                disabled={generating}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Generate ({selectedWithoutCards.length})
              </button>
            )}
          </div>
        }
      />

      {/* Mode toggle */}
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-card">
        <button
          type="button"
          onClick={() => { setMode('student'); setSearch(''); setDepartmentId(''); setSelectedIds(new Set()); setStatusFilter('all'); }}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            mode === 'student' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <GraduationCap className="h-4 w-4" /> Students
        </button>
        <button
          type="button"
          onClick={() => { setMode('staff'); setSearch(''); setDepartmentId(''); setSelectedIds(new Set()); setStatusFilter('all'); }}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            mode === 'staff' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <Briefcase className="h-4 w-4" /> Staff
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search by name or ${mode === 'student' ? 'matric number' : 'staff number'}…`}
            className="input pl-9"
          />
        </div>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input sm:w-56">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="input sm:w-44">
          <option value="all">All ({filtered.length})</option>
          <option value="issued">Card Issued</option>
          <option value="pending">No Card</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading {mode === 'student' ? 'students' : 'staff'}…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          {mode === 'student'
            ? students.length === 0 ? 'No active students found.' : 'No students match your filters.'
            : staff.length === 0 ? 'No staff records found.' : 'No staff match your filters.'}
        </div>
      ) : (
        <>
          {/* Select all */}
          <div className="mb-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              Select all ({filtered.length})
            </label>
            {selectedIds.size > 0 && (
              <span className="text-xs text-gray-500">
                {selectedIds.size} selected — {selectedWithoutCards.length} need cards, {selectedWithCards.length} have cards
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item: any) => {
              const hasCard = !!cardMap[item.id];
              const isSelected = selectedIds.has(item.id);
              return (
                <div key={item.id} className={cn('flex flex-col gap-2 rounded-xl border p-3 transition', isSelected ? 'border-brand bg-brand/5' : 'border-transparent bg-white')} style={{ width: 364 }}>
                  {/* Checkbox + status */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      {hasCard ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Card Issued
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                          No Card
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Card preview */}
                  <IdCardFront
                    person={item}
                    mode={mode}
                    cardNo={cardMap[item.id]?.cardNumber ?? cardNoFor(item.id)}
                    expiry={expiry}
                    photoUrl={photoFor(item)}
                    school={school}
                  />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => setPreviewItem(item)} className="btn-secondary flex-1 px-2 py-1.5 text-xs">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    {!hasCard ? (
                      <button
                        onClick={() => handleGenerateOne(item.id)}
                        disabled={generating}
                        className="btn-primary flex-1 px-2 py-1.5 text-xs disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Generate
                      </button>
                    ) : (
                      <button
                        onClick={() => exportPdf([item])}
                        disabled={exporting}
                        className="btn-primary flex-1 px-2 py-1.5 text-xs disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Preview modal */}
      {previewItem && (
        <PreviewModal
          person={previewItem}
          mode={mode}
          cardNo={cardMap[previewItem.id]?.cardNumber ?? cardNoFor(previewItem.id)}
          expiry={expiry}
          verificationCode={cardMap[previewItem.id]?.verificationCode ?? verifyCodeFor(previewItem.id)}
          photoUrl={photoFor(previewItem)}
          school={school}
          hasCard={!!cardMap[previewItem.id]}
          onClose={() => setPreviewItem(null)}
          onGenerate={() => { handleGenerateOne(previewItem.id); setPreviewItem(null); }}
          onExportPdf={() => { exportPdf([previewItem]); setPreviewItem(null); }}
        />
      )}

      {/* Hidden render area for PDF capture */}
      <div ref={pdfAreaRef} className="pointer-events-none fixed -left-[9999px] top-0 z-[-1]">
        {filtered.map((item: any) => (
          <div key={item.id} className="mb-4">
            <div id={`front-${item.id}`}>
              <IdCardFront
                person={item}
                mode={mode}
                cardNo={cardMap[item.id]?.cardNumber ?? cardNoFor(item.id)}
                expiry={expiry}
                photoUrl={photoFor(item)}
                school={school}
              />
            </div>
            <div id={`back-${item.id}`} className="mt-2">
              <IdCardBack
                person={item}
                mode={mode}
                cardNo={cardMap[item.id]?.cardNumber ?? cardNoFor(item.id)}
                verificationCode={cardMap[item.id]?.verificationCode ?? verifyCodeFor(item.id)}
                expiry={expiry}
                school={school}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
