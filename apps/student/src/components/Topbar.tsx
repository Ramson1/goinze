'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
  GraduationCap,
} from 'lucide-react';
import { commApi, type NotificationRecord } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

function clearTokenCookies() {
  document.cookie = 'gz_access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'gz_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { profile } = useStudent();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commApi
      .notifications()
      .then(setNotifications)
      .catch(() => undefined);
  }, []);

  const unread = notifications.filter((n) => n.status !== 'READ').length;
  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`
    : '—';

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    clearTokenCookies();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: mobile menu + session */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{profile?.session ?? '—'}</p>
            <p className="text-xs text-slate-500">{profile?.programme ?? profile?.department ?? ''}</p>
          </div>
        </div>

        {/* Right: notifications + avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-hover">
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
                  {notifications.length === 0 && (
                    <li className="px-4 py-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </li>
                  )}
                  {notifications.slice(0, 4).map((n) => (
                    <li key={n.id} className="px-4 py-3 transition hover:bg-slate-50">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            n.status === 'READ' ? 'bg-slate-300' : 'bg-brand',
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Avatar menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
              aria-label="Account menu"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm font-bold text-white ring-2 ring-blue-100">
                {initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-semibold leading-tight text-slate-900">
                  {profile?.firstName} {profile?.lastName}
                </span>
                <span className="block text-xs text-slate-500">
                  {profile?.currentLevel ? `${profile.currentLevel} Level` : ''} · {profile?.matricNo ?? ''}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-hover">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {profile?.firstName} {profile?.middleName ?? ''} {profile?.lastName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{profile?.email ?? ''}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-400" /> My Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4 text-slate-400" /> Settings
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/digital-id"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <GraduationCap className="h-4 w-4 text-slate-400" /> Digital ID Card
                    </Link>
                  </li>
                </ul>
                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
