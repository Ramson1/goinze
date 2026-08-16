'use client';

import { Bell, ChevronDown, LogOut, RefreshCw, Search, Settings, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLecturer } from '@/lib/lecturer-context';
import { clearTokens, lecturerApi, type NotificationRecord } from '@/lib/api';
import { cn } from '@/lib/cn';

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'L';
}

export function Topbar() {
  const router = useRouter();
  const { profile } = useLecturer();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lecturerApi.notifications().then(setNotifications).catch(() => undefined);
    const interval = setInterval(() => {
      lecturerApi.notifications().then(setNotifications).catch(() => undefined);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;

  function handleSignOut() {
    clearTokens();
    router.replace('/login');
    router.refresh();
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      {/* Left: Lecturer info */}
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {[profile?.title, profile?.firstName, profile?.lastName]
            .filter(Boolean)
            .join(' ') || 'Lecturer'}
        </p>
        <p className="text-xs text-slate-500">
          {[profile?.department, profile?.faculty].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      {/* Center: Search */}
      <form
        onSubmit={handleSearch}
        className="relative hidden w-full max-w-xs lg:block"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search courses, students…"
          className="input pl-9 text-sm"
          aria-label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Refresh */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-brand"
          title="Refresh page"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-brand hover:text-brand-dark"
                >
                  View all
                </Link>
              </div>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </li>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <li
                      key={n.id}
                      className="cursor-pointer px-4 py-3 transition hover:bg-slate-50"
                      onClick={() => {
                        lecturerApi.markNotificationRead(n.id).catch(() => undefined);
                        setNotifOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            n.status === 'READ' ? 'bg-slate-300' : 'bg-brand',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Avatar menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-slate-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {initials(profile?.firstName, profile?.lastName)}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {profile?.firstName ?? 'Lecturer'}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {[profile?.title, profile?.firstName, profile?.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Lecturer'}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{profile?.email ?? '—'}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-slate-400" /> My Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4 text-slate-400" /> Settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
