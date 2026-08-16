'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Info, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { notificationApi, type NotificationRecord } from '@/lib/api';
import { cn } from '@/lib/utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => {
    setLoading(true);
    notificationApi
      .list()
      .then(setNotifications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const isUnread = (n: NotificationRecord) => n.status !== 'READ';
  const list = notifications.filter((n) => (filter === 'unread' ? isUnread(n) : true));
  const unreadCount = notifications.filter(isUnread).length;

  async function markRead(n: NotificationRecord) {
    if (!isUnread(n)) return;
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, status: 'READ' as const } : x)),
    );
    try {
      await notificationApi.markRead(n.id);
    } catch {
      /* keep optimistic state */
    }
  }

  async function markAllRead() {
    const targets = notifications.filter(isUnread);
    if (targets.length === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((x) => ({ ...x, status: 'READ' as const })));
    await Promise.allSettled(targets.map((n) => notificationApi.markRead(n.id)));
    setMarkingAll(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle="Stay up to date with admissions, payments, and academic activity."
        action={
          <button onClick={markAllRead} disabled={markingAll || unreadCount === 0} className="btn-secondary disabled:opacity-50">
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all read
          </button>
        }
      />

      {/* Filter */}
      <div className="mb-5 flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold capitalize transition',
              filter === f
                ? 'bg-brand text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
        </Card>
      )}

      {!loading && error && (
        <Card className="p-10 text-center">
          <Bell className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {list.length === 0 && (
            <Card className="p-10 text-center">
              <Bell className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-600">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-gray-400">
                No {filter === 'unread' ? 'unread ' : ''}notifications right now.
              </p>
            </Card>
          )}

          {list.map((n) => {
            const read = !isUnread(n);
            return (
              <div
                key={n.id}
                role={read ? undefined : 'button'}
                tabIndex={read ? undefined : 0}
                onClick={() => markRead(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') markRead(n);
                }}
                className={cn('outline-none', !read && 'cursor-pointer')}
                title={read ? undefined : 'Click to mark as read'}
              >
                <Card
                  className={cn('p-5 transition', !read && 'border-l-4 border-l-brand')}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Info className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className={cn('text-sm', read ? 'font-medium text-gray-700' : 'font-bold text-gray-900')}>
                          {n.title}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">{n.body}</p>
                    </div>
                    {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
