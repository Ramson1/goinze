'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { StudentProvider } from '@/lib/student-context';

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

const STUDENT_ROLES = new Set(['STUDENT', 'PARENT']);

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie('gz_access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    const role = decodeRoleFromToken(token);
    if (!role || !STUDENT_ROLES.has(role)) {
      setRoleError('This portal is for students only.');
      document.cookie = 'gz_access_token=; path=/; max-age=0';
      document.cookie = 'gz_refresh_token=; path=/; max-age=0';
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
    <StudentProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-h-screen flex-col lg:pl-72">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="border-t border-slate-200/80 px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
            <p>Goinzeschool Student Portal · Enterprise School ERP</p>
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
    </StudentProvider>
  );
}
