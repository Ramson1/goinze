'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { studentApi } from '@/lib/api';
import { useStudent } from '@/lib/student-context';

const EXEMPT_PATHS = ['/payments', '/receipts'];

export default function TuitionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useStudent();
  const [checking, setChecking] = useState(true);

  const isResultsPage = pathname === '/results' || pathname.startsWith('/results/');
  const isExempt = EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (!isResultsPage || isExempt || !profile) {
      setChecking(false);
      return;
    }

    let alive = true;
    studentApi
      .fees()
      .then((fees) => {
        if (!alive) return;
        const currentSession = profile.session;
        const schoolItems = fees.items.filter(
          (i) => i.type === 'SCHOOL' && (!currentSession || i.sessionName === currentSession),
        );

        // If no SCHOOL fee exists for this session, fail-open (allow access)
        if (schoolItems.length === 0) {
          return;
        }

        const tuitionPaid = schoolItems.some((i) => i.status === 'PAID');
        if (!tuitionPaid) {
          router.replace('/payments?tuition_required=true');
        }
      })
      .catch(() => {}) // fail-open on API error
      .finally(() => alive && setChecking(false));

    return () => {
      alive = false;
    };
  }, [pathname, profile, router, isResultsPage, isExempt]);

  if (checking || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Verifying access…
      </div>
    );
  }

  return <>{children}</>;
}
