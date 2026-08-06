'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { cn } from '@/lib/utils';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Decode the role claim from a JWT without verification (client-side guard only). */
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

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER', 'ACCOUNTANT']);

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const token = getCookie('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    const role = decodeRoleFromToken(token);
    if (!role || !ADMIN_ROLES.has(role)) {
      setRoleError('You do not have permission to access the admin dashboard.');
      // Clear the invalid token so the user can re-login
      document.cookie = 'access_token=; path=/; max-age=0';
      document.cookie = 'refresh_token=; path=/; max-age=0';
      setTimeout(() => router.replace('/login'), 2500);
      return;
    }
    setUserRole(role);
    setAuthChecked(true);
  }, [router, pathname]);

  if (roleError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600">Access Denied</p>
          <p className="mt-2 text-sm text-gray-500">{roleError}</p>
          <p className="mt-1 text-xs text-gray-400">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Checking authentication…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className={cn('flex min-w-0 flex-1 flex-col transition-all duration-200', sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-64')}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
