'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  GraduationCap,
  Info,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import {
  financeApi,
  academicsApi,
  type FeeStructure,
  type DepartmentFull,
  type FeePolicySummary,
} from '@/lib/api';
import { cn } from '@/lib/utils';

/* ── Helpers ── */
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

const FEE_TYPES = ['SCHOOL', 'ACCEPTANCE', 'APPLICATION_FORM', 'ENTRANCE_EXAM', 'PORTAL_ACCESS', 'SPORTS_WEAR', 'MATRICULATION', 'MEDICAL', 'HOSTEL', 'LIBRARY', 'GRADUATION', 'OTHER'];
const LEVELS = [100, 200, 300];
const SEMESTERS = ['FIRST', 'SECOND', 'THIRD'];

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FeeStructuresPage() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePolicy, setFeePolicy] = useState<FeePolicySummary | null>(null);
  const [departments, setDepartments] = useState<DepartmentFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check user role on mount
  useEffect(() => {
    const token = getCookie('access_token');
    const role = token ? decodeRoleFromToken(token) : null;
    setIsSuperAdmin(role === 'SUPER_ADMIN');
  }, []);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeType, setFeeType] = useState('SCHOOL');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeLevel, setFeeLevel] = useState('');
  const [feeSemester, setFeeSemester] = useState('');
  const [feeDept, setFeeDept] = useState('');
  const [feeMandatory, setFeeMandatory] = useState(true);
  const [savingFee, setSavingFee] = useState(false);

  // Edit modal
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [editFeeName, setEditFeeName] = useState('');
  const [editFeeType, setEditFeeType] = useState('SCHOOL');
  const [editFeeAmount, setEditFeeAmount] = useState('');
  const [editFeeLevel, setEditFeeLevel] = useState('');
  const [editFeeSemester, setEditFeeSemester] = useState('');
  const [editFeeDept, setEditFeeDept] = useState('');
  const [editFeeMandatory, setEditFeeMandatory] = useState(true);
  const [editSavingFee, setEditSavingFee] = useState(false);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);

  const loadFeeStructures = useCallback(() => {
    setLoading(true);
    setError(null);
    financeApi
      .feeStructures()
      .then(setFeeStructures)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load fee structures.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadFeeStructures();
    academicsApi.departments().then(setDepartments).catch(() => setDepartments([]));
    financeApi.feePolicy().then(setFeePolicy).catch(() => setFeePolicy(null));
  }, [loadFeeStructures]);

  async function submitFeeStructure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingFee(true);
    setError(null);
    setNotice(null);
    try {
      await financeApi.createFeeStructure({
        name: feeName.trim(),
        amount: Number(feeAmount),
        type: feeType,
        level: feeLevel ? Number(feeLevel) : undefined,
        semester: feeSemester || undefined,
        departmentId: feeDept || undefined,
        isMandatory: feeMandatory,
      });
      setNotice(`Fee structure "${feeName.trim()}" created.`);
      setFeeName('');
      setFeeAmount('');
      setFeeLevel('');
      setFeeSemester('');
      setFeeDept('');
      setFeeType('SCHOOL');
      setFeeMandatory(true);
      setShowForm(false);
      loadFeeStructures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create fee structure.');
    } finally {
      setSavingFee(false);
    }
  }

  function openEditFeeModal(f: FeeStructure) {
    setEditingFee(f);
    setEditFeeName(f.name);
    setEditFeeType(f.type);
    setEditFeeAmount(String(f.amount));
    setEditFeeLevel(f.level ? String(f.level) : '');
    setEditFeeSemester(f.semester ?? '');
    setEditFeeDept(f.departmentId ?? '');
    setEditFeeMandatory(f.isMandatory);
  }

  async function submitEditFee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingFee) return;
    setEditSavingFee(true);
    setError(null);
    setNotice(null);
    try {
      await financeApi.updateFeeStructure(editingFee.id, {
        name: editFeeName.trim(),
        amount: Number(editFeeAmount),
        type: editFeeType,
        level: editFeeLevel ? Number(editFeeLevel) : undefined,
        semester: editFeeSemester || undefined,
        departmentId: editFeeDept || undefined,
        isMandatory: editFeeMandatory,
      });
      setNotice(`Fee structure "${editFeeName.trim()}" updated.`);
      setEditingFee(null);
      loadFeeStructures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update fee structure.');
    } finally {
      setEditSavingFee(false);
    }
  }

  async function deleteFeeStructure(f: FeeStructure) {
    if (!window.confirm(`Delete fee structure "${f.name}"? This cannot be undone.`)) return;
    setDeletingFeeId(f.id);
    setError(null);
    setNotice(null);
    try {
      await financeApi.deleteFeeStructure(f.id);
      setNotice(`Fee structure "${f.name}" deleted.`);
      loadFeeStructures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete fee structure.');
    } finally {
      setDeletingFeeId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Fee Structures"
        subtitle="Manage tuition fees, acceptance fees, and other charges."
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

      <Card
        title="Fee Policy Overview"
        subtitle={`What new and returning students pay${feePolicy?.sessionName ? ` — ${feePolicy.sessionName} session` : ''}`}
      >
        {!feePolicy ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading fee policy…
          </div>
        ) : (
          <>
            {!feePolicy.portalConfigured && (
              <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  No Portal Access fee is configured yet, so the totals below exclude it. Add one under
                  {' '}“All Fee Structures” to include it.
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-3">
              {/* New (entering) students */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">New Students</h3>
                    <p className="text-xs text-gray-500">{feePolicy.entering.level} Level (entering)</p>
                  </div>
                </div>
                {feePolicy.entering.configured ? (
                  <>
                    <ul className="space-y-1.5">
                      {feePolicy.entering.items.map((it, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-gray-600">
                            {it.name}
                            {!it.isMandatory && <span className="ml-1 text-gray-400">(optional)</span>}
                          </span>
                          <span className="shrink-0 font-medium text-gray-900">{formatNaira(it.amount)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="font-bold text-gray-900">{formatNaira(feePolicy.entering.total)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">
                    No entering-student fees configured yet. Add fee structures at level 100 (or “All
                    Levels”) to populate this list.
                  </p>
                )}
              </div>

              {/* Returning students */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Users className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Returning Students</h3>
                    <p className="text-xs text-gray-500">{feePolicy.returning.minLevel} Level & above</p>
                  </div>
                </div>
                <p className="mb-2 text-xs text-gray-500">Portal Access + department tuition only.</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-400">
                        <th className="pb-1 font-medium">Department</th>
                        <th className="pb-1 text-right font-medium">Tuition</th>
                        <th className="pb-1 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {feePolicy.returning.departments.map((d) => (
                        <tr key={d.code}>
                          <td className="py-1.5">
                            <span className="font-medium text-gray-800">{d.code}</span>
                            <span className="ml-1 text-gray-400">{d.name}</span>
                          </td>
                          <td className="py-1.5 text-right text-gray-700">{formatNaira(d.tuition)}</td>
                          <td className="py-1.5 text-right font-semibold text-gray-900">{formatNaira(d.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {feePolicy.returning.portalAccess && (
                  <p className="mt-2 text-[11px] text-gray-400">
                    Total includes Portal Access {formatNaira(feePolicy.returning.portalAccess.amount)}.
                  </p>
                )}
              </div>

              {/* Scholarship students */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Award className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Scholarship Students</h3>
                    <p className="text-xs text-gray-500">Any level · any department</p>
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">Tuition (flat)</span>
                    <span className="font-medium text-gray-900">{formatNaira(feePolicy.scholarship.tuitionAmount)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">Portal Access</span>
                    <span className="font-medium text-gray-900">
                      {feePolicy.scholarship.portalAccess
                        ? formatNaira(feePolicy.scholarship.portalAccess.amount)
                        : '—'}
                    </span>
                  </li>
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-emerald-200/70 pt-2 text-sm">
                  <span className="font-semibold text-emerald-800">Total</span>
                  <span className="font-bold text-emerald-900">{formatNaira(feePolicy.scholarship.total)}</span>
                </div>
                <p className="mt-2 text-[11px] text-emerald-700/80">
                  Portal access is not waived for scholarship students.
                </p>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card
        title="All Fee Structures"
        subtitle="Configure fees for different programmes and departments"
        action={
          isSuperAdmin ? (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> {showForm ? 'Close' : 'Add Fee'}
            </button>
          ) : undefined
        }
      >
        {showForm && (
          <form
            onSubmit={submitFeeStructure}
            className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div className="lg:col-span-2">
              <label className="label">Name</label>
              <input
                type="text"
                required
                value={feeName}
                onChange={(e) => setFeeName(e.target.value)}
                placeholder="e.g. 100 Level Tuition"
                className="input"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={feeType} onChange={(e) => setFeeType(e.target.value)} className="input">
                {FEE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {titleCase(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount (₦)</label>
              <input
                type="number"
                required
                min={0}
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="250000"
                className="input"
              />
            </div>
            <div>
              <label className="label">Level (optional)</label>
              <select value={feeLevel} onChange={(e) => setFeeLevel(e.target.value)} className="input">
                <option value="">All Levels</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l} Level</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Semester (optional)</label>
              <select value={feeSemester} onChange={(e) => setFeeSemester(e.target.value)} className="input">
                <option value="">All Semesters</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{titleCase(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department (optional)</label>
              <select value={feeDept} onChange={(e) => setFeeDept(e.target.value)} className="input">
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-6">
              <label className="mr-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={feeMandatory}
                  onChange={(e) => setFeeMandatory(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-gray-700">Mandatory</span>
              </label>
              <button type="submit" disabled={savingFee} className="btn-primary disabled:opacity-60">
                {savingFee ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Fee Structure
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading fee structures…
          </div>
        ) : feeStructures.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            No fee structures configured yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Type', 'Amount', 'Level', 'Semester', 'Department', 'Mandatory', 'Installment', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feeStructures.map((f) => (
                  <tr key={f.id} className="odd:bg-white even:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                        {titleCase(f.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {formatNaira(Number(f.amount))}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{f.level ? `${f.level} Level` : 'All'}</td>
                    <td className="px-5 py-3 text-gray-600">{f.semester ? titleCase(f.semester) : 'All'}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {f.departmentId
                        ? departments.find((d) => d.id === f.departmentId)?.name ?? '—'
                        : 'All'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          f.isMandatory ? 'text-emerald-600' : 'text-gray-400',
                        )}
                      >
                        {f.isMandatory ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          f.allowInstallment ? 'text-emerald-600' : 'text-gray-400',
                        )}
                      >
                        {f.allowInstallment ? 'Allowed' : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {isSuperAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditFeeModal(f)}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFeeStructure(f)}
                              disabled={deletingFeeId === f.id}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingFeeId === f.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Fee Structure Modal */}
      {editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Fee Structure</h3>
              <button
                type="button"
                onClick={() => setEditingFee(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitEditFee} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Name</label>
                  <input
                    type="text"
                    required
                    value={editFeeName}
                    onChange={(e) => setEditFeeName(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={editFeeType} onChange={(e) => setEditFeeType(e.target.value)} className="input">
                    {FEE_TYPES.map((t) => (
                      <option key={t} value={t}>{titleCase(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editFeeAmount}
                    onChange={(e) => setEditFeeAmount(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Level (optional)</label>
                  <select value={editFeeLevel} onChange={(e) => setEditFeeLevel(e.target.value)} className="input">
                    <option value="">All Levels</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l} Level</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Semester (optional)</label>
                  <select value={editFeeSemester} onChange={(e) => setEditFeeSemester(e.target.value)} className="input">
                    <option value="">All Semesters</option>
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Department (optional)</label>
                  <select value={editFeeDept} onChange={(e) => setEditFeeDept(e.target.value)} className="input">
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editFeeMandatory}
                      onChange={(e) => setEditFeeMandatory(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-gray-700">Mandatory fee</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFee(null)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSavingFee}
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-60"
                >
                  {editSavingFee ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
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
