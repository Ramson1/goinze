'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Pin, Send } from 'lucide-react';
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
  const [sent, setSent] = useState(false);

  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [pinned, setPinned] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    communicationApi
      .announcements()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load announcements');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    setSent(false);
    try {
      await communicationApi.createAnnouncement({
        title: title.trim(),
        body: message.trim(),
        audience,
        pinned,
      });
      const list = await communicationApi.announcements();
      setItems(list);
      setTitle('');
      setMessage('');
      setPinned(false);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Communication"
        subtitle="Compose and broadcast announcements to students and staff."
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
          subtitle="Reach students, staff or everyone"
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

            {sent && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                Announcement sent.
              </p>
            )}

            <button type="submit" disabled={sending} className="btn-primary w-full disabled:opacity-60">
              <Send className="h-4 w-4" />
              {sending ? 'Sending…' : 'Send Announcement'}
            </button>
          </form>
        </Card>

        {/* History */}
        <Card
          title="Sent Announcements"
          subtitle="Recent broadcasts, pinned first"
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
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {audienceLabels[item.audience ?? 'ALL'] ?? item.audience}
                      </span>
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
    </>
  );
}
