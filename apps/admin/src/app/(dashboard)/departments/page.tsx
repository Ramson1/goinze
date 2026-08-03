'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import {
  academicsApi,
  type DepartmentFull,
  type Faculty,
} from '@/lib/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentFull[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add-department form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', facultyId: '', description: '' });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([academicsApi.departments(), academicsApi.faculties().catch(() => [] as Faculty[])])
      .then(([depts, facs]) => {
        setDepartments(depts);
        setFaculties(facs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load departments.'))
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
    setError(null);
    setNotice(null);
    try {
      await academicsApi.createDepartment({
        name: form.name.trim(),
        code: form.code.trim(),
        facultyId: form.facultyId || undefined,
        description: form.description.trim() || undefined,
      });
      setNotice(`Department "${form.name.trim()}" created.`);
      setForm({ name: '', code: '', facultyId: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create department.');
    } finally {
      setSaving(false);
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
    </>
  );
}
