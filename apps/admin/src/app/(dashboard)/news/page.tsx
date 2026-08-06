'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2, MessageCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { newsApi, cmsApi, type NewsRecord, type CommentRecord } from '@/lib/api';

function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatCommentDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Comments state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsPostTitle, setCommentsPostTitle] = useState('');
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null);

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

  function resetForm() {
    setTitle('');
    setCategory('');
    setExcerpt('');
    setBody('');
    setPublished(true);
    setCoverFile(null);
    setCoverUrl('');
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(post: NewsRecord) {
    setEditingId(post.id);
    setTitle(post.title);
    setCategory(post.category ?? '');
    setExcerpt(post.excerpt ?? '');
    setBody(post.body);
    setPublished(post.published);
    setCoverFile(null);
    setCoverUrl(post.coverUrl ?? '');
    setFormOpen(true);
  }

  function closeForm() {
    resetForm();
    setFormOpen(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

      const payload = {
        title: title.trim(),
        body: body.trim(),
        category: category.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        coverUrl: finalCoverUrl || undefined,
        published,
      };

      if (editingId) {
        await newsApi.update(editingId, payload);
      } else {
        await newsApi.create(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Failed to save article');
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

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await newsApi.delete(id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    } finally {
      setSaving(false);
    }
  }

  // Comments functions
  async function openComments(post: NewsRecord) {
    setCommentsPostId(post.id);
    setCommentsPostTitle(post.title);
    setCommentsOpen(true);
    setCommentsLoading(true);
    try {
      setComments(await newsApi.listComments(post.id));
    } catch {
      setError('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }

  function closeComments() {
    setCommentsOpen(false);
    setCommentsPostId(null);
    setCommentsPostTitle('');
    setComments([]);
    setCommentFormOpen(false);
    setEditingCommentId(null);
  }

  function openCreateComment() {
    setEditingCommentId(null);
    setCommentName('');
    setCommentText('');
    setCommentFormOpen(true);
  }

  function openEditComment(comment: CommentRecord) {
    setEditingCommentId(comment.id);
    setCommentName(comment.name);
    setCommentText(comment.text);
    setCommentFormOpen(true);
  }

  function closeCommentForm() {
    setCommentFormOpen(false);
    setEditingCommentId(null);
    setCommentName('');
    setCommentText('');
  }

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentsPostId) return;
    setCommentSaving(true);
    try {
      if (editingCommentId) {
        await newsApi.updateComment(editingCommentId, {
          name: commentName.trim(),
          text: commentText.trim(),
        });
      } else {
        await newsApi.createComment(commentsPostId, {
          name: commentName.trim(),
          text: commentText.trim(),
        });
      }
      closeCommentForm();
      setComments(await newsApi.listComments(commentsPostId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save comment');
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleDeleteComment(id: string) {
    if (!commentsPostId) return;
    setCommentSaving(true);
    try {
      await newsApi.deleteComment(id);
      setConfirmDeleteComment(null);
      setComments(await newsApi.listComments(commentsPostId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setCommentSaving(false);
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
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openComments(r)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-amber-50 hover:text-amber-600"
            aria-label="View comments"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
            aria-label="Edit article"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={busyId === r.id}
            onClick={() => togglePublished(r)}
            className="btn-secondary h-8 px-2.5 py-1 text-xs disabled:opacity-60"
          >
            {r.published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(r.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete article"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="News"
        subtitle="Publish news and announcements to the public website."
        action={
          <button type="button" onClick={openCreate} className="btn-primary">
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

      {/* Create / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                {editingId ? 'Edit Article' : 'New Article'}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
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
                  {coverFile
                    ? coverFile.name
                    : coverUrl
                      ? 'Current cover image will be kept.'
                      : 'Select an image to upload as the cover photo.'}
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
                  onClick={closeForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className="btn-primary disabled:opacity-60">
                  {editingId ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Update Article'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {uploading ? 'Uploading…' : saving ? 'Saving…' : published ? 'Create & Publish' : 'Save Draft'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">Delete Article</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this article? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments modal */}
      {commentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Comments</h3>
                <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{commentsPostTitle}</p>
              </div>
              <button
                type="button"
                onClick={closeComments}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              {commentsLoading ? (
                <p className="py-8 text-center text-sm text-gray-400">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No comments yet.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                            {comment.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{comment.name}</p>
                            <p className="text-xs text-gray-400">{formatCommentDate(comment.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEditComment(comment)}
                            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                            aria-label="Edit comment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteComment(comment.id)}
                            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment form */}
              {commentFormOpen ? (
                <form onSubmit={handleCommentSubmit} className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {editingCommentId ? 'Edit Comment' : 'Add Comment'}
                  </h4>
                  <div className="mt-3 space-y-3">
                    <input
                      required
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Name"
                      className="input"
                    />
                    <textarea
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Comment text…"
                      rows={3}
                      className="input resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeCommentForm}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={commentSaving}
                        className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                      >
                        {editingCommentId ? (
                          commentSaving ? 'Saving…' : 'Update'
                        ) : (
                          commentSaving ? 'Adding…' : 'Add Comment'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={openCreateComment}
                  className="mt-6 w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition hover:border-brand hover:text-brand"
                >
                  <Plus className="mr-1.5 inline h-4 w-4" />
                  Add Comment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete comment confirmation modal */}
      {confirmDeleteComment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">Delete Comment</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteComment(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteComment(confirmDeleteComment)}
                disabled={commentSaving}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {commentSaving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
