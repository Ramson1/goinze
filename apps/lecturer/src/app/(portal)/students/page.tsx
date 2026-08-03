'use client';

import { Download, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import {
  lecturerApi,
  type AllocatedCourse,
  type AttendanceRecord,
  type CourseRosterResponse,
} from '@/lib/api';
import { cn } from '@/lib/cn';

interface StudentRow {
  key: string;
  name: string;
  matricNo: string | null;
  level: number | null;
  courseId: string;
  courseCode: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  attendanceRate: number | null;
}

/** Group a course's attendance records into a present-rate per student. */
function attendanceRates(records: AttendanceRecord[]): Record<string, number> {
  const tally: Record<string, { present: number; total: number }> = {};
  for (const r of records) {
    if (!r.studentId) continue;
    const t = (tally[r.studentId] ??= { present: 0, total: 0 });
    t.total += 1;
    if (r.status === 'PRESENT' || r.status === 'LATE') t.present += 1;
  }
  const rates: Record<string, number> = {};
  for (const [studentId, t] of Object.entries(tally)) {
    rates[studentId] = t.total > 0 ? Math.round((t.present / t.total) * 100) : 0;
  }
  return rates;
}

const columns: DataTableColumn<StudentRow>[] = [
  {
    key: 'name',
    header: 'Student',
    render: (row) => (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
          {row.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </span>
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.matricNo ?? 'No matric no.'}</p>
        </div>
      </div>
    ),
  },
  { key: 'courseCode', header: 'Course' },
  {
    key: 'level',
    header: 'Level',
    render: (row) => (row.level != null ? `${row.level}00` : '—'),
  },
  {
    key: 'attendanceRate',
    header: 'Attendance',
    render: (row) =>
      row.attendanceRate == null ? (
        <span className="text-xs text-slate-400">—</span>
      ) : (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full',
                row.attendanceRate >= 85
                  ? 'bg-emerald-500'
                  : row.attendanceRate >= 70
                    ? 'bg-amber-500'
                    : 'bg-red-500',
              )}
              style={{ width: `${row.attendanceRate}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600">{row.attendanceRate}%</span>
        </div>
      ),
  },
  {
    key: 'totalScore',
    header: 'Current Total',
    render: (row) =>
      row.totalScore == null ? (
        <span className="text-xs text-slate-400">Not graded</span>
      ) : (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            row.totalScore >= 70
              ? 'bg-emerald-100 text-emerald-700'
              : row.totalScore >= 50
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700',
          )}
        >
          {row.totalScore}%
        </span>
      ),
  },
];

export default function StudentsPage() {
  const [courses, setCourses] = useState<AllocatedCourse[]>([]);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const courseList = await lecturerApi.courses();
        if (cancelled) return;
        setCourses(courseList);

        const perCourse = await Promise.all(
          courseList.map(async (course) => {
            const [roster, attendance] = await Promise.all([
              lecturerApi
                .roster(course.id)
                .catch((): CourseRosterResponse | null => null),
              lecturerApi.courseAttendance(course.id).catch(() => [] as AttendanceRecord[]),
            ]);
            return { course, roster, attendance };
          }),
        );
        if (cancelled) return;

        const next: StudentRow[] = [];
        for (const { course, roster, attendance } of perCourse) {
          if (!roster) continue;
          const rates = attendanceRates(attendance);
          for (const s of roster.students) {
            next.push({
              key: `${course.id}:${s.studentId}`,
              name: `${s.firstName} ${s.lastName}`,
              matricNo: s.matricNo,
              level: s.level,
              courseId: course.id,
              courseCode: course.code,
              caScore: s.caScore,
              examScore: s.examScore,
              totalScore:
                s.totalScore ??
                (s.caScore != null && s.examScore != null ? s.caScore + s.examScore : null),
              attendanceRate: rates[s.studentId] ?? null,
            });
          }
        }
        setRows(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load students');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesCourse = courseFilter === 'all' || r.courseId === courseFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === '' ||
        r.name.toLowerCase().includes(q) ||
        (r.matricNo ?? '').toLowerCase().includes(q);
      return matchesCourse && matchesQuery;
    });
  }, [rows, courseFilter, query]);

  function exportCsv() {
    const header = 'Name,Matric No,Course,Level,Attendance %,CA Score,Exam Score,Total';
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = filtered.map((r) =>
      [
        escape(r.name),
        escape(r.matricNo ?? ''),
        escape(r.courseCode),
        r.level ?? '',
        r.attendanceRate ?? '',
        r.caScore ?? '',
        r.examScore ?? '',
        r.totalScore ?? '',
      ].join(','),
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="All students enrolled across your allocated courses."
        actions={
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="btn-secondary disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or matric no…"
            className="input pl-9"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="input sm:w-64"
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4" /> {filtered.length} student
          {filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <Card className="py-16 text-center text-sm text-slate-400">Loading students…</Card>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.key}
          emptyMessage="No students match your filters."
        />
      )}
    </>
  );
}
