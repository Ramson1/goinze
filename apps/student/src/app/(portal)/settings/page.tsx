'use client';

import { useState, type FormEvent } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  Bell,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { authApi } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={enabled}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
        enabled ? 'bg-brand' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition',
          enabled ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { profile } = useStudent();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState({
    emailResults: true,
    emailPayments: true,
    emailCbt: true,
    smsAlerts: false,
    newsletter: false,
  });

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    setPwError(null);

    if (next.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: next });
      setSaved(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  }

  function togglePref(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your account, security and notification preferences." />

      <div className="space-y-6">
        {/* Account */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <SettingsIcon className="h-4 w-4 text-brand" /> Account
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Full Name</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {profile?.firstName} {profile?.middleName ?? ''} {profile?.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Matric Number</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {profile?.matricNo ?? profile?.regNumber ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{profile?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{profile?.phone ?? '—'}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
            To correct your name, date of birth or other bio-data, submit a change request with supporting
            documents at the Students' Affairs office.
          </p>
        </Card>

        {/* Security */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lock className="h-4 w-4 text-brand" /> Change Password
          </h2>
          {saved && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Password updated successfully.
            </div>
          )}
          {pwError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {pwError}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="current" className="field-label">Current password</label>
              <input
                id="current"
                type="password"
                required
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="new" className="field-label">New password</label>
                <div className="relative">
                  <input
                    id="new"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="input-field pr-10"
                    placeholder="Min. 8 characters"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="field-label">Confirm new password</label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-brand" /> Notification Preferences
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            These preferences are stored on this device only.
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {(
              [
                { key: 'emailResults', label: 'Email me when results are released', desc: 'Semester and CBT results' },
                { key: 'emailPayments', label: 'Email me payment receipts', desc: 'Confirmations and reminders' },
                { key: 'emailCbt', label: 'Email me CBT exam schedules', desc: 'New exams and venue changes' },
                { key: 'smsAlerts', label: 'SMS alerts', desc: 'Critical account alerts via text message' },
                { key: 'newsletter', label: 'University newsletter', desc: 'News, events and opportunities' },
              ] as const
            ).map((row) => (
              <li key={row.key} className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{row.label}</p>
                  <p className="text-xs text-slate-400">{row.desc}</p>
                </div>
                <Toggle enabled={prefs[row.key]} onChange={() => togglePref(row.key)} />
              </li>
            ))}
          </ul>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200 p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-red-700">
            <ShieldAlert className="h-4 w-4" /> Report Lost ID Card
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            If your physical or digital ID card is lost or stolen, report it immediately to deactivate it
            and prevent misuse. A replacement can be ordered after payment of the replacement levy.
          </p>
          <button className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            Report Lost Card
          </button>
        </Card>
      </div>
    </div>
  );
}
