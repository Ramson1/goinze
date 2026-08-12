'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from '@/components/Toast';
import {
  academicsApi,
  type DepartmentFull,
  type Faculty,
  type Programme,
} from '@/lib/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentFull[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-department form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', facultyId: '', description: '' });

  // Edit department
  const [editingDept, setEditingDept] = useState<DepartmentFull | null>(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', facultyId: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Programmes management
  const [showProgrammeForm, setShowProgrammeForm] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [programmeForm, setProgrammeForm] = useState({ name: '', code: '', degreeType: '', durationYears: '4' });
  const [programmeSaving, setProgrammeSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'department' | 'programme'; data: DepartmentFull | Programme } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([academicsApi.departments(), academicsApi.faculties().catch(() => [] as Faculty[])])
      .then(([depts, facs]) => {
        setDepartments(depts);
        setFaculties(facs);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load departments.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitDepartment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await academicsApi.createDepartment({
        name: form.name.trim(),
        code: form.code.trim(),
        facultyId: form.facultyId || undefined,
        description: form.description.trim() || undefined,
      });
      toast.success(`Department "${form.name.trim()}" created.`);
      setForm({ name: '', code: '', facultyId: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create department.');
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(d: DepartmentFull) {
    setEditingDept(d);
    setEditForm({
      name: d.name,
      code: d.code,
      facultyId: d.facultyId ?? '',
      description: d.description ?? '',
    });
    setShowProgrammeForm(false);
    setEditingProgramme(null);
  }

  async function submitEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingDept) return;
    setEditSaving(true);
    try {
      await academicsApi.updateDepartment(editingDept.id, {
        name: editForm.name.trim(),
        code: editForm.code.trim(),
        facultyId: editForm.facultyId || undefined,
        description: editForm.description.trim() || undefined,
      });
      toast.success(`Department "${editForm.name.trim()}" updated.`);
      setEditingDept(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update department.');
    } finally {
      setEditSaving(false);
    }
  }

  function openProgrammeForm(p?: Programme) {
    if (p) {
      setEditingProgramme(p);
      setProgrammeForm({
        name: p.name,
        code: p.code,
        degreeType: p.degreeType ?? '',
        durationYears: String(p.durationYears),
      });
    } else {
      setEditingProgramme(null);
      setProgrammeForm({ name: '', code: '', degreeType: '', durationYears: '4' });
    }
    setShowProgrammeForm(true);
  }

  async function submitProgramme(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingDept) return;
    setProgrammeSaving(true);
    try {
      if (editingProgramme) {
        await academicsApi.updateProgramme(editingProgramme.id, {
          name: programmeForm.name.trim(),
          code: programmeForm.code.trim(),
          degreeType: programmeForm.degreeType.trim() || undefined,
          durationYears: Number(programmeForm.durationYears),
        });
        toast.success(`Programme "${programmeForm.name.trim()}" updated.`);
      } else {
        await academicsApi.createProgramme({
          departmentId: editingDept.id,
          name: programmeForm.name.trim(),
          code: programmeForm.code.trim(),
          degreeType: programmeForm.degreeType.trim() || undefined,
          durationYears: Number(programmeForm.durationYears),
        });
        toast.success(`Programme "${programmeForm.name.trim()}" created.`);
      }
      setShowProgrammeForm(false);
      setEditingProgramme(null);
      setProgrammeForm({ name: '', code: '', degreeType: '', durationYears: '4' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save programme.');
    } finally {
      setProgrammeSaving(false);
    }
  }

  function confirmDeleteItem(type: 'department' | 'programme', data: DepartmentFull | Programme) {
    setDeleteTarget({ type, data });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'department') {
        const dept = deleteTarget.data as DepartmentFull;
        await academicsApi.deleteDepartment(dept.id);
        toast.success(`Department "${dept.name}" deleted.`);
        setEditingDept(null);
      } else {
        const prog = deleteTarget.data as Programme;
        await academicsApi.deleteProgramme(prog.id);
        toast.success(`Programme "${prog.name}" deleted.`);
      }
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<DepartmentFull>[] = [
    {
      key: 'code',
      header: 'Code',
      className: 'font-mono text-xs font-semibold text-brand whitespace-nowrap',
    },
    {
      key: 'name',
      header: 'Department',
      render: (d) => <span className="font-medium text-gray-900">{d.name}</span>,
    },
    {
      key: 'faculty',
      header: 'Faculty',
      render: (d) => d.faculty?.name ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'programmes',
      header: 'Programmes',
      className: 'text-right whitespace-nowrap',
      render: (d) => d.programmes.length,
    },
    {
      key: 'description',
      header: 'Description',
      render: (d) =>
        d.description ? (
          <span className="line-clamp-1 text-gray-500">{d.description}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'whitespace-nowrap',
      render: (d) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openEditModal(d)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => confirmDeleteItem('department', d)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Academic departments, faculties and programmes."
        action={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add Department'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form
            onSubmit={submitDepartment}
            className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Computer Science"
                className="input"
              />
            </div>
            <div>
              <label className="label">Code</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
                placeholder="CSC"
                className="input"
              />
            </div>
            <div>
              <label className="label">Faculty</label>
              <select
                value={form.facultyId}
                onChange={(e) => setField('facultyId', e.target.value)}
                className="input"
              >
                <option value="">— None —</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Department
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading departments…
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={departments}
            keyField="id"
            emptyMessage="No departments yet. Add your first department above."
          />
        )}
      </Card>

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Department</h3>
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitEdit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Code</label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Faculty</label>
                  <select
                    value={editForm.facultyId}
                    onChange={(e) => setEditForm({ ...editForm, facultyId: e.target.value })}
                    className="input"
                  >
                    <option value="">— None —</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-60"
                >
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </form>

            {/* Programmes Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">Programmes</h4>
                <button
                  type="button"
                  onClick={() => openProgrammeForm()}
                  className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Programme
                </button>
              </div>

              {showProgrammeForm && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <form onSubmit={submitProgramme} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Name</label>
                        <input
                          type="text"
                          required
                          value={programmeForm.name}
                          onChange={(e) => setProgrammeForm({ ...programmeForm, name: e.target.value })}
                          placeholder="e.g., General Laboratory Technology"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Code</label>
                        <input
                          type="text"
                          required
                          value={programmeForm.code}
                          onChange={(e) => setProgrammeForm({ ...programmeForm, code: e.target.value })}
                          placeholder="e.g., GLT"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Degree Type</label>
                        <input
                          type="text"
                          value={programmeForm.degreeType}
                          onChange={(e) => setProgrammeForm({ ...programmeForm, degreeType: e.target.value })}
                          placeholder="e.g., HND, BSc"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Duration (Years)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={programmeForm.durationYears}
                          onChange={(e) => setProgrammeForm({ ...programmeForm, durationYears: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProgrammeForm(false);
                          setEditingProgramme(null);
                        }}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={programmeSaving}
                        className="btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-60"
                      >
                        {programmeSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        {editingProgramme ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {editingDept.programmes.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  No programmes yet. Add your first programme above.
                </p>
              ) : (
                <div className="space-y-2">
                  {editingDept.programmes.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-brand">{p.code}</span>
                          <span className="font-medium text-gray-900">{p.name}</span>
                          {p.degreeType && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {p.degreeType}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Duration: {p.durationYears} years</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openProgrammeForm(p)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDeleteItem('programme', p)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'department' ? 'Department' : 'Programme'}`}
        message={`Are you sure you want to delete "${deleteTarget?.data?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
