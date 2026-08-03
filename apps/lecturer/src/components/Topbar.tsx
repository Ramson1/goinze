'use client';

import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { currentAcademicSession } from '@goinze/shared-utils';
import { useLecturer } from '@/lib/lecturer-context';
import { clearTokens } from '@/lib/api';

const notifications = [
  { id: 'n1', text: 'CSC 203 CA 2 is now live — 61 students have started.', time: '5m ago' },
  { id: 'n2', text: 'Ngozi Umeh resubmitted "Assignment 3 — Linked Lists".', time: '1h ago' },
  { id: 'n3', text: `Result approval for CSC 101 (${currentAcademicSession()}) is complete.`, time: 'Yesterday' },
];

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'L';
}

export function Topbar() {
  const router = useRouter();
  const { profile } = useLecturer();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    clearTokens();
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
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

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
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
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                Notifications
              </div>
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="text-sm text-slate-700">{n.text}</p>
                    <p className="mt-1 text-xs text-slate-400">{n.time}</p>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="w-full rounded-b-xl px-4 py-2.5 text-center text-xs font-semibold text-brand hover:bg-slate-50"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Avatar menu */}
        <div className="relative">
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
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {[profile?.title, profile?.firstName, profile?.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Lecturer'}
                </p>
                <p className="text-xs text-slate-500">{profile?.email ?? '—'}</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-slate-400" /> My Profile
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4 text-slate-400" /> Settings
              </button>
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
