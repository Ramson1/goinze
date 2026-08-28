'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  Download,
  Eye,
  Loader2,
  QrCode,
  Save,
  Search,
  X,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import QrScannerModal from '@/components/QrScannerModal';
import {
  lecturerApi,
  type AllocatedCourse,
  type RosterStudent,
  type AttendanceSession,
  type AttendanceSessionDetail,
  type QrScanResult,
} from '@/lib/api';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type MainTab = 'take' | 'overview';
type SubTab = 'Manual' | 'QR';

function formatDate(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dayName(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-GB', { weekday: 'short' });
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttendancePage() {
  // Shared state
  const [courses, setCourses] = useState<AllocatedCourse[]>([]);
  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>('take');

  // Manual attendance state
  const [subTab, setSubTab] = useState<SubTab>('Manual');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [records, setRecords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // QR scanning state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<
    { studentId: string; name: string; matricNo: string | null; time: string; duplicate: boolean }[]
  >([]);

  // Overview state
  const [overviewSessions, setOverviewSessions] = useState<AttendanceSession[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewCourseFilter, setOverviewCourseFilter] = useState('');
  const [expandedSession, setExpandedSession] = useState<{ courseId: string; date: string } | null>(null);
  const [sessionDetails, setSessionDetails] = useState<AttendanceSessionDetail[]>([]);
  const [sessionDetailsLoading, setSessionDetailsLoading] = useState(false);

  // Load courses on mount
  useEffect(() => {
    lecturerApi
      .courses()
      .then((list) => {
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses.'));
  }, []);

  // Load roster + existing attendance when course/date changes (manual mode)
  const loadRoster = useCallback(() => {
    if (!courseId || subTab !== 'Manual') return;
    setLoading(true);
    setError(null);
    setSaved(false);
    Promise.all([
      lecturerApi.roster(courseId),
      lecturerApi.attendance(courseId, date).catch(() => []),
    ])
      .then(([ros, existing]) => {
        setRoster(ros.students);
        const map: Record<string, boolean> = {};
        for (const s of ros.students) map[s.studentId] = true;
        for (const rec of existing) map[rec.studentId] = rec.status === 'PRESENT';
        setRecords(map);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load roster.'))
      .finally(() => setLoading(false));
  }, [courseId, date, subTab]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  // Load overview when tab changes
  useEffect(() => {
    if (mainTab !== 'overview') return;
    setOverviewLoading(true);
    lecturerApi
      .attendanceOverview(overviewCourseFilter || undefined)
      .then(setOverviewSessions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load overview.'))
      .finally(() => setOverviewLoading(false));
  }, [mainTab, overviewCourseFilter]);

  // Manual attendance helpers
  const presentCount = roster.filter((s) => records[s.studentId] !== false).length;
  const selectedCourse = courses.find((c) => c.id === courseId);

  function setStatus(studentId: string, present: boolean) {
    setSaved(false);
    setRecords((prev) => ({ ...prev, [studentId]: present }));
  }

  function markAll(present: boolean) {
    setSaved(false);
    const next: Record<string, boolean> = {};
    for (const s of roster) next[s.studentId] = present;
    setRecords(next);
  }

  async function handleSave() {
    if (!courseId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await lecturerApi.markAttendance(
        courseId,
        date,
        roster.map((s) => ({
          studentId: s.studentId,
          status: records[s.studentId] !== false ? 'PRESENT' : 'ABSENT',
        })),
      );
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }

  // Autocomplete filtering
  const filteredRoster = searchQuery.trim()
    ? roster.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.matricNo ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : roster;

  // QR scan handler
  async function handleQrScanSuccess(result: QrScanResult): Promise<void> {
    const name = `${result.student.firstName} ${result.student.lastName}`;
    setScannedStudents((prev) => {
      if (prev.some((s) => s.studentId === result.student.id)) return prev;
      return [
        {
          studentId: result.student.id,
          name,
          matricNo: result.student.matricNumber,
          time: new Date().toLocaleTimeString(),
          duplicate: result.duplicate,
        },
        ...prev,
      ];
    });
  }

  function handleQrScanError(msg: string) {
    setError(msg);
  }

  // Overview: expand session to see details
  async function toggleSessionDetail(courseIdSession: string, sessionDate: string) {
    const key = `${courseIdSession}|||${sessionDate}`;
    if (expandedSession?.courseId === courseIdSession && expandedSession?.date === sessionDate) {
      setExpandedSession(null);
      setSessionDetails([]);
      return;
    }
    setExpandedSession({ courseId: courseIdSession, date: sessionDate });
    setSessionDetailsLoading(true);
    try {
      const details = await lecturerApi.attendanceSession(courseIdSession, sessionDate);
      setSessionDetails(details);
    } catch {
      setSessionDetails([]);
    } finally {
      setSessionDetailsLoading(false);
    }
  }

  // CSV export for overview
  function exportOverviewCsv() {
    const header = ['Course Code', 'Course Title', 'Date', 'Day', 'Present', 'Absent', 'Late', 'Total', 'Method'];
    const rows = overviewSessions.map((s) => [
      s.courseCode,
      s.courseTitle,
      s.date,
      dayName(s.date),
      s.presentCount,
      s.absentCount,
      s.lateCount,
      s.totalMarked,
      s.methods.join('; '),
    ]);
    downloadCsv('attendance-overview.csv', header, rows);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark and track attendance for your classes." />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main tab bar */}
      <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {([['take', 'Take Attendance', ClipboardCheck], ['overview', 'Attendance Overview', Eye]] as const).map(
          ([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMainTab(key); setError(null); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors',
                mainTab === key
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ),
        )}
      </div>

      {/* ================================================================== */}
      {/* TAB 1: TAKE ATTENDANCE                                             */}
      {/* ================================================================== */}
      {mainTab === 'take' && (
        <>
          {/* Controls */}
          <Card className="mb-5">
            <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="label">Course</label>
                <select
                  value={courseId}
                  onChange={(e) => { setCourseId(e.target.value); setScannedStudents([]); }}
                  className="input"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {subTab === 'Manual' && (
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </div>
              )}

              {/* Sub-tab toggle */}
              <div>
                <label className="label">Mode</label>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(['Manual', 'QR'] as SubTab[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setSubTab(m); setError(null); }}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        subTab === m
                          ? 'bg-white text-brand shadow-sm'
                          : 'text-slate-500 hover:text-slate-700',
                      )}
                    >
                      {m === 'QR' ? <QrCode className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                      {m === 'QR' ? 'Scan QR' : m}
                    </button>
                  ))}
                </div>
              </div>

              {subTab === 'Manual' && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Attendance
                </button>
              )}

              {subTab === 'QR' && (
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  disabled={!courseId}
                  className="btn-primary disabled:opacity-60"
                >
                  <QrCode className="h-4 w-4" />
                  Open Scanner
                </button>
              )}
            </CardBody>
          </Card>

          {/* ----- Manual sub-tab ----- */}
          {subTab === 'Manual' && (
            <>
              {/* Autocomplete search */}
              <Card className="mb-4">
                <CardBody className="py-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search students by name or matric number…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-9"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Showing {filteredRoster.length} of {roster.length} students
                    </p>
                  )}
                </CardBody>
              </Card>

              {loading ? (
                <Card>
                  <CardBody className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading roster…
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardHeader
                    title={`${selectedCourse?.code ?? ''} — ${date}`}
                    subtitle={`${presentCount} of ${roster.length} present`}
                    action={
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => markAll(true)} className="btn-secondary px-3 py-1.5 text-xs">
                          Mark all present
                        </button>
                        <button type="button" onClick={() => markAll(false)} className="btn-secondary px-3 py-1.5 text-xs">
                          Mark all absent
                        </button>
                      </div>
                    }
                  />
                  <CardBody className="divide-y divide-slate-100 px-0 py-0">
                    {filteredRoster.map((s) => {
                      const present = records[s.studentId] !== false;
                      const name = `${s.firstName} ${s.lastName}`;
                      return (
                        <div
                          key={s.studentId}
                          className="flex items-center justify-between gap-4 px-5 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                              {name.split(' ').map((n) => n[0]).join('')}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{name}</p>
                              <p className="text-xs text-slate-400">
                                {s.matricNo ?? '—'}
                                {s.attendance && (
                                  <span className="ml-2 inline-flex items-center gap-1">
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                                      {s.attendance.present + s.attendance.late}/{s.attendance.total}
                                    </span>
                                    <span className={cn(
                                      'font-semibold',
                                      s.attendance.rate >= 75 ? 'text-emerald-600' : s.attendance.rate >= 50 ? 'text-amber-600' : 'text-red-600',
                                    )}>
                                      {s.attendance.rate}%
                                    </span>
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="inline-flex rounded-lg border border-slate-200 p-1">
                            <button
                              type="button"
                              onClick={() => setStatus(s.studentId, true)}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                                present ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50',
                              )}
                            >
                              <Check className="h-3.5 w-3.5" /> Present
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus(s.studentId, false)}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                                !present ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-50',
                              )}
                            >
                              <X className="h-3.5 w-3.5" /> Absent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredRoster.length === 0 && (
                      <p className="px-5 py-10 text-center text-sm text-slate-400">
                        {searchQuery ? 'No students match your search.' : 'No students enrolled in this course.'}
                      </p>
                    )}
                  </CardBody>
                  {saved && (
                    <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
                      Attendance for {selectedCourse?.code} on {date} saved successfully.
                    </div>
                  )}
                </Card>
              )}
            </>
          )}

          {/* ----- QR sub-tab ----- */}
          {subTab === 'QR' && (
            <Card>
              <CardHeader
                title={`${selectedCourse?.code ?? ''} — QR Attendance`}
                subtitle={`${scannedStudents.filter((s) => !s.duplicate).length} students marked present`}
                action={
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    <QrCode className="h-3.5 w-3.5" /> Open Scanner
                  </button>
                }
              />
              <CardBody className="px-0 py-0">
                {scannedStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                      <QrCode className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-900">No students scanned yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                      Click &quot;Open Scanner&quot; and scan each student&apos;s ID card QR code to mark them present.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {scannedStudents.map((s) => (
                      <div key={s.studentId} className="flex items-center justify-between gap-4 px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold',
                              s.duplicate ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600',
                            )}
                          >
                            {s.duplicate ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-400">
                              {s.matricNo ?? '—'} · {s.time}
                            </p>
                          </div>
                        </div>
                        {s.duplicate && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Already marked
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* ================================================================== */}
      {/* TAB 2: ATTENDANCE OVERVIEW                                         */}
      {/* ================================================================== */}
      {mainTab === 'overview' && (
        <>
          {/* Filters + export */}
          <Card className="mb-5">
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="label">Filter by Course</label>
                <select
                  value={overviewCourseFilter}
                  onChange={(e) => setOverviewCourseFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={exportOverviewCsv}
                disabled={overviewSessions.length === 0}
                className="btn-secondary disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </CardBody>
          </Card>

          {/* Sessions table */}
          {overviewLoading ? (
            <Card>
              <CardBody className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading attendance sessions…
              </CardBody>
            </Card>
          ) : overviewSessions.length === 0 ? (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardCheck className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No attendance sessions recorded yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Attendance sessions will appear here once you start marking attendance.
                </p>
              </CardBody>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Course</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3 text-center">Present</th>
                      <th className="px-4 py-3 text-center">Absent</th>
                      <th className="px-4 py-3 text-center">Late</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overviewSessions.map((s) => {
                      const isExpanded =
                        expandedSession?.courseId === s.courseId && expandedSession?.date === s.date;
                      return (
                        <SessionRow
                          key={`${s.courseId}|||${s.date}`}
                          session={s}
                          isExpanded={isExpanded}
                          details={isExpanded ? sessionDetails : undefined}
                          detailsLoading={isExpanded ? sessionDetailsLoading : false}
                          onToggle={() => toggleSessionDetail(s.courseId, s.date)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        courseId={courseId}
        onScanSuccess={handleQrScanSuccess}
        onScanError={handleQrScanError}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SessionRow — expandable table row for overview
// ---------------------------------------------------------------------------

function SessionRow({
  session: s,
  isExpanded,
  details,
  detailsLoading,
  onToggle,
}: {
  session: AttendanceSession;
  isExpanded: boolean;
  details?: AttendanceSessionDetail[];
  detailsLoading: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="transition hover:bg-slate-50">
        <td className="px-5 py-3">
          <span className="font-semibold text-slate-900">{s.courseCode}</span>
          <span className="ml-1.5 text-xs text-slate-400">{s.courseTitle}</span>
        </td>
        <td className="px-4 py-3 text-slate-600">{formatDate(s.date)}</td>
        <td className="px-4 py-3 text-slate-500">{dayName(s.date)}</td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {s.presentCount}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
            {s.absentCount}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {s.lateCount}
          </span>
        </td>
        <td className="px-4 py-3 text-center font-semibold text-slate-900">{s.totalMarked}</td>
        <td className="px-4 py-3">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {s.methods.map((m) => (m === 'QR_CODE' ? 'QR Scan' : m === 'MANUAL' ? 'Manual' : m)).join(', ')}
          </span>
        </td>
        <td className="px-5 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
          >
            <Eye className="h-3.5 w-3.5" />
            {isExpanded ? 'Hide' : 'View'}
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')}
            />
          </button>
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={10} className="bg-slate-50/70 px-5 py-4">
            {detailsLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading details…
              </div>
            ) : details && details.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-4">Student</th>
                      <th className="py-2 pr-4">Matric No</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Method</th>
                      <th className="py-2">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {details.map((d) => (
                      <tr key={d.id}>
                        <td className="py-1.5 pr-4 font-medium text-slate-900">
                          {d.firstName} {d.lastName}
                        </td>
                        <td className="py-1.5 pr-4 text-slate-500">{d.matricNumber ?? '—'}</td>
                        <td className="py-1.5 pr-4">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              d.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : d.status === 'ABSENT'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700',
                            )}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-1.5 pr-4 text-slate-500">
                          {d.method === 'QR_CODE' ? 'QR Scan' : d.method === 'MANUAL' ? 'Manual' : d.method}
                        </td>
                        <td className="py-1.5">
                          {d.overallAttendance && (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                                {d.overallAttendance.present + d.overallAttendance.late}/{d.overallAttendance.total}
                              </span>
                              <span className={cn(
                                'text-[10px] font-semibold',
                                d.overallAttendance.rate >= 75 ? 'text-emerald-600' : d.overallAttendance.rate >= 50 ? 'text-amber-600' : 'text-red-600',
                              )}>
                                {d.overallAttendance.rate}%
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">No records found for this session.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
