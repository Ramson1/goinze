'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Pin, Send, Pencil, Trash2, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { communicationApi, type AnnouncementRecord } from '@/lib/api';

const audienceLabels: Record<string, string> = {
  ALL: 'Everyone',
  STUDENTS: 'All Students',
  STAFF: 'All Staff',
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function CommunicationPage() {
  const [items, setItems] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [pinned, setPinned] = useState(false);
  const [message, setMessage] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAudience, setEditAudience] = useState('ALL');
  const [editPinned, setEditPinned] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await communicationApi.announcements());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await communicationApi.createAnnouncement({
        title: title.trim(),
        body: message.trim(),
        audience,
        pinned,
      });
      await load();
      setTitle('');
      setMessage('');
      setPinned(false);
      setAudience('ALL');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  }

  function openEdit(item: AnnouncementRecord) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditAudience(item.audience ?? 'ALL');
    setEditPinned(item.pinned);
    setEditMessage(item.body);
  }

  function closeEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditAudience('ALL');
    setEditPinned(false);
    setEditMessage('');
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId || !editTitle.trim() || !editMessage.trim()) return;
    setEditSaving(true);
    try {
      await communicationApi.updateAnnouncement(editingId, {
        title: editTitle.trim(),
        body: editMessage.trim(),
        audience: editAudience,
        pinned: editPinned,
      });
      closeEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update announcement');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setEditSaving(true);
    try {
      await communicationApi.deleteAnnouncement(id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Manage the notice board announcements shown on the public website."
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Composer */}
        <Card
          title="New Announcement"
          subtitle="This will appear on the website's Notice Board"
          className="xl:col-span-2"
        >
          <form onSubmit={handleSend} className="space-y-4 p-5">
            <div>
              <label htmlFor="ann-title" className="label">
                Title
              </label>
              <input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-semester break begins Friday"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="ann-audience" className="label">
                Audience
              </label>
              <select
                id="ann-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="input"
              >
                <option value="ALL">Everyone</option>
                <option value="STUDENTS">All Students</option>
                <option value="STAFF">All Staff</option>
              </select>
            </div>

            <div>
              <label htmlFor="ann-message" className="label">
                Message
              </label>
              <textarea
                id="ann-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Write your announcement…"
                className="input resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              Pin to the top of the feed
            </label>

            <button type="submit" disabled={sending} className="btn-primary w-full disabled:opacity-60">
              <Send className="h-4 w-4" />
              {sending ? 'Sending…' : 'Send Announcement'}
            </button>
          </form>
        </Card>

        {/* History */}
        <Card
          title="Notice Board"
          subtitle="Announcements shown on the public website, pinned first"
          className="xl:col-span-3"
        >
          {loading ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">Loading announcements…</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3.5 px-5 py-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-gray-900">
                        {item.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                        <span className="truncate">{item.title}</span>
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {audienceLabels[item.audience ?? 'ALL'] ?? item.audience}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          aria-label="Edit announcement"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete announcement"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.body}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {formatDate(item.publishedAt)}
                    </p>
                  </div>
                </li>
              ))}
              {items.length === 0 && (
                <li className="px-5 py-12 text-center text-sm text-gray-400">
                  No announcements sent yet.
                </li>
              )}
            </ul>
          )}
        </Card>
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">Edit Announcement</h3>
              <button
                type="button"
                onClick={closeEdit}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Title</label>
                <input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Audience</label>
                <select
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  className="input"
                >
                  <option value="ALL">Everyone</option>
                  <option value="STUDENTS">All Students</option>
                  <option value="STAFF">All Staff</option>
                </select>
              </div>

              <div>
                <label className="label">Message</label>
                <textarea
                  required
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={5}
                  className="input resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editPinned}
                  onChange={(e) => setEditPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                Pin to the top of the feed
              </label>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={closeEdit} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="btn-primary disabled:opacity-60">
                  <Pencil className="h-4 w-4" />
                  {editSaving ? 'Saving…' : 'Update'}
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
            <h3 className="text-base font-semibold text-gray-900">Delete Announcement</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this announcement? This action cannot be undone.
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
                disabled={editSaving}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {editSaving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
