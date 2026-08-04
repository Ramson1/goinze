'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { LecturerProvider } from '@/lib/lecturer-context';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie('goinze_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    const role = decodeRoleFromToken(token);
    if (!role || role !== 'LECTURER') {
      setRoleError('This portal is for lecturers only.');
      document.cookie = 'goinze_token=; path=/; max-age=0';
      setTimeout(() => router.replace('/login'), 2500);
      return;
    }
    setAuthChecked(true);
  }, [router]);

  if (roleError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600">Access Denied</p>
          <p className="mt-2 text-sm text-slate-500">{roleError}</p>
          <p className="mt-1 text-xs text-slate-400">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Checking authentication…</p>
      </div>
    );
  }

  return (
    <LecturerProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="pl-64">
          <Topbar />
          <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
          <footer className="border-t border-slate-200/80 px-6 py-4 text-center text-xs text-slate-400">
            <p>Goinzeschool Lecturer Portal · Enterprise School ERP</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Designed &amp; developed by{' '}
              <a
                href="https://rhemaexpertsolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                Rhema Expert Solutions
              </a>
              {' '}| +234 803 522 6642
            </p>
          </footer>
        </div>
      </div>
    </LecturerProvider>
  );
}
