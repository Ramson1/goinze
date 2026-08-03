'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CheckCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { currentAcademicSession } from '@goinze/shared-utils';
import { sessionsApi, type AcademicSessionRecord } from '@/lib/api';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Derive a display status from isCurrent and the session date range. */
function sessionStatus(s: AcademicSessionRecord): string {
  if (s.isCurrent) return 'In Session';
  const now = Date.now();
  if (s.endDate && new Date(s.endDate).getTime() < now) return 'Completed';
  if (s.startDate && new Date(s.startDate).getTime() > now) return 'Scheduled';
  return 'Past';
}

export default function AcademicSessionPage() {
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // New-session form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    sessionsApi
      .list()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load sessions.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function activate(s: AcademicSessionRecord) {
    if (!window.confirm(`Set ${s.name} as the current session?`)) return;
    setActivatingId(s.id);
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.activate(s.id);
      setNotice(`${s.name} is now the current session.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not activate session.');
    } finally {
      setActivatingId(null);
    }
  }

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.create({
        name: form.name.trim(),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isCurrent: form.isCurrent,
      });
      setNotice(`Session ${form.name.trim()} created.`);
      setForm({ name: '', startDate: '', endDate: '', isCurrent: false });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create session.');
    } finally {
      setSaving(false);
    }
  }

  const current = sessions.find((s) => s.isCurrent);

  const columns: Column<AcademicSessionRecord>[] = [
    {
      key: 'name',
      header: 'Session',
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-gray-900">{s.name}</span>
      ),
    },
    {
      key: 'startDate',
      header: 'Starts',
      className: 'whitespace-nowrap',
      render: (s) => formatDate(s.startDate),
    },
    {
      key: 'endDate',
      header: 'Ends',
      className: 'whitespace-nowrap',
      render: (s) => formatDate(s.endDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={sessionStatus(s)} />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (s) =>
        s.isCurrent ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" /> Current
          </span>
        ) : activatingId === s.id ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <button
            type="button"
            onClick={() => activate(s)}
            className="btn-secondary px-2.5 py-1.5 text-xs"
          >
            Set Current
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Academic Session"
        subtitle="Configure sessions and the academic calendar."
        action={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'New Session'}
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

      {current && (
        <Card className="mb-6 border-brand/30 bg-gradient-to-r from-brand to-brand-dark p-5 text-white">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <CalendarDays className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-blue-100">Current Session</p>
              <p className="text-lg font-bold">{current.name}</p>
              <p className="text-sm text-blue-100/80">
                {formatDate(current.startDate)} → {formatDate(current.endDate)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6">
          <form
            onSubmit={submitSession}
            className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="label">Session</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder={currentAcademicSession()}
                className="input"
              />
            </div>
            <div>
              <label className="label">Starts</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Ends</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isCurrent"
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) => setField('isCurrent', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">
                Set as current session
              </label>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Session
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="All Sessions" subtitle="Past, current and scheduled sessions">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading sessions…
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={sessions}
            keyField="id"
            emptyMessage="No sessions yet. Create your first session above."
          />
        )}
      </Card>
    </>
  );
}
