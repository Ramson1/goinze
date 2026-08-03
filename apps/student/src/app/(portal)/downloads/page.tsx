'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileType2, FolderDown, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { documentsApi, type DocumentRecord } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

function iconFor(doc: DocumentRecord) {
  const mime = (doc.mimeType ?? '').toLowerCase();
  const name = doc.name.toLowerCase();
  if (mime.includes('spreadsheet') || mime.includes('excel') || /\.(xlsx|xls|csv)$/.test(name)) {
    return { icon: FileSpreadsheet, cls: 'bg-green-50 text-green-600' };
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    /\.(docx|doc)$/.test(name)
  ) {
    return { icon: FileType2, cls: 'bg-indigo-50 text-indigo-600' };
  }
  return { icon: FileText, cls: 'bg-rose-50 text-rose-600' };
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function DownloadsPage() {
  const { profile } = useStudent();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    if (!profile?.id) return;
    documentsApi
      .mine(profile.id)
      .then(setDocs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load documents.'))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const categories = ['All', ...Array.from(new Set(docs.map((d) => d.type)))];
  const list = docs.filter((d) => category === 'All' || d.type === category);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Downloads"
        description="Official documents attached to your student record."
      />

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
        </Card>
      )}

      {!loading && error && (
        <Card className="p-10 text-center">
          <FolderDown className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Category filter */}
          <div className="mb-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition',
                  category === c
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {c === 'All' ? 'All' : titleCase(c)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {list.map((d) => {
              const cfg = iconFor(d);
              const Icon = cfg.icon;
              return (
                <Card key={d.id} hover className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', cfg.cls)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{d.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {titleCase(d.type)} · {formatSize(d.sizeBytes)} ·{' '}
                          {new Date(d.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary shrink-0 px-3 py-2 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                </Card>
              );
            })}

            {list.length === 0 && (
              <Card className="p-10 text-center">
                <FolderDown className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">No documents here yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Documents such as your admission letter and transcript will appear here once issued.
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
