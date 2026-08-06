'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  Filter,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  UserX,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  cmsApi,
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
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const LEVELS = [100, 200, 300, 400, 500, 600];
const STATUSES: StudentStatus[] = [
  'APPLICANT',
  'ACTIVE',
  'SUSPENDED',
  'GRADUATED',
  'WITHDRAWN',
  'ARCHIVED',
];
const PAGE_SIZE = 10;

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [students, setStudents] = useState<Paginated<Student> | null>(null);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [search, setSearch] = useState(initialSearch);
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

  // Edit-student modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    gender: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    stateOfOrigin: '',
    nationality: '',
    matricNumber: '',
    departmentId: '',
    currentLevel: '100',
    status: 'ACTIVE' as StudentStatus,
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);

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

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName ?? '',
      gender: student.gender ?? '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
      email: student.email ?? '',
      phone: student.phone ?? '',
      address: student.address ?? '',
      stateOfOrigin: student.stateOfOrigin ?? '',
      nationality: student.nationality ?? '',
      matricNumber: student.matricNumber ?? '',
      departmentId: student.departmentId ?? '',
      currentLevel: String(student.currentLevel ?? 100),
      status: student.status,
    });
    setPassportFile(null);
  }

  function setEditField(key: keyof typeof editForm, value: string) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  async function submitEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingStudent) return;
    setEditSaving(true);
    setError(null);
    setNotice(null);
    try {
      let passportUrl = editingStudent.passportUrl ?? undefined;
      if (passportFile) {
        const uploaded = await cmsApi.uploadMedia(passportFile);
        passportUrl = uploaded.url;
      }
      await studentsApi.update(editingStudent.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        middleName: editForm.middleName.trim() || undefined,
        gender: editForm.gender || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        address: editForm.address.trim() || undefined,
        stateOfOrigin: editForm.stateOfOrigin.trim() || undefined,
        nationality: editForm.nationality.trim() || undefined,
        matricNumber: editForm.matricNumber.trim() || undefined,
        departmentId: editForm.departmentId || undefined,
        currentLevel: Number(editForm.currentLevel),
        status: editForm.status,
        passportUrl,
      });
      setNotice(`${editForm.firstName.trim()} ${editForm.lastName.trim()} updated.`);
      setEditingStudent(null);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update student.');
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteStudent(student: Student) {
    if (!window.confirm(`Delete ${student.firstName} ${student.lastName}? This cannot be undone.`)) return;
    setActingId(student.id);
    setError(null);
    setNotice(null);
    try {
      await studentsApi.remove(student.id);
      setNotice(`${student.firstName} ${student.lastName} deleted.`);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete student.');
    } finally {
      setActingId(null);
    }
  }

  async function handlePromote() {
    if (!window.confirm('Promote all active students to the next level? This will increment each active student\'s level by 100.')) return;
    setPromoting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await studentsApi.promote();
      setNotice(`Successfully promoted ${result.promoted} student${result.promoted !== 1 ? 's' : ''} to the next level.`);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
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
        <div className="flex items-center gap-2.5">
          {s.passportUrl ? (
            <img
              src={s.passportUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
              {s.firstName[0]}{s.lastName[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">
              {s.firstName} {s.lastName}
            </p>
            <p className="text-xs text-gray-400">{s.email ?? '—'}</p>
          </div>
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
        return (
          <div className="flex items-center gap-1.5">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openEditModal(s)}
                  title="Edit"
                  className="btn-secondary px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
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
                <button
                  type="button"
                  onClick={() => deleteStudent(s)}
                  title="Delete"
                  className="btn-secondary px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePromote}
              disabled={promoting}
              className="btn-secondary flex items-center gap-1.5 text-sm text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
            >
              {promoting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronsUp className="h-4 w-4" />
              )}
              Promote All
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add Student'}
            </button>
          </div>
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditingStudent(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Student</h2>
                <p className="text-xs text-gray-500">
                  {editingStudent.firstName} {editingStudent.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitEdit} className="px-6 py-5">
              {/* Personal Info */}
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Personal Information</h3>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">First name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditField('firstName', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditField('lastName', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Middle name</label>
                  <input
                    type="text"
                    value={editForm.middleName}
                    onChange={(e) => setEditField('middleName', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditField('gender', e.target.value)}
                    className="input"
                  >
                    <option value="">— Select —</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {titleCase(g)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date of birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditField('dateOfBirth', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditField('email', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditField('phone', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Nationality</label>
                  <input
                    type="text"
                    value={editForm.nationality}
                    onChange={(e) => setEditField('nationality', e.target.value)}
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditField('address', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">State of origin</label>
                  <input
                    type="text"
                    value={editForm.stateOfOrigin}
                    onChange={(e) => setEditField('stateOfOrigin', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Academic Info */}
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Academic Information</h3>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Matric number</label>
                  <input
                    type="text"
                    value={editForm.matricNumber}
                    onChange={(e) => setEditField('matricNumber', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Department</label>
                  <select
                    value={editForm.departmentId}
                    onChange={(e) => setEditField('departmentId', e.target.value)}
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
                    value={editForm.currentLevel}
                    onChange={(e) => setEditField('currentLevel', e.target.value)}
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
                    value={editForm.status}
                    onChange={(e) => setEditField('status', e.target.value as StudentStatus)}
                    className="input"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {titleCase(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Passport Photo */}
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Passport Photo</h3>
              <div className="mb-5">
                {editingStudent.passportUrl && !passportFile && (
                  <div className="mb-2 flex items-center gap-3">
                    <img
                      src={editingStudent.passportUrl}
                      alt="Current passport"
                      className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200"
                    />
                    <span className="text-xs text-gray-500">Current photo</span>
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-500">
                  <Upload className="h-4 w-4" />
                  {passportFile ? passportFile.name : 'Choose new passport photo…'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  {editSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
