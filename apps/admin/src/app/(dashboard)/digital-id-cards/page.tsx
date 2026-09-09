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
  verificationCode,
  photoUrl,
  school,
  innerRef,
}: {
  person: { id?: string; firstName: string; lastName: string; middleName?: string | null };
  mode: CardMode;
  cardNo: string;
  expiry: string;
  verificationCode: string;
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

  const role = isStudent
    ? 'Student'
    : (staff?.designation ?? (staff?.staffCategory === 'ACADEMIC' ? 'Academic Staff' : staff?.staffCategory === 'NON_ACADEMIC' ? 'Non-Academic Staff' : 'Staff'));

  // QR verification payload — the QR code now lives on the FRONT of the card.
  const qrData = buildVerificationPayload({
    verificationCode,
    cardNumber: cardNo,
    personId: person.id ?? '',
    firstName: person.firstName,
    lastName: person.lastName,
    type: isStudent ? 'STUDENT' : 'STAFF',
  });

  return (
    <div ref={innerRef} data-card className="flex h-[340px] w-[213px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className={cn('flex items-center gap-1.5 bg-gradient-to-r px-2 py-1.5 text-white', accent)}>
        <img src={school?.logoUrl || '/logo.png'} alt="" className="h-7 w-7 shrink-0 rounded-full object-contain bg-white/90 p-0.5 ring-1 ring-white/30" />
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-bold leading-[1.15]">Goinze International School</p>
          <p className="text-[6px] font-semibold leading-[1.15] opacity-90">of Medical Health Science and Technology</p>
        </div>
      </div>

      {/* Type badge */}
      <div className="flex justify-center">
        {/* Preview: inline-block + explicit line-height centers the text in the browser.
            data-badge marks this element so exportPdf() can add PDF-only padding-bottom,
            extending the amber background downward to catch the text that html2canvas
            paints slightly too low. The preview CSS itself is never modified. */}
        <span
          data-badge
          className={cn('inline-block rounded-b-md px-2.5 text-[7px] font-bold uppercase tracking-wider', badgeBg)}
          style={{ lineHeight: '14px' }}
        >
          {isStudent ? 'Student' : 'Staff'} ID
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center px-2.5 pt-2 pb-1">
        {/* Photo */}
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-[86px] w-[70px] shrink-0 rounded-lg object-cover ring-1 ring-gray-200" />
        ) : (
          <span className={cn('flex h-[86px] w-[70px] shrink-0 items-center justify-center rounded-lg text-xl font-bold ring-1', avatarBg)}>
            {initialsOf(person)}
          </span>
        )}

        {/* Name, role & ID number */}
        <p className="mt-1.5 text-center text-[11px] font-bold leading-tight text-gray-900 break-words">{fullName(person)}</p>
        <p className="text-center text-[8px] font-semibold leading-tight text-gray-600">{role}</p>
        <p className="mt-0.5 text-center font-mono text-[8px] text-gray-500 break-all">{idNumber}</p>

        {/* QR code (moved to the front for scanning) */}
        <div className="mt-1.5 flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1">
          <QRCodeSVG value={qrData} size={76} level="Q" includeMargin={false} />
        </div>
        <p className="mt-0.5 text-[6px] uppercase tracking-wide text-gray-400">Scan to verify</p>
      </div>

      {/* Footer: expiry */}
      <div className="flex items-center justify-between border-t border-dashed border-gray-200 px-2.5 py-1">
        <span className="text-[6px] uppercase tracking-wide text-gray-400">Expires</span>
        <span className="text-[8px] font-semibold text-gray-700">{expiry}</span>
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
  person: any;
  mode: CardMode;
  cardNo: string;
  verificationCode: string;
  expiry: string;
  school: SchoolProfile | null;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const isStudent = mode === 'student';
  const accent = isStudent ? 'from-blue-900 to-blue-700' : 'from-emerald-900 to-emerald-700';

  // School details (fall back to the institution's known contacts).
  const schoolName = school?.name || 'Goinze International School';
  const schoolAddress =
    school?.address ||
    'Along Verita University Road Zuma 1, Opposite ECAW Church, Bwari Area Council, Abuja, Nigeria';
  const schoolPhone = school?.phone || '0810 557 6617, 0805 817 6193, 0816 512 9613';
  const schoolEmail = school?.email || 'ishayadan5@gmail.com';

  // Details moved off the front to free up space for the portrait photo + QR.
  const department = person?.department?.name ?? '—';
  const dob = person?.dateOfBirth
    ? new Date(person.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const details: { label: string; value: string }[] = isStudent
    ? [
        { label: 'Department', value: department },
        { label: 'Level', value: person?.currentLevel ? String(person.currentLevel) : '—' },
        { label: 'Gender', value: person?.gender ?? '—' },
        { label: 'Date of Birth', value: dob },
      ]
    : [
        { label: 'Department', value: department },
        { label: 'Designation', value: person?.designation ?? '—' },
        { label: 'Gender', value: person?.gender ?? '—' },
        {
          label: 'Category',
          value:
            person?.staffCategory === 'ACADEMIC'
              ? 'Academic'
              : person?.staffCategory === 'NON_ACADEMIC'
                ? 'Non-Academic'
                : '—',
        },
      ];

  return (
    <div ref={innerRef} data-card className="flex h-[340px] w-[213px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className={cn('flex items-center gap-1.5 bg-gradient-to-r px-2 py-1.5 text-white', accent)}>
        <img src={school?.logoUrl || '/logo.png'} alt="" className="h-7 w-7 shrink-0 rounded-full object-contain bg-white/90 p-0.5 ring-1 ring-white/30" />
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-bold leading-[1.15]">Goinze International School</p>
          <p className="text-[6px] font-semibold leading-[1.15] opacity-90">of Medical Health Science and Technology</p>
        </div>
      </div>

      {/* Body — three groups spread across the portrait card */}
      <div className="flex flex-1 flex-col justify-between px-2.5 py-2">
        {/* Card + personal details */}
        <div>
          <div className="rounded-md bg-gray-50 px-2 py-1 ring-1 ring-gray-100">
            <div className="flex items-start gap-1">
              <span className="w-[56px] shrink-0 text-[6px] uppercase leading-tight tracking-wide text-gray-400">Card No</span>
              <span className="min-w-0 flex-1 break-all font-mono text-[7px] font-semibold leading-tight text-gray-700">{cardNo}</span>
            </div>
            <div className="mt-[3px] flex items-start gap-1">
              <span className="w-[56px] shrink-0 text-[6px] uppercase leading-tight tracking-wide text-gray-400">Verification</span>
              <span className="min-w-0 flex-1 break-all font-mono text-[7px] font-semibold leading-tight text-gray-700">{verificationCode}</span>
            </div>
            <div className="mt-[3px] flex items-start gap-1">
              <span className="w-[56px] shrink-0 text-[6px] uppercase leading-tight tracking-wide text-gray-400">Expires</span>
              <span className="min-w-0 flex-1 text-[7px] font-semibold leading-tight text-gray-700">{expiry}</span>
            </div>
          </div>

          <div className="mt-1.5 space-y-[3px]">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-1">
                <span className="w-[56px] shrink-0 text-[6px] uppercase leading-tight tracking-wide text-gray-400">{d.label}</span>
                <span className="min-w-0 flex-1 break-words text-[7px] font-medium leading-tight text-gray-700">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Return-to / school details */}
        <div className="border-t border-dashed border-gray-200 pt-1">
          <p className="text-center text-[6px] font-semibold uppercase tracking-wide text-gray-400">If found, please return to:</p>
          <p className="text-center text-[7.5px] font-bold leading-tight text-gray-800">{schoolName}</p>
          <p className="mt-[2px] text-center text-[6px] leading-tight text-gray-500">{schoolAddress}</p>
          <p className="text-center text-[6px] leading-tight text-gray-500">Tel: {schoolPhone}</p>
          <p className="text-center text-[6px] leading-tight text-gray-500">Email: {schoolEmail}</p>
          <p className="mt-[2px] text-center text-[5.5px] leading-tight text-gray-400">
            This card is the property of the school. Unauthorized use is prohibited.
          </p>
        </div>

        {/* Developer credit — Rhema Expert Solutions */}
        <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 pt-1">
          <img src="/rhema.png" alt="Rhema Expert Solutions" className="h-5 w-5 shrink-0 rounded-sm object-contain" />
          <div className="leading-tight">
            <p className="text-[6px] font-bold text-gray-600">Developed by Rhema Expert Solutions</p>
            <p className="text-[5.5px] text-gray-400">rhemaexpertsolutions@gmail.com</p>
          </div>
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
              <IdCardFront person={person} mode={mode} cardNo={cardNo} expiry={expiry} verificationCode={verificationCode} photoUrl={photoUrl} school={school} />
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

      // CR80 ID card in portrait: 53.98mm wide x 85.6mm tall
      const cardW = 53.98;
      const cardH = 85.6;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [cardW, cardH] });

      const container = pdfAreaRef.current;
      if (!container) throw new Error('PDF render area not found');

      // Temporarily remove overflow-hidden so html2canvas captures all content
      const cards = container.querySelectorAll<HTMLElement>('[data-card]');
      cards.forEach((el) => { el.style.overflow = 'visible'; });

      // PDF-only fix: html2canvas paints the type-badge text lower than the browser
      // does, so on the exported card it drops below the amber background. Extend each
      // badge's background downward for the capture only — the on-screen preview keeps
      // its original CSS (these instances live solely in the hidden PDF render area).
      const badges = container.querySelectorAll<HTMLElement>('[data-badge]');
      badges.forEach((el) => { el.style.paddingBottom = '5px'; });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const card = cardMap[item.id];
        const cNo = card?.cardNumber ?? cardNoFor(item.id);
        const vCode = card?.verificationCode ?? verifyCodeFor(item.id);

        // Render front
        const frontEl = container.querySelector(`#front-${item.id}`) as HTMLElement;
        if (frontEl) {
          const canvas = await html2canvas(frontEl, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
          if (i > 0) pdf.addPage([cardW, cardH], 'portrait');
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, cardW, cardH);
        }

        // Render back
        const backEl = container.querySelector(`#back-${item.id}`) as HTMLElement;
        if (backEl) {
          const canvas = await html2canvas(backEl, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
          pdf.addPage([cardW, cardH], 'portrait');
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, cardW, cardH);
        }
      }

      // Restore overflow-hidden and badge padding (preview stays pixel-identical)
      cards.forEach((el) => { el.style.overflow = ''; });
      badges.forEach((el) => { el.style.paddingBottom = ''; });

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
                <div key={item.id} className={cn('flex flex-col gap-2 rounded-xl border p-3 transition', isSelected ? 'border-brand bg-brand/5' : 'border-transparent bg-white')} style={{ width: 239 }}>
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
                    verificationCode={cardMap[item.id]?.verificationCode ?? verifyCodeFor(item.id)}
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
                verificationCode={cardMap[item.id]?.verificationCode ?? verifyCodeFor(item.id)}
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
