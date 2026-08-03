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
import { studentApi, getToken, type StudentProfile } from '@/lib/api';

interface StudentContextValue {
  profile: StudentProfile | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const StudentContext = createContext<StudentContextValue>({
  profile: null,
  loading: true,
  error: null,
  reload: () => {},
});

export function StudentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    setError(null);
    studentApi
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
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your portal…
      </div>
    );
  }

  return (
    <StudentContext.Provider value={{ profile, loading, error, reload: load }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}
