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
  Clipboard,
  ClipboardCheck,
  FileText,
  Filter,
  GraduationCap,
  Key,
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
  financeApi,
  studentsApi,
  type DepartmentRef,
  type Paginated,
  type Student,
  type StudentFeeBreakdown,
  type StudentPayment,
  type StudentResult,
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
const LEVELS = [100, 200, 300];
const STATUSES: StudentStatus[] = [
  'APPLICANT',
  'ACTIVE',
  'SUSPENDED',
  'GRADUATED',
  'WITHDRAWN',
  'ARCHIVED',
];
const PAGE_SIZE = 10;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

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
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check user role on mount
  useEffect(() => {
    const token = getCookie('access_token');
    const role = token ? decodeRoleFromToken(token) : null;
    setIsSuperAdmin(role === 'SUPER_ADMIN');
  }, []);

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
  const [graduatingAll, setGraduatingAll] = useState(false);

  // Reset password modal
  const [resetPasswordStudent, setResetPasswordStudent] = useState<Student | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState<string | null>(null);

  // Academic record modal
  const [recordStudent, setRecordStudent] = useState<Student | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [studentFees, setStudentFees] = useState<StudentFeeBreakdown | null>(null);
  const [copiedPw, setCopiedPw] = useState<string | null>(null);

  // Custom confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

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
        level: levelFilter ? Number(levelFilter) : undefined,
      })
      .then(setStudents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load students.'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, deptFilter, levelFilter]);

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
  }, [search, statusFilter, deptFilter, levelFilter]);

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
    setConfirmDialog({
      message: labels[action],
      onConfirm: () => {
        setConfirmDialog(null);
        doRunAction(student, action);
      },
    });
  }

  async function doRunAction(
    student: Student,
    action: 'suspend' | 'graduate' | 'archive' | 'reactivate',
  ) {
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

  async function handleResetPassword(student: Student) {
    setConfirmDialog({
      message: `Reset password for ${student.firstName} ${student.lastName}? A new temporary password will be generated.`,
      onConfirm: () => {
        setConfirmDialog(null);
        doResetPassword(student);
      },
    });
  }

  async function doResetPassword(student: Student) {
    setResettingPassword(true);
    setError(null);
    setNotice(null);
    try {
      const result = await studentsApi.resetPassword(student.id);
      setNewTempPassword(result.tempPassword);
      setResetPasswordStudent(student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setResettingPassword(false);
    }
  }

  async function openRecord(student: Student) {
    setRecordStudent(student);
    setRecordLoading(true);
    try {
      const [full, fees] = await Promise.all([
        studentsApi.get(student.id),
        financeApi.studentFees(student.id).catch(() => ({ items: [], summary: { total: 0, paid: 0, outstanding: 0 } }) as StudentFeeBreakdown),
      ]);
      setRecordStudent(full);
      setStudentFees(fees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student record.');
    } finally {
      setRecordLoading(false);
    }
  }

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopiedPw(pw);
    setTimeout(() => setCopiedPw(null), 2000);
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
    setConfirmDialog({
      message: `Delete ${student.firstName} ${student.lastName}? This cannot be undone.`,
      onConfirm: () => {
        setConfirmDialog(null);
        doDeleteStudent(student);
      },
    });
  }

  async function doDeleteStudent(student: Student) {
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
    setConfirmDialog({
      message: "Promote all active students to the next level? This will increment each active student's level by 100. Maximum level is 300.",
      onConfirm: () => {
        setConfirmDialog(null);
        doPromote();
      },
    });
  }

  async function doPromote() {
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

  async function handleGraduateAll() {
    setConfirmDialog({
      message: 'Graduate all active 300-level students? This will change their status to GRADUATED.',
      onConfirm: () => {
        setConfirmDialog(null);
        doGraduateAll();
      },
    });
  }

  async function doGraduateAll() {
    setGraduatingAll(true);
    setError(null);
    setNotice(null);
    try {
      const result = await studentsApi.graduateAll();
      setNotice(`Successfully graduated ${result.graduated} student${result.graduated !== 1 ? 's' : ''}.`);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Graduation failed.');
    } finally {
      setGraduatingAll(false);
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
      key: 'tempPassword',
      header: 'Password',
      className: 'font-mono text-xs whitespace-nowrap',
      render: (s) =>
        s.tempPassword ? (
          <button
            type="button"
            onClick={() => copyPassword(s.tempPassword!)}
            className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 hover:bg-purple-100"
            title="Click to copy"
          >
            {copiedPw === s.tempPassword ? <ClipboardCheck className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
            {s.tempPassword}
          </button>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => {
        const busy = actingId === s.id;
        return (
          <div className="flex flex-col gap-1">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <>
                {/* Row 1 */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openRecord(s)}
                    title="View full academic record"
                    className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-teal-600 hover:bg-teal-50"
                  >
                    <FileText className="h-3.5 w-3.5" /> Record
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(s)}
                    title="Edit"
                    className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(s)}
                    disabled={resettingPassword}
                    title="Reset Password"
                    className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                  >
                    {resettingPassword && actingId === s.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Key className="h-3.5 w-3.5" />
                    )}
                    Reset password
                  </button>
                </div>
                {/* Row 2 */}
                <div className="flex items-center gap-1.5">
                  {s.status === 'ACTIVE' && (
                    <>
                      <button
                        type="button"
                        onClick={() => runAction(s, 'suspend')}
                        title="Suspend"
                        className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-amber-600 hover:bg-amber-50"
                      >
                        <UserX className="h-3.5 w-3.5" /> Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction(s, 'graduate')}
                        title="Graduate"
                        className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        <GraduationCap className="h-3.5 w-3.5" /> Graduate
                      </button>
                    </>
                  )}
                  {s.status === 'SUSPENDED' && (
                    <button
                      type="button"
                      onClick={() => runAction(s, 'reactivate')}
                      title="Reactivate"
                      className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => runAction(s, 'archive')}
                    title="Archive"
                    className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteStudent(s)}
                      title="Delete"
                      className="btn-secondary flex items-center gap-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
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
              onClick={handleGraduateAll}
              disabled={graduatingAll}
              className="btn-secondary flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-60"
            >
              {graduatingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )}
              Graduate All Final Year
            </button>
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
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="input sm:w-32"
              aria-label="Filter by level"
            >
              <option value="">All levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l} Level
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

      {/* Reset Password Modal */}
      {resetPasswordStudent && newTempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Password Reset Successful</h3>
              <button
                type="button"
                onClick={() => {
                  setResetPasswordStudent(null);
                  setNewTempPassword(null);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                A new temporary password has been generated for{' '}
                <strong>{resetPasswordStudent.firstName} {resetPasswordStudent.lastName}</strong>.
              </p>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="mb-1 text-xs font-medium text-purple-700">Temporary Password:</p>
                <p className="font-mono text-lg font-bold text-purple-900">{newTempPassword}</p>
              </div>
              <p className="text-sm text-gray-600">
                Please communicate this password to the student. They can change it after logging in.
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordStudent(null);
                    setNewTempPassword(null);
                  }}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Academic Record Modal */}
      {recordStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setRecordStudent(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student Academic Record</h2>
                <p className="text-xs text-gray-500">
                  {recordStudent.firstName} {recordStudent.lastName}
                  {recordStudent.matricNumber ? ` — ${recordStudent.matricNumber}` : ''}
                  {recordStudent.department?.name ? ` — ${recordStudent.department.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecordStudent(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {recordLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading record…
                </div>
              ) : (
                <>
                  {/* Results Section */}
                  <section className="mb-8">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Academic Results</h3>
                    {recordStudent.results && recordStudent.results.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2">Session</th>
                              <th className="px-3 py-2">Semester</th>
                              <th className="px-3 py-2">Code</th>
                              <th className="px-3 py-2">Title</th>
                              <th className="px-3 py-2 text-center">Units</th>
                              <th className="px-3 py-2 text-center">CA</th>
                              <th className="px-3 py-2 text-center">Exam</th>
                              <th className="px-3 py-2 text-center">Total</th>
                              <th className="px-3 py-2 text-center">Grade</th>
                              <th className="px-3 py-2 text-center">GP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {recordStudent.results.map((r: StudentResult) => (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.session?.name ?? '—'}</td>
                                <td className="px-3 py-2">{r.semester === 'FIRST' ? '1st' : r.semester === 'SECOND' ? '2nd' : r.semester}</td>
                                <td className="px-3 py-2 font-mono text-xs font-medium">{r.course?.code ?? '—'}</td>
                                <td className="px-3 py-2">{r.course?.title ?? '—'}</td>
                                <td className="px-3 py-2 text-center">{r.course?.creditUnits ?? '—'}</td>
                                <td className="px-3 py-2 text-center">{Number(r.caScore).toFixed(0)}</td>
                                <td className="px-3 py-2 text-center">{Number(r.examScore).toFixed(0)}</td>
                                <td className="px-3 py-2 text-center font-semibold">{Number(r.totalScore).toFixed(0)}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${
                                    r.grade === 'A' ? 'bg-green-100 text-green-700' :
                                    r.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                    r.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                    r.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                                    r.grade === 'F' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>{r.grade ?? '—'}</span>
                                </td>
                                <td className="px-3 py-2 text-center">{Number(r.gradePoint).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No results recorded yet.</p>
                    )}
                  </section>

                  {/* Payments Section */}
                  <section className="mb-8">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Payment History</h3>
                    {recordStudent.payments && recordStudent.payments.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Fee Type</th>
                              <th className="px-3 py-2">Reference</th>
                              <th className="px-3 py-2 text-right">Amount</th>
                              <th className="px-3 py-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {recordStudent.payments.map((p: StudentPayment) => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-3 py-2 text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="px-3 py-2">{p.feeStructure?.name ?? p.feeStructure?.type ?? '—'}</td>
                                <td className="px-3 py-2 font-mono text-xs text-gray-500">{p.reference}</td>
                                <td className="px-3 py-2 text-right font-semibold">₦{Number(p.amount).toLocaleString()}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                    p.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                    p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    p.status === 'REFUNDED' ? 'bg-gray-100 text-gray-600' :
                                    'bg-red-100 text-red-700'
                                  }`}>{p.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No payments recorded yet.</p>
                    )}
                  </section>

                  {/* Fee Breakdown */}
                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Fee Breakdown</h3>
                    {studentFees ? (() => {
                      const { items, summary } = studentFees;
                      const paidItems = items.filter((i) => i.status === 'PAID');
                      const unpaidItems = items.filter((i) => i.status === 'PENDING');
                      const { total, paid, outstanding } = summary;

                      return (
                        <>
                          {/* Summary Cards */}
                          <div className="mb-4 grid grid-cols-3 gap-4">
                            <div className="rounded-lg border border-gray-200 p-4 text-center">
                              <p className="text-xs text-gray-500">Total Expected</p>
                              <p className="mt-1 text-xl font-bold text-gray-900">₦{total.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                              <p className="text-xs text-green-600">Total Paid</p>
                              <p className="mt-1 text-xl font-bold text-green-700">₦{paid.toLocaleString()}</p>
                            </div>
                            <div className={`rounded-lg border p-4 text-center ${outstanding > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                              <p className={`text-xs ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{outstanding > 0 ? 'Outstanding' : 'Fully Paid'}</p>
                              <p className={`mt-1 text-xl font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>₦{Math.abs(outstanding).toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Paid Fees */}
                          {paidItems.length > 0 && (
                            <div className="mb-4">
                              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-700">
                                <CheckCircle2 className="h-4 w-4" /> Paid Fees
                              </h4>
                              <div className="overflow-x-auto rounded-lg border border-green-200">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-green-50 text-xs uppercase tracking-wide text-green-700">
                                    <tr>
                                      <th className="px-3 py-2">Fee Name</th>
                                      <th className="px-3 py-2">Session</th>
                                      <th className="px-3 py-2">Type</th>
                                      <th className="px-3 py-2 text-right">Amount</th>
                                      <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-green-100">
                                    {paidItems.map((item) => (
                                      <tr key={item.id} className="hover:bg-green-50">
                                        <td className="px-3 py-2 font-medium">{item.description}</td>
                                        <td className="px-3 py-2 text-xs text-gray-600">
                                          {item.sessionName ?? '—'}{item.semester ? ` — ${titleCase(item.semester)}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{item.type}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-green-700">₦{item.amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                            <CheckCircle2 className="h-3 w-3" /> Paid
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Unpaid Fees */}
                          {unpaidItems.length > 0 && (
                            <div>
                              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
                                <AlertCircle className="h-4 w-4" /> Unpaid Fees
                              </h4>
                              <div className="overflow-x-auto rounded-lg border border-red-200">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-red-50 text-xs uppercase tracking-wide text-red-700">
                                    <tr>
                                      <th className="px-3 py-2">Fee Name</th>
                                      <th className="px-3 py-2">Session</th>
                                      <th className="px-3 py-2">Type</th>
                                      <th className="px-3 py-2 text-right">Amount</th>
                                      <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-red-100">
                                    {unpaidItems.map((item) => (
                                      <tr key={item.id} className="hover:bg-red-50">
                                        <td className="px-3 py-2 font-medium">{item.description}</td>
                                        <td className="px-3 py-2 text-xs text-gray-600">
                                          {item.sessionName ?? '—'}{item.semester ? ` — ${titleCase(item.semester)}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{item.type}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-red-700">₦{item.amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                            <AlertCircle className="h-3 w-3" /> Unpaid
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {paidItems.length === 0 && unpaidItems.length === 0 && (
                            <p className="text-sm text-gray-400">No fees configured for this student.</p>
                          )}
                        </>
                      );
                    })() : (
                      <p className="text-sm text-gray-400">Loading fee breakdown…</p>
                    )}
                  </section>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setRecordStudent(null)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm dialog ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="pt-1.5 text-sm text-slate-700">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
