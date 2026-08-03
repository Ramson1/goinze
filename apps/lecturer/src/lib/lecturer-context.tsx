'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { lecturerApi, getToken, type LecturerProfile } from '@/lib/api';

interface LecturerContextValue {
  profile: LecturerProfile | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const LecturerContext = createContext<LecturerContextValue>({
  profile: null,
  loading: true,
  error: null,
  reload: () => {},
});

export function LecturerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    setError(null);
    lecturerApi
      .profile()
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load your profile.');
        if (err?.status === 401 || err?.status === 403) {
          router.replace('/login');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your portal…
      </div>
    );
  }

  return (
    <LecturerContext.Provider value={{ profile, loading, error, reload: load }}>
      {children}
    </LecturerContext.Provider>
  );
}

export function useLecturer() {
  return useContext(LecturerContext);
}
