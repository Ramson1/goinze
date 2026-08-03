'use client';

import { Bell, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardBody } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { lecturerApi, type LecturerProfile } from '@/lib/api';
import { cn } from '@/lib/cn';

type Tab = 'profile' | 'preferences';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');

  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable profile fields
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [qualification, setQualification] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Preferences (stored on this device only)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [submissionAlerts, setSubmissionAlerts] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    lecturerApi
      .profile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setPhone(p.phone ?? '');
        setDesignation(p.designation ?? '');
        setQualification(p.qualification ?? '');
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await lecturerApi.updateProfile({
        phone: phone.trim(),
        designation: designation.trim(),
        qualification: qualification.trim(),
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function handleSavePrefs() {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  }

  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    : '…';

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile and portal preferences." />

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {(
          [
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Bell },
          ] as Array<{ id: Tab; label: string; icon: typeof User }>
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-white text-brand shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 max-w-2xl rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-5 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Profile updated successfully.
        </div>
      )}
      {prefsSaved && (
        <div className="mb-5 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Preferences saved on this device.
        </div>
      )}

      {tab === 'profile' ? (
        <Card className="max-w-2xl">
          <CardBody>
            {loading || !profile ? (
              <p className="py-12 text-center text-sm text-slate-400">Loading profile…</p>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
                    {initials}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {profile.title ? `${profile.title} ` : ''}
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {profile.staffNumber ?? 'No staff number'} ·{' '}
                      {profile.department ?? 'No department'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {profile.email}
                      {profile.faculty ? ` · ${profile.faculty}` : ''}
                      {profile.session ? ` · ${profile.session}` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Phone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 …"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Designation</label>
                    <input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Lecturer"
                      className="input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Qualification</label>
                    <input
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. PhD, Computer Science"
                      className="input"
                    />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Name, email and department are managed by the school administration.
                </p>

                <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn-primary disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardBody>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Notifications</h3>
            <p className="mb-5 text-xs text-slate-500">
              Choose how you want to be notified about portal activity. These preferences are
              stored on this device.
            </p>

            <div className="space-y-4">
              {(
                [
                  {
                    label: 'Email notifications',
                    sub: 'Receive summaries and alerts by email',
                    value: emailNotifs,
                    onChange: setEmailNotifs,
                  },
                  {
                    label: 'Exam alerts',
                    sub: 'Notify me when an exam goes live or ends',
                    value: examAlerts,
                    onChange: setExamAlerts,
                  },
                  {
                    label: 'Submission alerts',
                    sub: 'Notify me when students submit assignments',
                    value: submissionAlerts,
                    onChange: setSubmissionAlerts,
                  },
                  {
                    label: 'SMS notifications',
                    sub: 'Receive critical alerts via text message',
                    value: smsNotifs,
                    onChange: setSmsNotifs,
                  },
                ] as Array<{
                  label: string;
                  sub: string;
                  value: boolean;
                  onChange: (v: boolean) => void;
                }>
              ).map((pref) => (
                <label
                  key={pref.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      {pref.label}
                    </span>
                    <span className="text-xs text-slate-500">{pref.sub}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={pref.value}
                    onChange={(e) => pref.onChange(e.target.checked)}
                    className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors checked:bg-brand"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button type="button" onClick={handleSavePrefs} className="btn-primary">
                <Save className="h-4 w-4" /> Save Preferences
              </button>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
