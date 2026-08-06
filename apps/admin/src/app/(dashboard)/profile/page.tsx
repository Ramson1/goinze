'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Pencil,
  X,
  Check,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Camera,
  Upload,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { authApi, cmsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string | null;
}

function dash(v: string | null | undefined): string {
  return v && v.trim() ? v : '—';
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Change password
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((data) => {
        setProfile(data as UserProfile);
        setDraft({ firstName: data.firstName, lastName: data.lastName, email: data.email });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function startEdit() {
    if (profile) setDraft({ firstName: profile.firstName, lastName: profile.lastName, email: profile.email });
    setEditing(true);
    setSaveMsg(null);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveMsg(null);
  }

  async function saveEdit() {
    if (!profile) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await authApi.updateProfile({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
      });
      setProfile({
        ...profile,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
      });
      setEditing(false);
      setSaveMsg('Profile updated successfully.');
    } catch (err: any) {
      setSaveMsg(err?.message ?? 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'err', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'Passwords do not match.' });
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err?.message ?? 'Failed to change password.' });
    } finally {
      setPwLoading(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!profile) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const result = await cmsApi.uploadMedia(file);
      const updated = await authApi.updateProfile({ avatarUrl: result.url });
      setProfile({ ...profile, avatarUrl: updated.avatarUrl });
    } catch (err: any) {
      setAvatarError(err?.message ?? 'Failed to upload photo.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!profile) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const updated = await authApi.updateProfile({ avatarUrl: '' as any });
      setProfile({ ...profile, avatarUrl: null });
    } catch (err: any) {
      setAvatarError(err?.message ?? 'Failed to remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="My Profile" subtitle="Unable to load profile information." />
      </div>
    );
  }

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information and security settings."
      />

      {/* Identity banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mt-10 flex items-center gap-4">
            <div className="relative">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-4 ring-white"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white ring-4 ring-white">
                  {initials}
                </span>
              )}
              <label
                className={cn(
                  'absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50',
                  avatarUploading && 'pointer-events-none opacity-60',
                )}
                title="Upload profile photo"
              >
                {avatarUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-brand" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setAvatarError('Image must be under 5 MB.');
                      e.target.value = '';
                      return;
                    }
                    await handleAvatarUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div className="pt-10">
              <h2 className="text-lg font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                Remove photo
              </button>
            )}
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">
              {formatRole(profile.role)}
            </span>
          </div>
        </div>
        {avatarError && (
          <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            {avatarError}
          </div>
        )}
      </Card>

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="p-6">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand">
                <User className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Account Information</h2>
                <p className="text-xs text-gray-500">Your personal and login details</p>
              </div>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEdit}
                  className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            ) : (
              <button onClick={startEdit} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
          </div>

          {saveMsg && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
              {saveMsg}
            </div>
          )}

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">First Name</dt>
              {editing ? (
                <input
                  value={draft.firstName}
                  onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
                  className="input mt-1.5"
                />
              ) : (
                <dd className="mt-1 text-sm font-medium text-gray-800">{dash(profile.firstName)}</dd>
              )}
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Last Name</dt>
              {editing ? (
                <input
                  value={draft.lastName}
                  onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
                  className="input mt-1.5"
                />
              ) : (
                <dd className="mt-1 text-sm font-medium text-gray-800">{dash(profile.lastName)}</dd>
              )}
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Mail className="h-3 w-3" /> Email
              </dt>
              {editing ? (
                <input
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  type="email"
                  className="input mt-1.5"
                />
              ) : (
                <dd className="mt-1 text-sm font-medium text-gray-800">{dash(profile.email)}</dd>
              )}
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Shield className="h-3 w-3" /> Role
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-800">{formatRole(profile.role)}</dd>
            </div>
          </dl>
        </Card>

        {/* Change Password */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
              <p className="text-xs text-gray-500">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {pwMsg && (
              <div
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm',
                  pwMsg.type === 'ok'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700',
                )}
              >
                {pwMsg.text}
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="currentPassword"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="input pl-9 pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="input"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                className="input"
                placeholder="Re-enter new password"
              />
            </div>

            <button type="submit" disabled={pwLoading} className="btn-primary flex items-center gap-2">
              {pwLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Changing…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Change Password
                </>
              )}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
