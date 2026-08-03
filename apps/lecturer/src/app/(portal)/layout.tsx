'use client';

import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { LecturerProvider } from '@/lib/lecturer-context';

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LecturerProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="pl-64">
          <Topbar />
          <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
        </div>
      </div>
    </LecturerProvider>
  );
}
