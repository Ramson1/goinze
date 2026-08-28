'use client';

import Image from 'next/image';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'LECTURER' }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (data && (data.message as string)) ||
            'Invalid email or password. Please try again.',
        );
      }

      const accessToken: string | undefined =
        data?.data?.accessToken ?? data?.accessToken;

      if (!accessToken) {
        throw new Error('Authentication succeeded but no token was returned.');
      }

      // Store the access token in a cookie
      document.cookie = `goinze_token=${accessToken}; path=/; max-age=${
        60 * 60 * 24 * 7
      }; SameSite=Lax`;

      // Store the refresh token for silent renewal
      const refreshToken: string | undefined =
        data?.data?.refreshToken ?? data?.refreshToken;
      if (refreshToken) {
        document.cookie = `goinze_refresh_token=${refreshToken}; path=/; max-age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;
      }

      // Verify the user has a lecturer role
      const role = decodeRoleFromToken(accessToken);
      if (!role || role !== 'LECTURER') {
        document.cookie = 'goinze_token=; path=/; max-age=0';
        document.cookie = 'goinze_refresh_token=; path=/; max-age=0';
        throw new Error('Your account does not have permission to access the lecturer portal.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-brand-light px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
            <Image
              src="/logo.png"
              alt="Goinzeschool logo"
              width={56}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Goinzeschool</h1>
          <p className="mt-1 text-sm text-blue-100/90">Lecturer Portal</p>
          <p className="mt-1 text-xs italic text-blue-200/80">
            Learn how to maintain a good health
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use your staff credentials to access the portal.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@goinzeschool.com"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand-light"
                />
                Remember me
              </label>
              <button type="button" className="font-medium text-brand hover:underline">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-blue-100/80">
          Already have a staff number?{' '}
          <Link href="/self-register" className="font-medium text-white hover:underline">
            Create your portal account
          </Link>
        </p>
      </div>
    </div>
  );
}
