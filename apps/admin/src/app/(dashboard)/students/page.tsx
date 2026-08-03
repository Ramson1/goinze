'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  UserX,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  studentsApi,
  type DepartmentRef,
  type Paginated,
  type Student,
  type StudentStatus,
} from '@/lib/api';

const STATUS_FILTERS: Array<StudentStatus | ''> = [
  '',
  'ACTIVE',
  'APPLICANT',
  'SUSPENDED',
  'GRADUATED',
  'WITHDRAWN',
  'ARCHIVED',
];
const LEVELS = [100, 200, 300, 400, 500, 600];
const PAGE_SIZE = 10;

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Paginated<Student> | null>(null);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add-student form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    matricNumber: '',
    departmentId: '',
    currentLevel: '100',
    status: 'ACTIVE' as StudentStatus,
  });

  const loadStudents = useCallback(() => {
    setLoading(true);
    setError(null);
    studentsApi
      .list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
        departmentId: deptFilter || undefined,
      })
      .then(setStudents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load students.'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, deptFilter]);

  useEffect(() => {
    studentsApi
      .departments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, deptFilter]);

  async function runAction(
    student: Student,
    action: 'suspend' | 'graduate' | 'archive' | 'reactivate',
  ) {
    const labels: Record<string, string> = {
      suspend: `Suspend ${student.firstName} ${student.lastName}?`,
      graduate: `Mark ${student.firstName} ${student.lastName} as graduated?`,
      archive: `Archive ${student.firstName} ${student.lastName}? This hides them from active lists.`,
      reactivate: `Reactivate ${student.firstName} ${student.lastName}?`,
    };
    if (!window.confirm(labels[action])) return;

    setActingId(student.id);
    setError(null);
    setNotice(null);
    try {
      if (action === 'suspend') await studentsApi.suspend(student.id);
      else if (action === 'graduate') await studentsApi.graduate(student.id);
      else if (action === 'archive') await studentsApi.archive(student.id);
      else await studentsApi.update(student.id, { status: 'ACTIVE' });
      setNotice(`${student.firstName} ${student.lastName} updated.`);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActingId(null);
    }
  }

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await studentsApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        matricNumber: form.matricNumber.trim() || undefined,
        departmentId: form.departmentId || undefined,
        currentLevel: Number(form.currentLevel),
        status: form.status,
      });
      setNotice(`${form.firstName.trim()} ${form.lastName.trim()} added.`);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        matricNumber: '',
        departmentId: '',
        currentLevel: '100',
        status: 'ACTIVE',
      });
      setShowForm(false);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add student.');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Student>[] = [
    {
      key: 'matricNumber',
      header: 'Matric No',
      className: 'font-mono text-xs whitespace-nowrap',
      render: (s) => s.matricNumber ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (s) => (
        <div>
          <p className="font-medium text-gray-900">
            {s.firstName} {s.lastName}
          </p>
          <p className="text-xs text-gray-400">{s.email ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (s) => s.department?.name ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'currentLevel',
      header: 'Level',
      className: 'whitespace-nowrap',
      render: (s) => (s.currentLevel ? `${s.currentLevel} Level` : '—'),
    },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => {
        const busy = actingId === s.id;
        if (s.status === 'ARCHIVED' || s.status === 'GRADUATED') {
          return <span className="text-xs text-gray-400">—</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <>
                {s.status === 'ACTIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => runAction(s, 'suspend')}
                      title="Suspend"
                      className="btn-secondary px-2 py-1.5 text-xs text-amber-600 hover:bg-amber-50"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(s, 'graduate')}
                      title="Graduate"
                      className="btn-secondary px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {s.status === 'SUSPENDED' && (
                  <button
                    type="button"
                    onClick={() => runAction(s, 'reactivate')}
                    title="Reactivate"
                    className="btn-secondary px-2 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => runAction(s, 'archive')}
                  title="Archive"
                  className="btn-secondary px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const totalPages = students?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Manage student records, enrollment and status."
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add Student'}
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
            onSubmit={submitStudent}
            className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="label">First name</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Last name</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Matric number</label>
              <input
                type="text"
                value={form.matricNumber}
                onChange={(e) => setField('matricNumber', e.target.value)}
                placeholder="Auto if blank"
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
              <label className="label">Level</label>
              <select
                value={form.currentLevel}
                onChange={(e) => setField('currentLevel', e.target.value)}
                className="input"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l} Level
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value as StudentStatus)}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="APPLICANT">Applicant</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Student
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
              placeholder="Search by name, matric no or email…"
              className="input pl-9"
              aria-label="Search students"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input sm:w-40"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === '' ? 'All statuses' : titleCase(s)}
                </option>
              ))}
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input sm:w-56"
              aria-label="Filter by department"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading students…
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={students?.items ?? []}
              keyField="id"
              emptyMessage="No students match your filters."
            />
            {students && students.total > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-500">
                  Page {students.page} of {totalPages} · {students.total} students
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
