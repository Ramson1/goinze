'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, GraduationCap, Loader2, Printer, QrCode, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  sessionsApi,
  studentsApi,
  type AcademicSessionRecord,
  type DepartmentRef,
  type Student,
} from '@/lib/api';

/** Deterministic short hash for card serials. */
function hashCode(input: string): string {
  let h = 7;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

/** Pseudo-barcode bar widths derived from the card serial. */
function barsFor(code: string): number[] {
  return code.split('').map((ch) => (ch.charCodeAt(0) % 3) + 1);
}

function initialsOf(student: Student): string {
  return `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
}

function fullName(student: Student): string {
  return `${student.firstName} ${student.lastName}`.trim();
}

function Barcode({ code }: { code: string }) {
  const bars = barsFor(code);
  return (
    <div className="flex h-8 items-end gap-[2px]" aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} className="bg-gray-900" style={{ width: w, height: '100%' }} />
      ))}
    </div>
  );
}

function IdCardView({
  student,
  cardNo,
  expiry,
}: {
  student: Student;
  cardNo: string;
  expiry: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
      {/* Card header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-900 to-brand px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-200" />
          <span className="text-sm font-bold tracking-tight">Goinze International School of Medical Health Science and Technology</span>
        </div>
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-950">
          Student ID
        </span>
      </div>

      {/* Card body */}
      <div className="flex gap-4 px-5 py-4">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-2xl font-bold text-brand ring-1 ring-brand/20">
          {initialsOf(student)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-gray-900">{fullName(student)}</p>
          <p className="font-mono text-xs text-gray-500">
            {student.matricNumber ?? student.regNumber ?? 'Not assigned'}
          </p>
          <dl className="mt-2 space-y-0.5 text-xs">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Department</dt>
              <dd className="truncate font-medium text-gray-700">
                {student.department?.name ?? '—'}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Level</dt>
              <dd className="font-medium text-gray-700">
                {student.currentLevel ? `${student.currentLevel}00 Level` : '—'}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Expires</dt>
              <dd className="font-medium text-gray-700">{expiry}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between border-t border-dashed border-gray-200 px-5 py-3">
        <div>
          <p className="font-mono text-[11px] text-gray-500">{cardNo}</p>
          <Barcode code={cardNo} />
        </div>
        <QrCode className="h-10 w-10 text-gray-300" />
      </div>
    </div>
  );
}

export default function DigitalIdCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [printTarget, setPrintTarget] = useState<'all' | string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [page, deps, sessionList] = await Promise.all([
          studentsApi.list({ status: 'ACTIVE', pageSize: 200 }),
          studentsApi.departments(),
          sessionsApi.list(),
        ]);
        if (cancelled) return;
        setStudents(page.items);
        setDepartments(deps);
        setSessions(sessionList);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load students.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentSession = sessions.find((s) => s.isCurrent) ?? null;

  const expiry = useMemo(() => {
    const end = currentSession?.endDate
      ? new Date(currentSession.endDate)
      : new Date(Date.now() + 365 * 86_400_000);
    if (Number.isNaN(end.getTime())) return '—';
    return `${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
  }, [currentSession]);

  const sessionYear = useMemo(() => {
    const start = currentSession?.startDate ? new Date(currentSession.startDate) : null;
    return String(start && !Number.isNaN(start.getTime()) ? start.getFullYear() : new Date().getFullYear());
  }, [currentSession]);

  const cardNoFor = (student: Student) => `GZ-ID-${sessionYear}-${hashCode(student.id)}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (departmentId && s.departmentId !== departmentId) return false;
      if (!q) return true;
      const haystack = `${fullName(s)} ${s.matricNumber ?? ''} ${s.regNumber ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [students, search, departmentId]);

  function handlePrint(target: 'all' | string) {
    setPrintTarget(target);
    // Give React a tick to render the print area before opening the dialog.
    window.setTimeout(() => {
      window.print();
      setPrintTarget(null);
    }, 100);
  }

  const printStudents =
    printTarget === null
      ? []
      : printTarget === 'all'
        ? filtered
        : filtered.filter((s) => s.id === printTarget);

  return (
    <>
      <style jsx global>{`
        #id-print-area {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #id-print-area,
          #id-print-area * {
            visibility: visible !important;
          }
          #id-print-area {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            padding: 24px;
            background: white;
          }
        }
      `}</style>

      <PageHeader
        title="Digital ID Cards"
        subtitle="Identity cards for active students, generated from live records."
        action={
          <button
            type="button"
            onClick={() => handlePrint('all')}
            disabled={loading || filtered.length === 0}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" /> Print All ({filtered.length})
          </button>
        }
      />

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
            placeholder="Search by name or matric number…"
            className="input pl-9"
          />
        </div>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="input sm:w-64"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading students…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          {students.length === 0
            ? 'No active students found. Admit students to generate ID cards.'
            : 'No students match your filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((student) => (
            <div key={student.id} className="flex flex-col gap-2">
              <IdCardView student={student} cardNo={cardNoFor(student)} expiry={expiry} />
              <button
                type="button"
                onClick={() => handlePrint(student.id)}
                className="btn-secondary self-end px-3 py-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print Card
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Print-only render area */}
      <div id="id-print-area">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {printStudents.map((student) => (
            <IdCardView
              key={student.id}
              student={student}
              cardNo={cardNoFor(student)}
              expiry={expiry}
            />
          ))}
        </div>
      </div>
    </>
  );
}
