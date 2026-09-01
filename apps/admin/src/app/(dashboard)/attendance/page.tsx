'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  Eye,
  Loader2,
  Search,
  Users,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import {
  academicsApi,
  attendanceApi,
  type AttendanceSessionRecord,
  type AttendanceSessionSummary,
  type CourseRecord,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tab = 'sessions' | 'lecturers';

function formatDate(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dayName(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-GB', { weekday: 'short' });
}

function rate(present: number, late: number, total: number): number {
  return total > 0 ? Math.round(((present + late) / total) * 100) : 0;
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
// Lecturer summary type (built client-side)
// ---------------------------------------------------------------------------

interface LecturerSummary {
  staffId: string;
  name: string;
  courses: { courseId: string; courseCode: string; courseTitle: string }[];
  totalSessions: number;
  totalMarked: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttendancePage() {
  const [tab, setTab] = useState<Tab>('sessions');

  // Shared data
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sessions tab filters
  const [filterCourseId, setFilterCourseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Session detail modal
  const [modalSession, setModalSession] = useState<{ courseId: string; date: string; courseCode: string; courseTitle: string } | null>(null);
  const [modalRecords, setModalRecords] = useState<AttendanceSessionRecord[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Lecturers tab
  const [expandedLecturer, setExpandedLecturer] = useState<string | null>(null);
  const [lecturerSearch, setLecturerSearch] = useState('');

  // ---- Data fetching ----

  const fetchCourses = useCallback(async () => {
    try {
      const res = await academicsApi.courses({ pageSize: 500 });
      setCourses(res.items ?? []);
    } catch {
      // non-critical — courses list may be empty
    }
  }, []);

  const fetchSessions = useCallback(async (courseId?: string) => {
    try {
      const data = await attendanceApi.overview(courseId || undefined);
      setSessions(data);
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        await fetchCourses();
        const data = await attendanceApi.overview();
        if (!cancelled) setSessions(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load attendance data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [fetchCourses]);

  // Re-fetch sessions when course filter changes
  useEffect(() => {
    if (tab !== 'sessions') return;
    let cancelled = false;
    (async () => {
      try {
        const data = await attendanceApi.overview(filterCourseId || undefined);
        if (!cancelled) setSessions(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load sessions.');
      }
    })();
    return () => { cancelled = true; };
  }, [filterCourseId, tab]);

  // ---- Session detail modal ----

  const openSessionDetail = useCallback(async (courseId: string, date: string, courseCode: string, courseTitle: string) => {
    setModalSession({ courseId, date, courseCode, courseTitle });
    setModalLoading(true);
    setModalRecords([]);
    try {
      const records = await attendanceApi.sessionDetail(courseId, date);
      setModalRecords(records);
    } catch {
      setModalRecords([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalSession(null);
    setModalRecords([]);
  }, []);

  // ---- Filtered sessions ----

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.courseCode.toLowerCase().includes(q) ||
        s.courseTitle.toLowerCase().includes(q) ||
        s.lecturers.some((l) => l.toLowerCase().includes(q)),
    );
  }, [sessions, searchQuery]);

  // ---- Lecturer summaries (built from courses + sessions) ----

  const lecturerSummaries = useMemo<LecturerSummary[]>(() => {
    // Build staffId → lecturer info from course allocations
    const staffMap = new Map<string, { name: string; courses: { courseId: string; courseCode: string; courseTitle: string }[] }>();

    for (const course of courses) {
      for (const alloc of course.allocations ?? []) {
        if (!alloc.staff) continue;
        const name = [alloc.staff.title, alloc.staff.firstName, alloc.staff.lastName].filter(Boolean).join(' ');
        if (!staffMap.has(alloc.staffId)) {
          staffMap.set(alloc.staffId, { name, courses: [] });
        }
        staffMap.get(alloc.staffId)!.courses.push({
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
        });
      }
    }

    // For each lecturer, compute attendance stats from sessions
    const result: LecturerSummary[] = [];
    for (const [staffId, info] of staffMap) {
      const courseIds = new Set(info.courses.map((c) => c.courseId));
      const relevantSessions = sessions.filter((s) => courseIds.has(s.courseId));

      const totalSessions = relevantSessions.length;
      const totalMarked = relevantSessions.reduce((sum, s) => sum + s.totalMarked, 0);
      const totalPresent = relevantSessions.reduce((sum, s) => sum + s.presentCount, 0);
      const totalAbsent = relevantSessions.reduce((sum, s) => sum + s.absentCount, 0);
      const totalLate = relevantSessions.reduce((sum, s) => sum + s.lateCount, 0);

      result.push({
        staffId,
        name: info.name || 'Unknown',
        courses: info.courses,
        totalSessions,
        totalMarked,
        totalPresent,
        totalAbsent,
        totalLate,
      });
    }

    // Sort by total sessions desc
    return result.sort((a, b) => b.totalSessions - a.totalSessions);
  }, [courses, sessions]);

  const filteredLecturers = useMemo(() => {
    if (!lecturerSearch.trim()) return lecturerSummaries;
    const q = lecturerSearch.toLowerCase();
    return lecturerSummaries.filter((l) => l.name.toLowerCase().includes(q));
  }, [lecturerSummaries, lecturerSearch]);

  // ---- CSV export ----

  const exportSessionsCsv = () => {
    const header = ['Course Code', 'Course Title', 'Lecturer(s)', 'Date', 'Present', 'Absent', 'Late', 'Total', 'Rate (%)'];
    const rows = filteredSessions.map((s) => [
      s.courseCode,
      s.courseTitle,
      s.lecturers.join('; '),
      formatDate(s.date),
      s.presentCount,
      s.absentCount,
      s.lateCount,
      s.totalMarked,
      rate(s.presentCount, s.lateCount, s.totalMarked),
    ]);
    downloadCsv('attendance-sessions.csv', header, rows);
  };

  const exportLecturersCsv = () => {
    const header = ['Lecturer', 'Courses', 'Sessions', 'Total Marked', 'Present', 'Absent', 'Late', 'Rate (%)'];
    const rows = filteredLecturers.map((l) => [
      l.name,
      l.courses.length,
      l.totalSessions,
      l.totalMarked,
      l.totalPresent,
      l.totalAbsent,
      l.totalLate,
      rate(l.totalPresent, l.totalLate, l.totalMarked),
    ]);
    downloadCsv('attendance-by-lecturer.csv', header, rows);
  };

  // ---- Render ----

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="View all attendance sessions by course and lecturer across the institution."
        action={
          <button
            type="button"
            onClick={tab === 'sessions' ? exportSessionsCsv : exportLecturersCsv}
            disabled={loading}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab buttons */}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setTab('sessions')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition',
            tab === 'sessions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <ClipboardList className="h-4 w-4" /> All Sessions
        </button>
        <button
          type="button"
          onClick={() => setTab('lecturers')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition',
            tab === 'lecturers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <Users className="h-4 w-4" /> By Lecturer
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading attendance data…
        </div>
      ) : (
        <>
          {tab === 'sessions' && (
            <SessionsTab
              sessions={filteredSessions}
              courses={courses}
              filterCourseId={filterCourseId}
              onFilterChange={setFilterCourseId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onViewSession={openSessionDetail}
            />
          )}
          {tab === 'lecturers' && (
            <LecturersTab
              lecturers={filteredLecturers}
              sessions={sessions}
              searchQuery={lecturerSearch}
              onSearchChange={setLecturerSearch}
              expandedLecturer={expandedLecturer}
              onToggleExpand={(id) => setExpandedLecturer((prev) => (prev === id ? null : id))}
            />
          )}
        </>
      )}

      {/* Session Detail Modal */}
      {modalSession && (
        <SessionDetailModal
          session={modalSession}
          records={modalRecords}
          loading={modalLoading}
          onClose={closeModal}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sessions Tab
// ---------------------------------------------------------------------------

function SessionsTab({
  sessions,
  courses,
  filterCourseId,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onViewSession,
}: {
  sessions: AttendanceSessionSummary[];
  courses: CourseRecord[];
  filterCourseId: string;
  onFilterChange: (v: string) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onViewSession: (courseId: string, date: string, courseCode: string, courseTitle: string) => void;
}) {
  return (
    <Card title="Attendance Sessions" subtitle={`${sessions.length} session${sessions.length === 1 ? '' : 's'} recorded`}>
      {/* Filters */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by course code, title, or lecturer…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterCourseId}
          onChange={(e) => onFilterChange(e.target.value)}
          className="input-field sm:w-56"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Lecturer(s)</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-center">Present</th>
              <th className="px-5 py-3 text-center">Absent</th>
              <th className="px-5 py-3 text-center">Late</th>
              <th className="px-5 py-3 text-center">Total</th>
              <th className="px-5 py-3 text-center">Rate</th>
              <th className="px-5 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">
                  No attendance sessions found.
                </td>
              </tr>
            ) : (
              sessions.map((s, idx) => {
                const r = rate(s.presentCount, s.lateCount, s.totalMarked);
                return (
                  <tr key={`${s.courseId}-${s.date}-${idx}`} className="hover:bg-brand/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{s.courseCode}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{s.courseTitle}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {s.lecturers.length > 0 ? (
                        <span className="text-sm">{s.lecturers.join(', ')}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900">{formatDate(s.date)}</p>
                      <p className="text-xs text-gray-400">{dayName(s.date)}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-semibold text-emerald-700">{s.presentCount}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-semibold text-rose-600">{s.absentCount}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-semibold text-amber-600">{s.lateCount}</span>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-gray-900">{s.totalMarked}</td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex min-w-[3rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
                          r >= 75
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : r >= 50
                              ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                              : 'bg-rose-50 text-rose-700 ring-rose-600/20',
                        )}
                      >
                        {r}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onViewSession(s.courseId, s.date, s.courseCode, s.courseTitle)}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                        title="View session details"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Lecturers Tab
// ---------------------------------------------------------------------------

function LecturersTab({
  lecturers,
  sessions,
  searchQuery,
  onSearchChange,
  expandedLecturer,
  onToggleExpand,
}: {
  lecturers: LecturerSummary[];
  sessions: AttendanceSessionSummary[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  expandedLecturer: string | null;
  onToggleExpand: (staffId: string) => void;
}) {
  return (
    <Card title="Attendance by Lecturer" subtitle={`${lecturers.length} lecturer${lecturers.length === 1 ? '' : 's'} with course allocations`}>
      {/* Search */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by lecturer name…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Lecturer list */}
      <div className="divide-y divide-gray-100">
        {lecturers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            No lecturers with course allocations found.
          </p>
        ) : (
          lecturers.map((lec) => {
            const isExpanded = expandedLecturer === lec.staffId;
            const r = rate(lec.totalPresent, lec.totalLate, lec.totalMarked);

            // Get per-course sessions for expanded view
            const courseDetails = isExpanded
              ? lec.courses.map((c) => {
                  const courseSessions = sessions.filter((s) => s.courseId === c.courseId);
                  const totalMarked = courseSessions.reduce((sum, s) => sum + s.totalMarked, 0);
                  const totalPresent = courseSessions.reduce((sum, s) => sum + s.presentCount, 0);
                  const totalLate = courseSessions.reduce((sum, s) => sum + s.lateCount, 0);
                  return {
                    ...c,
                    sessions: courseSessions.length,
                    totalMarked,
                    rate: rate(totalPresent, totalLate, totalMarked),
                  };
                })
              : [];

            return (
              <div key={lec.staffId} className="group">
                {/* Lecturer row */}
                <button
                  type="button"
                  onClick={() => onToggleExpand(lec.staffId)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {lec.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{lec.name}</p>
                    <p className="text-xs text-gray-500">
                      {lec.courses.length} course{lec.courses.length === 1 ? '' : 's'} · {lec.totalSessions} session{lec.totalSessions === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="hidden items-center gap-6 sm:flex">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{lec.totalMarked}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Marked</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-700">{lec.totalPresent}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-rose-600">{lec.totalAbsent}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Absent</p>
                    </div>
                    <div className="text-center">
                      <span
                        className={cn(
                          'inline-flex min-w-[3rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                          r >= 75
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : r >= 50
                              ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                              : 'bg-rose-50 text-rose-700 ring-rose-600/20',
                        )}
                      >
                        {r}%
                      </span>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">Rate</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {/* Expanded course details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Courses &amp; Attendance
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          <tr>
                            <th className="pb-2 pr-4">Course</th>
                            <th className="pb-2 pr-4 text-center">Sessions</th>
                            <th className="pb-2 pr-4 text-center">Total Marked</th>
                            <th className="pb-2 text-center">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {courseDetails.map((cd) => (
                            <tr key={cd.courseId}>
                              <td className="py-2 pr-4">
                                <p className="font-medium text-gray-900">{cd.courseCode}</p>
                                <p className="text-xs text-gray-500">{cd.courseTitle}</p>
                              </td>
                              <td className="py-2 pr-4 text-center text-gray-700">{cd.sessions}</td>
                              <td className="py-2 pr-4 text-center font-semibold text-gray-900">{cd.totalMarked}</td>
                              <td className="py-2 text-center">
                                <span
                                  className={cn(
                                    'inline-flex min-w-[3rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
                                    cd.rate >= 75
                                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                      : cd.rate >= 50
                                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                        : 'bg-rose-50 text-rose-700 ring-rose-600/20',
                                  )}
                                >
                                  {cd.rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Session Detail Modal
// ---------------------------------------------------------------------------

function SessionDetailModal({
  session,
  records,
  loading,
  onClose,
}: {
  session: { courseId: string; date: string; courseCode: string; courseTitle: string };
  records: AttendanceSessionRecord[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {session.courseCode} — {session.courseTitle}
            </h2>
            <p className="text-sm text-gray-500">
              {formatDate(session.date)} ({dayName(session.date)}) · {records.length} student{records.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading session details…
            </div>
          ) : records.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">No attendance records for this session.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Matric No.</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Method</th>
                  <th className="px-5 py-3 text-center">Overall (This Course)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-brand/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">
                        {r.firstName} {r.lastName}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.matricNumber ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs font-medium text-gray-500">
                        {r.method.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="font-semibold text-emerald-700">{r.overallAttendance.present}P</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-semibold text-rose-600">{r.overallAttendance.absent}A</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-semibold text-amber-600">{r.overallAttendance.late}L</span>
                        <span className="text-gray-300">·</span>
                        <span
                          className={cn(
                            'font-semibold',
                            r.overallAttendance.rate >= 75
                              ? 'text-emerald-700'
                              : r.overallAttendance.rate >= 50
                                ? 'text-amber-600'
                                : 'text-rose-600',
                          )}
                        >
                          {r.overallAttendance.rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
