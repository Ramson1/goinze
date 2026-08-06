'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  Loader2,
  Search,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import { securityApi, type AuditLogRecord, type Paginated } from '@/lib/api';

const PAGE_SIZE = 20;

function formatWhen(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Build a human-readable summary from audit log metadata. */
function formatMetadataSummary(action: string, metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, any>;

  // Profile changes with old/new values
  if (m.changes && typeof m.changes === 'object') {
    const fields = Object.keys(m.changes);
    if (fields.length > 0) {
      return fields.map((f) => {
        const c = m.changes[f];
        if (c && typeof c === 'object' && 'old' in c) {
          return `${f}: "${c.old}" → "${c.new}"`;
        }
        return f;
      }).join(', ');
    }
  }

  // Changed fields array
  if (Array.isArray(m.changedFields)) {
    return `Changed: ${m.changedFields.join(', ')}`;
  }

  // Keys array (bulk settings update)
  if (Array.isArray(m.keys)) {
    return `Keys: ${m.keys.join(', ')}`;
  }

  // CMS content key
  if (m.key) {
    return m.title ? `${m.key}${m.title ? ` — "${m.title}"` : ''}` : m.key;
  }

  // News/event created with title
  if (m.title) {
    return `"${m.title}"${m.category ? ` (${m.category})` : ''}`;
  }

  // Login failed reason
  if (m.reason) {
    return m.email ? `${m.email} — ${m.reason}` : m.reason;
  }

  // Email on login
  if (m.email) {
    return m.email;
  }

  // Caption/album for gallery
  if (m.caption || m.album) {
    return [m.caption, m.album ? `album: ${m.album}` : ''].filter(Boolean).join(', ');
  }

  return null;
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogsPage() {
  const [data, setData] = useState<Paginated<AuditLogRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce the search input.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await securityApi.auditLogs({
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load audit logs.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch]);

  const columns: Column<AuditLogRecord>[] = [
    {
      key: 'actor',
      header: 'Actor',
      render: (r) => (
        <span className="font-medium text-gray-900">{r.user?.email ?? 'System'}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
          {r.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (r) =>
        r.entity ? (
          <span className="font-mono text-xs text-gray-500">
            {r.entity}
            {r.entityId && <span className="text-gray-300"> · {r.entityId.slice(0, 8)}…</span>}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: 'details',
      header: 'Change Details',
      render: (r) => {
        const summary = formatMetadataSummary(r.action, r.metadata);
        if (!summary) return <span className="text-xs text-gray-300">—</span>;
        return (
          <span className="max-w-xs truncate text-xs text-gray-600" title={summary}>
            {summary}
          </span>
        );
      },
    },
    {
      key: 'ip',
      header: 'IP Address',
      className: 'font-mono text-xs',
      render: (r) => r.ipAddress ?? '—',
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      className: 'whitespace-nowrap',
      render: (r) => formatWhen(r.createdAt) ?? '—',
    },
    {
      key: 'expand',
      header: '',
      className: 'w-10',
      render: (r) => (
        <button
          type="button"
          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="View full metadata"
        >
          {expandedId === r.id ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      ),
    },
  ];

  const rows = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  function handleExport() {
    downloadCsv(
      `audit-logs-page-${page}.csv`,
      ['Actor', 'Action', 'Entity', 'Entity ID', 'Change Details', 'IP Address', 'Timestamp'],
      rows.map((r) => [
        r.user?.email ?? 'System',
        r.action,
        r.entity ?? '',
        r.entityId ?? '',
        formatMetadataSummary(r.action, r.metadata) ?? '',
        r.ipAddress ?? '',
        formatWhen(r.createdAt) ?? '',
      ]),
    );
  }

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="A tamper-evident trail of administrative actions."
        action={
          <button
            type="button"
            onClick={handleExport}
            disabled={rows.length === 0}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export Page
          </button>
        }
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action or entity…"
          className="input pl-9"
        />
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading audit logs…
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              keyField="id"
              emptyMessage="No audit log entries yet. Sign-ins and password changes are recorded automatically."
            />

            {/* Expanded metadata panel */}
            {expandedId && (() => {
              const record = rows.find((r) => r.id === expandedId);
              if (!record) return null;
              return (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Full Metadata
                    </span>
                  </div>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100">
                    {record.metadata
                      ? JSON.stringify(record.metadata, null, 2)
                      : '(no metadata recorded)'}
                  </pre>
                </div>
              );
            })()}

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
              <p className="text-xs text-gray-500">
                {data ? `${data.total} entr${data.total === 1 ? 'y' : 'ies'} recorded` : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
