'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { newsApi, cmsApi, type NewsRecord } from '@/lib/api';

function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts(await newsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      let finalCoverUrl = coverUrl.trim();

      // Upload cover image if a file was selected
      if (coverFile) {
        setUploading(true);
        const result = await cmsApi.uploadMedia(coverFile);
        finalCoverUrl = result.url;
        setUploading(false);
      }

      await newsApi.create({
        title: title.trim(),
        body: body.trim(),
        category: category.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        coverUrl: finalCoverUrl || undefined,
        published,
      });
      setFormOpen(false);
      setTitle('');
      setCategory('');
      setExcerpt('');
      setBody('');
      setPublished(true);
      setCoverFile(null);
      setCoverUrl('');
      await load();
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Failed to create article');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(post: NewsRecord) {
    setBusyId(post.id);
    setError(null);
    try {
      await newsApi.setPublished(post.id, !post.published);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article');
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<NewsRecord>[] = [
    {
      key: 'title',
      header: 'Headline',
      render: (r) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900">{r.title}</p>
          {r.excerpt && <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{r.excerpt}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) =>
        r.category ? (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {r.category}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'publishedAt',
      header: 'Published',
      className: 'whitespace-nowrap',
      render: (r) => formatDate(r.publishedAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.published ? 'Published' : 'Draft'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          disabled={busyId === r.id}
          onClick={() => togglePublished(r)}
          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {r.published ? 'Unpublish' : 'Publish'}
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="News"
        subtitle="Publish news and announcements to the public website."
        action={
          <button type="button" onClick={() => setFormOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> New Article
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">Loading news…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={posts}
            keyField="id"
            emptyMessage="No news articles yet."
          />
        )}
      </Card>

      {/* New article modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">New Article</h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Headline</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Goinze International School wins national innovation award"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Category (optional)</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Campus, Research, Sports"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Excerpt (optional)</label>
                <input
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short summary shown in listings…"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Body</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Write the full article…"
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="label">Cover Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {coverFile ? coverFile.name : 'Select an image to upload as the cover photo.'}
                </p>
                {uploading && (
                  <p className="mt-1 text-xs text-brand">Uploading cover image…</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                Publish immediately
              </label>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className="btn-primary disabled:opacity-60">
                  <Plus className="h-4 w-4" />
                  {uploading ? 'Uploading…' : saving ? 'Saving…' : published ? 'Create & Publish' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
