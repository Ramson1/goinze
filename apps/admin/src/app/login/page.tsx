'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER', 'ACCOUNTANT']);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message ?? 'Invalid email or password.');
      }

      // API returns AuthTokens: { accessToken, refreshToken, expiresIn }
      const token: string | undefined = data?.accessToken ?? data?.data?.accessToken;
      if (!token) {
        throw new Error('Malformed response from server.');
      }

      document.cookie = `access_token=${token}; path=/; max-age=${data?.expiresIn ?? 900}; SameSite=Lax`;

      // Store the refresh token so we can silently renew the access token
      const refreshToken: string | undefined = data?.refreshToken ?? data?.data?.refreshToken;
      if (refreshToken) {
        document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      // Verify the user has an admin role
      const role = decodeRoleFromToken(token);
      if (!role || !ADMIN_ROLES.has(role)) {
        // Clear the token — this portal is for admin/staff only
        document.cookie = 'access_token=; path=/; max-age=0';
        document.cookie = 'refresh_token=; path=/; max-age=0';
        throw new Error('Your account does not have permission to access the admin dashboard.');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
            <Image
              src="/logo.png"
              alt="Goinzeschool logo"
              width={56}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Goinzeschool Admin
          </h1>
          <p className="mt-1 text-sm text-blue-200/80">
            Sign in to the school administration portal
          </p>
          <p className="mt-1 text-xs italic text-blue-200/60">
            Learn how to maintain a good health
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.edu.ng"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Authorized staff only. All sign-ins are logged.
          </p>
        </div>
      </div>
    </main>
  );
}
