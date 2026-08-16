'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { studentApi } from '@/lib/api';
import { useStudent } from '@/lib/student-context';

const EXEMPT_PATHS = ['/payments', '/receipts'];

export default function PortalAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useStudent();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const isExempt = EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (isExempt || !profile) {
      setChecking(false);
      setHasAccess(true);
      return;
    }

    let alive = true;
    studentApi
      .fees()
      .then((fees) => {
        if (!alive) return;
        const currentSession = profile.session;
        const portalPaid = fees.items.some(
          (i) =>
            i.type === 'PORTAL_ACCESS' &&
            i.status === 'PAID' &&
            (!currentSession || i.sessionName === currentSession),
        );
        setHasAccess(portalPaid);
        if (!portalPaid) {
          router.replace('/payments?portal_access_required=true');
        }
      })
      .catch(() => setHasAccess(true)) // fail-open on API error
      .finally(() => alive && setChecking(false));

    return () => {
      alive = false;
    };
  }, [pathname, profile, router, isExempt]);

  if (checking || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Verifying access…
      </div>
    );
  }

  return <>{children}</>;
}
