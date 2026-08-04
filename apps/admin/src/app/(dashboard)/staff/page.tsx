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
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import {
  staffApi,
  studentsApi,
  type DepartmentRef,
  type Paginated,
  type StaffRecord,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Adjunct'];
const STAFF_CATEGORIES = [
  { value: 'ACADEMIC', label: 'Academic Staff' },
  { value: 'NON_ACADEMIC', label: 'Non-Academic Staff' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
];
const PAGE_SIZE = 10;

export default function StaffPage() {
  const [staff, setStaff] = useState<Paginated<StaffRecord> | null>(null);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add-staff form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    staffNumber: '',
    departmentId: '',
    designation: '',
    employmentType: 'Full-time',
    isLecturer: false,
    staffCategory: '',
  });

  const loadStaff = useCallback(() => {
    setLoading(true);
    setError(null);
    staffApi
      .list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        departmentId: deptFilter || undefined,
        isLecturer: roleFilter || undefined,
      })
      .then(setStaff)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load staff.'))
      .finally(() => setLoading(false));
  }, [page, search, deptFilter, roleFilter]);

  useEffect(() => {
    studentsApi
      .departments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [search, deptFilter, roleFilter]);

  async function removeStaff(s: StaffRecord) {
    if (!window.confirm(`Remove ${s.firstName} ${s.lastName}? This cannot be undone.`)) return;
    setRemovingId(s.id);
    setError(null);
    setNotice(null);
    try {
      await staffApi.remove(s.id);
      setNotice(`${s.firstName} ${s.lastName} removed.`);
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove staff.');
    } finally {
      setRemovingId(null);
    }
  }

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await staffApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        title: form.title.trim() || undefined,
        email: form.email.trim() || undefined,
        staffNumber: form.staffNumber.trim() || undefined,
        departmentId: form.departmentId || undefined,
        designation: form.designation.trim() || undefined,
        employmentType: form.employmentType,
        isLecturer: form.isLecturer,
        staffCategory: form.staffCategory || undefined,
      });
      setNotice(`${form.firstName.trim()} ${form.lastName.trim()} added.`);
      setForm({
        firstName: '',
        lastName: '',
        title: '',
        email: '',
        staffNumber: '',
        departmentId: '',
        designation: '',
        employmentType: 'Full-time',
        isLecturer: false,
        staffCategory: '',
      });
      setShowForm(false);
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add staff.');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<StaffRecord>[] = [
    {
      key: 'staffNumber',
      header: 'Staff No',
      className: 'font-mono text-xs whitespace-nowrap',
      render: (s) => s.staffNumber ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (s) => (
        <div>
          <p className="font-medium text-gray-900">
            {s.title ? `${s.title} ` : ''}
            {s.firstName} {s.lastName}
          </p>
          <p className="text-xs text-gray-400">{s.email ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (s) => s.designation ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'department',
      header: 'Department',
      render: (s) => s.department?.name ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (s) => (
        <span
          className={cn(
            'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            s.isLecturer
              ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
              : 'bg-gray-100 text-gray-600 ring-gray-500/20',
          )}
        >
          {s.isLecturer ? 'Lecturer' : 'Staff'}
        </span>
      ),
    },
    {
      key: 'staffCategory',
      header: 'Category',
      render: (s) => {
        if (!s.staffCategory) return <span className="text-gray-400">—</span>;
        const cat = STAFF_CATEGORIES.find((c) => c.value === s.staffCategory);
        const colors: Record<string, string> = {
          ACADEMIC: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
          NON_ACADEMIC: 'bg-amber-50 text-amber-700 ring-amber-600/20',
          ADMINISTRATIVE: 'bg-purple-50 text-purple-700 ring-purple-600/20',
        };
        return (
          <span
            className={cn(
              'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              colors[s.staffCategory] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20',
            )}
          >
            {cat?.label ?? s.staffCategory}
          </span>
        );
      },
    },
    {
      key: 'employmentType',
      header: 'Type',
      className: 'whitespace-nowrap',
      render: (s) => s.employmentType ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (s) =>
        removingId === s.id ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <button
            type="button"
            onClick={() => removeStaff(s)}
            title="Remove"
            className="btn-secondary px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ),
    },
  ];

  const totalPages = staff?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Manage academic and administrative staff accounts."
        action={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add Staff'}
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
            onSubmit={submitStaff}
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
              <label className="label">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Dr."
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
              <label className="label">Staff number</label>
              <input
                type="text"
                value={form.staffNumber}
                onChange={(e) => setField('staffNumber', e.target.value)}
                placeholder="GDU-STAFF-0002"
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
              <label className="label">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setField('designation', e.target.value)}
                placeholder="Senior Lecturer"
                className="input"
              />
            </div>
            <div>
              <label className="label">Employment type</label>
              <select
                value={form.employmentType}
                onChange={(e) => setField('employmentType', e.target.value)}
                className="input"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 lg:col-span-3">
              <input
                id="isLecturer"
                type="checkbox"
                checked={form.isLecturer}
                onChange={(e) => setField('isLecturer', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <label htmlFor="isLecturer" className="text-sm font-medium text-gray-700">
                This staff member is a lecturer (can be assigned courses)
              </label>
            </div>
            <div>
              <label className="label">Staff category</label>
              <select
                value={form.staffCategory}
                onChange={(e) => setField('staffCategory', e.target.value)}
                className="input"
              >
                <option value="">— Select —</option>
                {STAFF_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Staff
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
              placeholder="Search by name, staff no or email…"
              className="input pl-9"
              aria-label="Search staff"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input sm:w-40"
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              <option value="true">Lecturers</option>
              <option value="false">Staff</option>
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
            <Loader2 className="h-5 w-5 animate-spin" /> Loading staff…
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={staff?.items ?? []}
              keyField="id"
              emptyMessage="No staff match your filters."
            />
            {staff && staff.total > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-500">
                  Page {staff.page} of {totalPages} · {staff.total} staff
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
