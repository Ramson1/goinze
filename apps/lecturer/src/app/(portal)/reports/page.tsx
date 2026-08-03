'use client';

import { Award, BookOpen, Download, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { ClassPerformanceChart, type ClassReportRow } from '@/components/charts';
import {
  lecturerApi,
  type AttendanceRecord,
  type CourseRosterResponse,
} from '@/lib/api';
import { cn } from '@/lib/cn';

interface ReportRow extends ClassReportRow {
  hasAttendance: boolean;
  graded: number;
}

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const courses = await lecturerApi.courses();
        const perCourse = await Promise.all(
          courses.map(async (course) => {
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

        const next: ReportRow[] = [];
        for (const { course, roster, attendance } of perCourse) {
          if (!roster) continue;
          const students = roster.students;
          const graded = students.filter((s) => s.totalScore != null);
          const average =
            graded.length > 0
              ? Math.round(
                  graded.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / graded.length,
                )
              : 0;
          const passed = graded.filter((s) => (s.totalScore ?? 0) >= 50).length;
          const passRate = graded.length > 0 ? Math.round((passed / graded.length) * 100) : 0;

          const present = attendance.filter(
            (r) => r.status === 'PRESENT' || r.status === 'LATE',
          ).length;
          const hasAttendance = attendance.length > 0;
          const attendanceRate = hasAttendance
            ? Math.round((present / attendance.length) * 100)
            : 0;

          next.push({
            courseCode: course.code,
            enrolled: students.length,
            average,
            passRate,
            attendance: attendanceRate,
            hasAttendance,
            graded: graded.length,
          });
        }
        setRows(next);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reports');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalStudents = rows.reduce((sum, r) => sum + r.enrolled, 0);
  const gradedRows = rows.filter((r) => r.graded > 0);
  const overallAverage =
    gradedRows.length > 0
      ? Math.round(gradedRows.reduce((sum, r) => sum + r.average, 0) / gradedRows.length)
      : 0;
  const overallPassRate =
    gradedRows.length > 0
      ? Math.round(gradedRows.reduce((sum, r) => sum + r.passRate, 0) / gradedRows.length)
      : 0;

  function exportCsv() {
    const header = 'Course,Enrolled,Graded,Average Score %,Pass Rate %,Attendance %';
    const lines = rows.map((r) =>
      [
        r.courseCode,
        r.enrolled,
        r.graded,
        r.graded > 0 ? r.average : '',
        r.graded > 0 ? r.passRate : '',
        r.hasAttendance ? r.attendance : '',
      ].join(','),
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course-reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const reportColumns: DataTableColumn<ReportRow>[] = [
    {
      key: 'courseCode',
      header: 'Course',
      render: (r) => <span className="font-semibold text-slate-900">{r.courseCode}</span>,
    },
    { key: 'enrolled', header: 'Enrolled' },
    {
      key: 'average',
      header: 'Average Score',
      render: (r) =>
        r.graded === 0 ? (
          <span className="text-xs text-slate-400">Not graded</span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${r.average}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-700">{r.average}%</span>
          </div>
        ),
    },
    {
      key: 'passRate',
      header: 'Pass Rate',
      render: (r) =>
        r.graded === 0 ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
              r.passRate >= 85
                ? 'bg-emerald-100 text-emerald-700'
                : r.passRate >= 75
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700',
            )}
          >
            {r.passRate}%
          </span>
        ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (r) =>
        r.hasAttendance ? (
          <span className="text-slate-600">{r.attendance}%</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Academic performance summaries for your allocated courses."
        actions={
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="btn-secondary disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> Export Report
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="py-16 text-center text-sm text-slate-400">Loading reports…</Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Courses"
              value={rows.length}
              sub="Allocated this session"
              icon={BookOpen}
            />
            <StatCard label="Students" value={totalStudents} sub="Across all courses" icon={Users} />
            <StatCard
              label="Average Score"
              value={`${overallAverage}%`}
              sub="Mean of course averages"
              icon={TrendingUp}
            />
            <StatCard
              label="Pass Rate"
              value={`${overallPassRate}%`}
              sub="Students scoring 50+"
              icon={Award}
              iconClassName="bg-amber-100 text-amber-600"
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Class Performance" subtitle="Average score vs pass rate per course" />
              <CardBody>
                {rows.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No course data available yet.
                  </p>
                ) : (
                  <ClassPerformanceChart data={rows} />
                )}
              </CardBody>
            </Card>

            <DataTable
              columns={reportColumns}
              rows={rows}
              rowKey={(r) => r.courseCode}
              emptyMessage="No courses allocated yet."
            />
          </div>
        </>
      )}
    </>
  );
}
