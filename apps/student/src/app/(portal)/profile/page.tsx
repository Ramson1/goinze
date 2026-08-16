'use client';

import { useState } from 'react';
import { Pencil, X, Check, User, Users, HeartPulse } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

interface Field {
  label: string;
  value: string;
  span?: boolean;
}

function InfoSection({
  icon: Icon,
  title,
  subtitle,
  fields,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
  fields: Field[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  function startEdit() {
    setDraft(Object.fromEntries(fields.map((f) => [f.label, f.value])));
    setEditing(true);
  }

  function save() {
    // Profile editing is read-only in this slice; a future PATCH /students/me will persist changes.
    setEditing(false);
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary px-3 py-1.5 text-xs">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button onClick={save} className="btn-primary px-3 py-1.5 text-xs">
              <Check className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        ) : (
          <button onClick={startEdit} className="btn-secondary px-3 py-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className={cn(f.span && 'sm:col-span-2')}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{f.label}</dt>
            {editing ? (
              <input
                value={draft[f.label] ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, [f.label]: e.target.value }))}
                className="input-field mt-1.5"
              />
            ) : (
              <dd className="mt-1 text-sm font-medium text-slate-800">{f.value}</dd>
            )}
          </div>
        ))}
      </dl>
    </Card>
  );
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

const dash = (v: string | null | undefined) => (v && v.trim() ? v : '—');

export default function ProfilePage() {
  const { profile } = useStudent();

  if (!profile) return null;

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Profile"
        description="Review and update your personal, guardian and medical information."
      />

      {/* Identity banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-dark via-brand to-brand-light" />
        <div className="flex flex-col gap-4 px-6 pb-6 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-2xl font-bold text-white ring-4 ring-white">
              {initials}
            </span>
            <div className="pb-1">
              <h2 className="text-lg font-bold text-slate-900">
                {profile.firstName} {profile.middleName ?? ''} {profile.lastName}
              </h2>
              <p className="text-sm text-slate-500">
                {dash(profile.matricNo)} · {dash(profile.programme)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">
              {profile.currentLevel ? `${profile.currentLevel} Level` : '—'}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {dash(profile.session)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {dash(profile.department)}
            </span>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <InfoSection
          icon={User}
          title="Bio-Data"
          subtitle="Your personal and contact information"
          fields={[
            { label: 'First Name', value: dash(profile.firstName) },
            { label: 'Middle Name', value: dash(profile.middleName) },
            { label: 'Last Name', value: dash(profile.lastName) },
            { label: 'Date of Birth', value: formatDate(profile.dateOfBirth) },
            { label: 'Gender', value: dash(profile.gender) },
            { label: 'Nationality', value: dash(profile.nationality) },
            { label: 'State of Origin', value: dash(profile.stateOfOrigin) },
            { label: 'Phone', value: dash(profile.phone) },
            { label: 'Email', value: dash(profile.email), span: true },
            { label: 'Home Address', value: dash(profile.address), span: true },
          ]}
        />

        <InfoSection
          icon={Users}
          title="Guardian Information"
          subtitle="Parent / guardian contact details"
          fields={[
            { label: 'Full Name', value: dash(profile.guardian.name) },
            { label: 'Relationship', value: dash(profile.guardian.relationship) },
            { label: 'Phone', value: dash(profile.guardian.phone) },
            { label: 'Email', value: dash(profile.guardian.email), span: true },
          ]}
        />

        <InfoSection
          icon={HeartPulse}
          title="Medical Information"
          subtitle="Used by the university clinic in case of emergency"
          fields={[
            { label: 'Blood Group', value: dash(profile.medical.bloodGroup) },
            { label: 'Genotype', value: dash(profile.medical.genotype) },
            { label: 'Notes', value: dash(profile.medical.notes), span: true },
          ]}
        />
      </div>
    </div>
  );
}
