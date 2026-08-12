'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Globe,
  Loader2,
  Lock,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import {
  resultsApi,
  type AdminResultRow,
  type CourseResultSummary,
} from '@/lib/api';
import { cn } from '@/lib/utils';

function gradeClass(grade: string | null): string {
  switch (grade) {
    case 'A': return 'bg-emerald-100 text-emerald-700';
    case 'B': return 'bg-blue-100 text-blue-700';
    case 'C': return 'bg-sky-100 text-sky-700';
    case 'D': return 'bg-amber-100 text-amber-700';
    case 'E': return 'bg-orange-100 text-orange-700';
    default: return 'bg-rose-100 text-rose-700';
  }
}

function computeGrade(score: number) {
  if (score >= 70) return { grade: 'A', point: 5 };
  if (score >= 60) return { grade: 'B', point: 4 };
  if (score >= 50) return { grade: 'C', point: 3 };
  if (score >= 45) return { grade: 'D', point: 2 };
  if (score >= 40) return { grade: 'E', point: 1 };
  return { grade: 'F', point: 0 };
}

function StatusBreakdown({ c }: { c: CourseResultSummary }) {
  const segments = [
    { key: 'draft', n: c.draft, cls: 'bg-gray-300' },
    { key: 'submitted', n: c.submitted, cls: 'bg-amber-400' },
    { key: 'approved', n: c.approved, cls: 'bg-blue-400' },
    { key: 'locked', n: c.locked, cls: 'bg-indigo-400' },
    { key: 'published', n: c.published, cls: 'bg-emerald-500' },
  ];
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {segments.map((s) => s.n > 0 && (
          <div key={s.key} className={s.cls} style={{ width: `${(s.n / Math.max(1, c.total)) * 100}%` }} />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
        <span>{c.total} total</span>
        {c.draft > 0 && <span>{c.draft} draft</span>}
        {c.submitted > 0 && <span className="text-amber-600">{c.submitted} submitted</span>}
        {c.approved > 0 && <span className="text-blue-600">{c.approved} approved</span>}
        {c.locked > 0 && <span className="text-indigo-600">{c.locked} locked</span>}
        {c.published > 0 && <span className="text-emerald-600">{c.published} published</span>}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [courses, setCourses] = useState<CourseResultSummary[]>([]);
  const [session, setSession] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminResultRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Selection & editing state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<AdminResultRow | null>(null);
  const [editCa, setEditCa] = useState('');
  const [editExam, setEditExam] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadSummaries = useCallback(async (keepSelection = true) => {
    setError(null);
    try {
      const data = await resultsApi.courseSummaries();
      setCourses(data.courses);
      setSession(data.session);
      if (!keepSelection || !selectedId) {
        const first = data.courses[0]?.courseId ?? null;
        setSelectedId(first);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results.');
    } finally {
      setLoadingList(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const loadRows = useCallback((courseId: string) => {
    setLoadingRows(true);
    setError(null);
    setSelectedRows(new Set());
    resultsApi
      .courseResults(courseId)
      .then((data) => setRows(data.rows))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load course results.'))
      .finally(() => setLoadingRows(false));
  }, []);

  useEffect(() => { loadSummaries(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedId) loadRows(selectedId); }, [selectedId, loadRows]);

  const selected = courses.find((c) => c.courseId === selectedId) ?? null;

  async function run(action: 'approve' | 'lock' | 'publish') {
    if (!selectedId) return;
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      const res = action === 'approve'
        ? await resultsApi.approveCourse(selectedId)
        : action === 'lock'
          ? await resultsApi.lockCourse(selectedId)
          : await resultsApi.publishCourse(selectedId);
      const verb = action === 'approve' ? 'Approved' : action === 'lock' ? 'Locked' : 'Published';
      setNotice(`${verb} ${res.updated} result(s).`);
      await loadSummaries(true);
      loadRows(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  }

  async function approveSelected() {
    if (selectedRows.size === 0) return;
    setBusy('approve-selected');
    setError(null);
    setNotice(null);
    try {
      let count = 0;
      for (const id of selectedRows) {
        const row = rows.find((r) => r.id === id);
        if (row && row.status === 'SUBMITTED') {
          await resultsApi.approveResult(id);
          count++;
        }
      }
      setNotice(`Approved ${count} result(s).`);
      await loadSummaries(true);
      if (selectedId) loadRows(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  }

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((r) => r.id)));
    }
  }

  function openEdit(row: AdminResultRow) {
    setEditingRow(row);
    setEditCa(String(row.caScore));
    setEditExam(String(row.examScore));
  }

  async function saveEdit() {
    if (!editingRow) return;
    setSavingEdit(true);
    setError(null);
    try {
      await resultsApi.updateScore(editingRow.id, {
        caScore: Number(editCa),
        examScore: Number(editExam),
      });
      setNotice(`Updated scores for ${editingRow.studentName}.`);
      setEditingRow(null);
      await loadSummaries(true);
      if (selectedId) loadRows(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scores.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function approveSingle(id: string) {
    setBusy(`approve-${id}`);
    try {
      await resultsApi.approveResult(id);
      setNotice('Result approved.');
      await loadSummaries(true);
      if (selectedId) loadRows(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve.');
    } finally {
      setBusy(null);
    }
  }

  async function lockSingle(id: string) {
    setBusy(`lock-${id}`);
    try {
      await resultsApi.lockResult(id);
      setNotice('Result locked.');
      await loadSummaries(true);
      if (selectedId) loadRows(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock.');
    } finally {
      setBusy(null);
    }
  }

  const editPreview = editingRow ? (() => {
    const total = Math.max(0, Math.min(100, Number(editCa) + Number(editExam)));
    const g = computeGrade(total);
    return { total, ...g };
  })() : null;

  return (
    <>
      <PageHeader
        title="Results Approval"
        subtitle={session
          ? `Review, approve, lock and publish course results · ${session}`
          : 'Review, approve, lock and publish course results.'}
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

      {/* Course selector dropdown */}
      {courses.length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="label">Select Course</label>
              <select
                value={selectedId ?? ''}
                onChange={(e) => setSelectedId(e.target.value || null)}
                className="input"
              >
                {courses.map((c) => (
                  <option key={`${c.courseId}:${c.semester}`} value={c.courseId}>
                    {c.code} — {c.title} ({c.level}L, {c.semester} Sem)
                  </option>
                ))}
              </select>
            </div>
            {selected && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span><span className="font-semibold text-gray-900">{selected.total}</span> results</span>
                <span>·</span>
                <span><span className="font-semibold text-amber-600">{selected.submitted}</span> pending</span>
                <span>·</span>
                <span><span className="font-semibold text-emerald-600">{selected.published}</span> published</span>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Course list sidebar */}
        <Card title="All Courses" subtitle="Click to review">
          {loadingList ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : courses.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No results have been entered yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {courses.map((c) => {
                const active = c.courseId === selectedId;
                return (
                  <li key={`${c.courseId}:${c.semester}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.courseId)}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3 text-left transition-colors',
                        active ? 'bg-brand/5' : 'hover:bg-gray-50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">{c.code}</span>
                          <span className="text-xs text-gray-400">{c.level}L · {c.semester}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-gray-900">{c.title}</p>
                        <div className="mt-1.5"><StatusBreakdown c={c} /></div>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 shrink-0', active ? 'text-brand' : 'text-gray-300')} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Detail */}
        <div className="lg:col-span-2">
          <Card
            title={selected ? `${selected.code} — ${selected.title}` : 'Course results'}
            subtitle={selected
              ? `${selected.level} Level · ${selected.semester} Semester${selected.department ? ` · ${selected.department}` : ''}`
              : 'Select a course to see its results.'}
            action={selected && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedRows.size > 0 && (
                  <button
                    type="button"
                    onClick={approveSelected}
                    disabled={busy !== null}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    {busy === 'approve-selected' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    Approve {selectedRows.size}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => run('approve')}
                  disabled={busy !== null || selected.submitted === 0}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  title="Approve all submitted results"
                >
                  {busy === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Approve All
                </button>
                <button
                  type="button"
                  onClick={() => run('lock')}
                  disabled={busy !== null || selected.approved === 0}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  title="Lock all approved results"
                >
                  {busy === 'lock' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  Lock
                </button>
                <button
                  type="button"
                  onClick={() => run('publish')}
                  disabled={busy !== null || selected.approved + selected.locked === 0}
                  className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                  title="Publish approved/locked results to students"
                >
                  {busy === 'publish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                  Publish
                </button>
              </div>
            )}
          >
            {loadingRows ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading results…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && selectedRows.size === rows.length}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">CA</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Exam</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Grade</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                          No results entered for this course yet.
                        </td>
                      </tr>
                    ) : rows.map((r) => (
                      <tr key={r.id} className={cn('transition hover:bg-gray-50', selectedRows.has(r.id) && 'bg-blue-50/50')}>
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(r.id)}
                            onChange={() => toggleRow(r.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">{r.studentName || '—'}</p>
                          <p className="font-mono text-xs text-gray-400">{r.matricNo ?? '—'}</p>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-600">{r.caScore}</td>
                        <td className="px-3 py-3 text-right text-gray-600">{r.examScore}</td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-900">{r.totalScore}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold', gradeClass(r.grade))}>
                            {r.grade ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center"><StatusBadge status={r.status} /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Edit scores"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {r.status === 'SUBMITTED' && (
                              <button
                                type="button"
                                onClick={() => approveSingle(r.id)}
                                disabled={busy !== null}
                                className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                                title="Approve"
                              >
                                {busy === `approve-${r.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            {r.status === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => lockSingle(r.id)}
                                disabled={busy !== null}
                                className="rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                                title="Lock"
                              >
                                {busy === `lock-${r.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                              </button>
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
        </div>
      </div>

      {/* Edit Score Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Scores</h3>
              <button type="button" onClick={() => setEditingRow(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600">{editingRow.studentName} — {editingRow.matricNo ?? 'N/A'}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">CA Score</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editCa}
                  onChange={(e) => setEditCa(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Exam Score</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editExam}
                  onChange={(e) => setEditExam(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            {editPreview && (
              <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 p-3 text-sm">
                <span>Total: <strong>{editPreview.total}</strong></span>
                <span>Grade: <strong className={cn('inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold', gradeClass(editPreview.grade))}>{editPreview.grade}</strong></span>
                <span>Point: <strong>{editPreview.point}</strong></span>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingRow(null)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-60"
              >
                {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
