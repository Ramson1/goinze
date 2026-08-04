'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Award,
  BookOpen,
  Pencil,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { useLecturer } from '@/lib/lecturer-context';
import { lecturerApi } from '@/lib/api';
import { cn } from '@/lib/cn';

function dash(v: string | null | undefined): string {
  return v && v.trim() ? v : '—';
}

export default function ProfilePage() {
  const { profile, reload } = useLecturer();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    phone: profile?.phone ?? '',
    designation: profile?.designation ?? '',
    qualification: profile?.qualification ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="My Profile" subtitle="Loading profile…" />
      </div>
    );
  }

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();

  function startEdit() {
    setDraft({
      phone: profile?.phone ?? '',
      designation: profile?.designation ?? '',
      qualification: profile?.qualification ?? '',
    });
    setEditing(true);
    setMsg(null);
  }

  function cancelEdit() {
    setEditing(false);
    setMsg(null);
  }

  async function saveEdit() {
    setSaving(true);
    setMsg(null);
    try {
      await lecturerApi.updateProfile({
        phone: draft.phone || undefined,
        designation: draft.designation || undefined,
        qualification: draft.qualification || undefined,
      });
      await reload();
      setEditing(false);
      setMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.message ?? 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="My Profile"
        subtitle="Review and update your staff information."
        actions={
          editing ? (
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
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            </div>
          ) : (
            <button onClick={startEdit} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )
        }
      />

      {msg && (
        <div
          className={cn(
            'mb-6 rounded-lg border px-4 py-2.5 text-sm',
            msg.type === 'ok'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700',
          )}
        >
          {msg.text}
        </div>
      )}

      {/* Identity banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-dark via-brand to-brand-light" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-10 flex items-end gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white ring-4 ring-white">
              {initials}
            </span>
            <div className="pb-1">
              <h2 className="text-lg font-bold text-slate-900">
                {[profile.title, profile.firstName, profile.lastName].filter(Boolean).join(' ')}
              </h2>
              <p className="text-sm text-slate-500">
                {dash(profile.staffNumber)} · {dash(profile.department)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {profile.designation && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">
                {profile.designation}
              </span>
            )}
            {profile.session && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {profile.session}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Your basic staff details</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">First Name</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.firstName)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Last Name</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.lastName)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Title</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.title)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Staff Number</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.staffNumber)}</dd>
            </div>
          </dl>
        </Card>

        {/* Contact & Professional */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Contact & Professional</h2>
              <p className="text-xs text-slate-500">Editable contact and professional details</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <Mail className="h-3 w-3" /> Email
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.email)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <Phone className="h-3 w-3" /> Phone
              </dt>
              {editing ? (
                <input
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  className="input mt-1"
                  placeholder="+234…"
                />
              ) : (
                <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.phone)}</dd>
              )}
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <Award className="h-3 w-3" /> Designation
              </dt>
              {editing ? (
                <input
                  value={draft.designation}
                  onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))}
                  className="input mt-1"
                  placeholder="e.g. Senior Lecturer"
                />
              ) : (
                <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.designation)}</dd>
              )}
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <BookOpen className="h-3 w-3" /> Qualification
              </dt>
              {editing ? (
                <input
                  value={draft.qualification}
                  onChange={(e) => setDraft((d) => ({ ...d, qualification: e.target.value }))}
                  className="input mt-1"
                  placeholder="e.g. Ph.D Computer Science"
                />
              ) : (
                <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.qualification)}</dd>
              )}
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Department</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.department)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Faculty</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{dash(profile.faculty)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
