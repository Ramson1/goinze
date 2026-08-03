'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import {
  academicsApi,
  type CourseRecord,
  type DepartmentFull,
  type Paginated,
} from '@/lib/api';

const SEMESTERS = ['FIRST', 'SECOND', 'THIRD'];
const LEVELS = [100, 200, 300, 400, 500, 600];
const PAGE_SIZE = 10;

function semesterLabel(sem: string): string {
  const map: Record<string, string> = { FIRST: 'First', SECOND: 'Second', THIRD: 'Third' };
  return map[sem] ?? sem;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Paginated<CourseRecord> | null>(null);
  const [departments, setDepartments] = useState<DepartmentFull[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add-course form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    title: '',
    departmentId: '',
    creditUnits: '3',
    level: '100',
    semester: 'FIRST',
  });

  const loadCourses = useCallback(() => {
    setLoading(true);
    setError(null);
    academicsApi
      .courses({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        departmentId: deptFilter || undefined,
        level: levelFilter ? Number(levelFilter) : undefined,
        semester: semFilter || undefined,
      })
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses.'))
      .finally(() => setLoading(false));
  }, [page, search, deptFilter, levelFilter, semFilter]);

  useEffect(() => {
    academicsApi
      .departments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [search, deptFilter, levelFilter, semFilter]);

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await academicsApi.createCourse({
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        departmentId: form.departmentId || undefined,
        creditUnits: Number(form.creditUnits),
        level: Number(form.level),
        semester: form.semester,
      });
      setNotice(`Course ${form.code.trim().toUpperCase()} created.`);
      setForm({ code: '', title: '', departmentId: '', creditUnits: '3', level: '100', semester: 'FIRST' });
      setShowForm(false);
      loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create course.');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<CourseRecord>[] = [
    {
      key: 'code',
      header: 'Code',
      className: 'font-mono text-xs font-semibold text-brand whitespace-nowrap',
    },
    {
      key: 'title',
      header: 'Course Title',
      render: (c) => <span className="font-medium text-gray-900">{c.title}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      render: (c) => c.department?.name ?? <span className="text-gray-400">—</span>,
    },
    { key: 'creditUnits', header: 'Units', className: 'text-right whitespace-nowrap' },
    { key: 'level', header: 'Level', className: 'whitespace-nowrap' },
    {
      key: 'semester',
      header: 'Semester',
      className: 'whitespace-nowrap',
      render: (c) => semesterLabel(c.semester),
    },
    {
      key: 'lecturer',
      header: 'Lecturer',
      render: (c) => {
        const a = c.allocations[0];
        if (!a?.staff) return <span className="text-gray-400">Unassigned</span>;
        const s = a.staff;
        return (
          <span className="whitespace-nowrap">
            {s.title ? `${s.title} ` : ''}
            {s.firstName} {s.lastName}
          </span>
        );
      },
    },
  ];

  const totalPages = courses?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Course catalogue across all departments."
        action={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add Course'}
          </button>
        }
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <form
            onSubmit={submitCourse}
            className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div>
              <label className="label">Code</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
                placeholder="CSC 101"
                className="input"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="label">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Introduction to Programming"
                className="input"
              />
            </div>
            <div>
              <label className="label">Department</label>
              <select
                value={form.departmentId}
                onChange={(e) => setField('departmentId', e.target.value)}
                className="input"
              >
                <option value="">— None —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Units</label>
              <input
                type="number"
                min={1}
                max={6}
                value={form.creditUnits}
                onChange={(e) => setField('creditUnits', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Level</label>
              <select
                value={form.level}
                onChange={(e) => setField('level', e.target.value)}
                className="input"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Semester</label>
              <select
                value={form.semester}
                onChange={(e) => setField('semester', e.target.value)}
                className="input"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {semesterLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end lg:col-span-6">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Course
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or title…"
              className="input pl-9"
              aria-label="Search courses"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input sm:w-48"
              aria-label="Filter by department"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="input sm:w-28"
              aria-label="Filter by level"
            >
              <option value="">All levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
              className="input sm:w-32"
              aria-label="Filter by semester"
            >
              <option value="">All semesters</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {semesterLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading courses…
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={courses?.items ?? []}
              keyField="id"
              emptyMessage="No courses match your filters."
            />
            {courses && courses.total > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-500">
                  Page {courses.page} of {totalPages} · {courses.total} courses
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
