'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BarChart3, BookOpen, Loader2, Upload, Users } from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { lecturerApi, type AllocatedCourse } from '@/lib/api';
import { useLecturer } from '@/lib/lecturer-context';

const accents = ['#0f766e', '#14b8a6', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function CoursesPage() {
  const { profile } = useLecturer();
  const [courses, setCourses] = useState<AllocatedCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lecturerApi
      .courses()
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses.'));
  }, []);

  const totalUnits = (courses ?? []).reduce((sum, c) => sum + c.creditUnits, 0);

  return (
    <>
      <PageHeader
        title="My Courses"
        subtitle={
          courses
            ? `${courses.length} courses allocated · ${totalUnits} credit units · ${
                profile?.session ?? 'Current session'
              }`
            : 'Courses allocated to you this session.'
        }
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!courses ? (
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading courses…
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No courses have been allocated to you yet.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, i) => {
            const color = accents[i % accents.length];
            return (
              <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="h-1.5" style={{ backgroundColor: color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
                        style={{ backgroundColor: `${color}1a`, color }}
                      >
                        {course.code}
                      </span>
                      <h3 className="mt-2 text-base font-semibold text-slate-900">
                        {course.title}
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {course.level} Level · {course.semester} Semester
                    {course.department ? ` · ${course.department}` : ''}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Students</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <Users className="h-4 w-4 text-brand" /> {course.studentCount}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Credit Units</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {course.creditUnits} units
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <Link
                      href={`/upload-scores?course=${course.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20"
                    >
                      <Upload className="h-3.5 w-3.5" /> Enter scores
                    </Link>
                    <Link
                      href={`/results?course=${course.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> Results
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
