'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Database,
  Globe,
  Image as ImageIcon,
  Pencil,
  Plus,
  Video,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import { cn } from '@/lib/utils';
import {
  cmsApi,
  type GalleryItemRecord,
  type WebsiteContentRecord,
} from '@/lib/api';

type Tab = 'content' | 'gallery';

const KEY_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

const SUGGESTED_KEYS: { key: string; title: string }[] = [
  { key: 'home.hero', title: 'Homepage Hero' },
  { key: 'about.history', title: 'About the School' },
  { key: 'about.vision', title: 'Vision & Mission' },
  { key: 'admissions.info', title: 'Admissions Info' },
  { key: 'contact', title: 'Contact Details' },
];

function bodyToText(body: unknown): string {
  if (body == null) return '';
  if (typeof body === 'string') return body;
  if (typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    return JSON.stringify(body, null, 2);
  }
  return String(body);
}

function formatWhen(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function WebsiteCmsPage() {
  const [tab, setTab] = useState<Tab>('content');

  const [blocks, setBlocks] = useState<WebsiteContentRecord[]>([]);
  const [gallery, setGallery] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Content block modal
  const [blockOpen, setBlockOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteContentRecord | null>(null);
  const [blockKey, setBlockKey] = useState('');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockBody, setBlockBody] = useState('');

  // Gallery modal
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaAlbum, setMediaAlbum] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [content, items] = await Promise.all([cmsApi.content(), cmsApi.gallery()]);
      setBlocks(content);
      setGallery(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load website content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ---- Content block handlers ----

  function openNewBlock() {
    setEditing(null);
    setBlockKey('');
    setBlockTitle('');
    setBlockBody('');
    setBlockOpen(true);
  }

  function openEditBlock(block: WebsiteContentRecord) {
    setEditing(block);
    setBlockKey(block.key);
    setBlockTitle(block.title ?? '');
    setBlockBody(bodyToText(block.body));
    setBlockOpen(true);
  }

  function applySuggestion(suggestion: { key: string; title: string }) {
    setBlockKey(suggestion.key);
    if (!blockTitle.trim()) setBlockTitle(suggestion.title);
  }

  async function handleSaveBlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const key = blockKey.trim().toLowerCase();
    if (!KEY_PATTERN.test(key)) {
      setError('Block keys may only contain lowercase letters, numbers, dots, dashes and underscores.');
      return;
    }
    setBusy('save-block');
    try {
      await cmsApi.upsertContent({
        key,
        title: blockTitle.trim() || undefined,
        body: { text: blockBody },
      });
      setBlockOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content block.');
    } finally {
      setBusy(null);
    }
  }

  // ---- Gallery handlers ----

  async function handleAddMedia(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy('add-media');
    try {
      let finalUrl = mediaUrl.trim();

      // If a file was selected, upload it first
      if (uploadMode === 'file' && uploadFile) {
        setUploading(true);
        const result = await cmsApi.uploadMedia(uploadFile);
        finalUrl = result.url;
        setUploading(false);
      }

      if (!finalUrl) {
        setError('Please provide a URL or select a file to upload.');
        setBusy(null);
        return;
      }

      await cmsApi.addGalleryItem({
        url: finalUrl,
        type: mediaType,
        caption: mediaCaption.trim() || undefined,
        album: mediaAlbum.trim() || undefined,
      });
      setGalleryOpen(false);
      setMediaUrl('');
      setMediaCaption('');
      setMediaAlbum('');
      setMediaType('IMAGE');
      setUploadFile(null);
      setUploadMode('file');
      await load();
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Failed to add gallery item.');
    } finally {
      setBusy(null);
    }
  }

  const blockColumns: Column<WebsiteContentRecord>[] = [
    {
      key: 'title',
      header: 'Block',
      render: (b) => (
        <span className="font-medium text-gray-900">{b.title || b.key}</span>
      ),
    },
    {
      key: 'key',
      header: 'Key',
      render: (b) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-500">
          <Globe className="h-3.5 w-3.5" /> {b.key}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      className: 'whitespace-nowrap',
      render: (b) => formatWhen(b.updatedAt) ?? '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (b) => (
        <button
          type="button"
          onClick={() => openEditBlock(b)}
          className="btn-secondary px-2.5 py-1.5 text-xs"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Website CMS"
        subtitle="Manage the content blocks and gallery of your public school website."
        action={
          tab === 'content' ? (
            <button type="button" onClick={openNewBlock} className="btn-primary">
              <Plus className="h-4 w-4" /> New Block
            </button>
          ) : (
            <button type="button" onClick={() => setGalleryOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Media
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-card">
        <button
          type="button"
          onClick={() => setTab('content')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'content' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <Database className="h-4 w-4" /> Content Blocks
        </button>
        <button
          type="button"
          onClick={() => setTab('gallery')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
            tab === 'gallery' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
          )}
        >
          <ImageIcon className="h-4 w-4" /> Gallery
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {tab === 'content' ? (
        <Card
          title="Content Blocks"
          subtitle="Keyed content used by the public website — news and events are managed on their own pages"
        >
          {loading ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">Loading content…</p>
          ) : (
            <DataTable
              columns={blockColumns}
              rows={blocks}
              keyField="id"
              emptyMessage="No content blocks yet. Create one to feed the public website."
            />
          )}
        </Card>
      ) : loading ? (
        <p className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
          Loading gallery…
        </p>
      ) : gallery.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          No gallery items yet. Add photos or videos to showcase campus life.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card"
            >
              {item.type === 'VIDEO' ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-40 items-center justify-center bg-gray-900 text-gray-300 transition hover:text-white"
                >
                  <Video className="h-10 w-10" />
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.caption ?? 'Gallery image'}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="px-4 py-3">
                <p className="truncate text-sm font-medium text-gray-800">
                  {item.caption || 'Untitled'}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {item.album ? `Album: ${item.album}` : 'No album'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content block modal */}
      {blockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? 'Edit Content Block' : 'New Content Block'}
              </h3>
              <button
                type="button"
                onClick={() => setBlockOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-4 px-6 py-5">
              {!editing && (
                <div>
                  <label className="label">Common Blocks</label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_KEYS.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => applySuggestion(s)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition',
                          blockKey === s.key
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                        )}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Key</label>
                <input
                  required
                  value={blockKey}
                  onChange={(e) => setBlockKey(e.target.value)}
                  placeholder="e.g. home.hero"
                  disabled={!!editing}
                  className="input font-mono disabled:bg-gray-50 disabled:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Lowercase letters, numbers, dots, dashes and underscores.
                </p>
              </div>

              <div>
                <label className="label">Title (optional)</label>
                <input
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  placeholder="Shown as a heading where supported"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Content</label>
                <textarea
                  value={blockBody}
                  onChange={(e) => setBlockBody(e.target.value)}
                  rows={7}
                  placeholder="Write the content for this block…"
                  className="input resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setBlockOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'save-block'}
                  className="btn-primary disabled:opacity-60"
                >
                  {busy === 'save-block' ? 'Saving…' : editing ? 'Save Changes' : 'Create Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add media modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">Add Gallery Media</h3>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-4 px-6 py-5">
              {/* Upload mode toggle */}
              <div className="flex rounded-lg border border-gray-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
                    uploadMode === 'file' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
                    uploadMode === 'url' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  Paste URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label className="label">Image or Video File</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {uploadFile ? uploadFile.name : 'Select a file to upload to Cloudinary (max 10MB).'}
                  </p>
                  {uploading && (
                    <p className="mt-1 text-xs text-brand">Uploading to Cloudinary…</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="label">Media URL</label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://…"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Paste a hosted image or video URL.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="input"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
                <div>
                  <label className="label">Album (optional)</label>
                  <input
                    value={mediaAlbum}
                    onChange={(e) => setMediaAlbum(e.target.value)}
                    placeholder="e.g. Convocation 2026"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Caption (optional)</label>
                <input
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="Short description of the media…"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setGalleryOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'add-media' || uploading}
                  className="btn-primary disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {uploading ? 'Uploading…' : busy === 'add-media' ? 'Adding…' : 'Add to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
