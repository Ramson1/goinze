'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import {
  settingsApi,
  cmsApi,
  type SchoolProfile,
} from '@/lib/api';

type TabKey = 'profile' | 'grading';

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'profile', label: 'School Profile', icon: Building2 },
  { key: 'grading', label: 'Grading', icon: GraduationCap },
];

interface GradeBand {
  grade: string;
  min: number;
  max: number;
  point: number;
  remark: string;
}

const DEFAULT_HIGHER_ED_GRADES: GradeBand[] = [
  { grade: 'A', min: 70, max: 100, point: 5.0, remark: 'Distinction' },
  { grade: 'B', min: 60, max: 69, point: 4.0, remark: 'Very Good' },
  { grade: 'C', min: 50, max: 59, point: 3.0, remark: 'Good' },
  { grade: 'D', min: 45, max: 49, point: 2.0, remark: 'Pass' },
  { grade: 'E', min: 40, max: 44, point: 1.0, remark: 'Marginal Fail' },
  { grade: 'F', min: 0, max: 39, point: 0.0, remark: 'Fail' },
];

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Profile form
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Grading form
  const [gradeBands, setGradeBands] = useState<GradeBand[]>(DEFAULT_HIGHER_ED_GRADES);
  const [editingGrade, setEditingGrade] = useState<number | null>(null);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [prof, settings] = await Promise.all([
          settingsApi.profile(),
          settingsApi.all(),
        ]);
        if (cancelled) return;

        if (prof) {
          setProfile(prof);
          setName(prof.name ?? '');
          setEmail(prof.email ?? '');
          setPhone(prof.phone ?? '');
          setAddress(prof.address ?? '');
        }

        // Load grading bands from settings
        const grading = (settings['grading.bands'] ?? []) as GradeBand[];
        if (grading.length > 0) {
          setGradeBands(grading);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load settings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving('profile');
    setError(null);
    try {
      const updated = await settingsApi.updateProfile({
        name,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setProfile(updated);

      // Sync with Website CMS contact.info
      await cmsApi.upsertContent({
        key: 'contact.info',
        body: {
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          hours: '', // Keep existing hours from CMS if any
        },
      });

      flash('School profile saved and synced with website.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveGrading() {
    setSaving('grading');
    setError(null);
    try {
      await settingsApi.updateMany({
        'grading.bands': gradeBands,
      });
      flash('Grading scale saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grading.');
    } finally {
      setSaving(null);
    }
  }

  // Grading CRUD helpers
  function addGradeBand() {
    setGradeBands([...gradeBands, { grade: '', min: 0, max: 0, point: 0, remark: '' }]);
    setEditingGrade(gradeBands.length);
  }

  function updateGradeBand(index: number, field: keyof GradeBand, value: string | number) {
    const copy = [...gradeBands];
    copy[index] = { ...copy[index], [field]: value };
    setGradeBands(copy);
  }

  function deleteGradeBand(index: number) {
    setGradeBands(gradeBands.filter((_, i) => i !== index));
    setEditingGrade(null);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure school-wide preferences." />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Tab nav */}
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition',
                  tab === key
                    ? 'bg-brand text-white shadow-card'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>

          {/* Tab panel */}
          <div className="lg:col-span-3">
            {tab === 'profile' && (
              <Card
                title="School Profile"
                subtitle="Basic information shown across the portal and website"
                action={
                  profile?.subscription ? (
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold uppercase tracking-wide text-gray-400">
                        {profile.subscription.plan}
                      </span>
                      <StatusBadge status={profile.subscription.status} />
                    </span>
                  ) : undefined
                }
              >
                <form onSubmit={handleSaveProfile}>
                  <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <Field id="school-name" label="School Name" value={name} onChange={setName} />
                    <Field
                      id="school-code"
                      label="School Code"
                      value={profile?.code ?? ''}
                      onChange={() => undefined}
                      disabled
                    />
                    <Field
                      id="school-email"
                      label="Contact Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                    />
                    <Field id="school-phone" label="Contact Phone" value={phone} onChange={setPhone} />
                    <div className="sm:col-span-2">
                      <Field id="school-address" label="Address" value={address} onChange={setAddress} />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={saving === 'profile'}
                        className="btn-primary disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {saving === 'profile' ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            )}

            {tab === 'grading' && (
              <Card
                title="Grading Scale"
                subtitle="5-point grading system for higher institution result computation"
                action={
                  <button
                    type="button"
                    onClick={addGradeBand}
                    className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Grade
                  </button>
                }
              >
                <div className="overflow-x-auto p-5">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Grade', 'Min Score', 'Max Score', 'Grade Point', 'Remark', 'Actions'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gradeBands.map((band, i) => (
                        <tr key={i} className="odd:bg-white even:bg-gray-50/60">
                          <td className="px-4 py-2.5">
                            {editingGrade === i ? (
                              <input
                                value={band.grade}
                                onChange={(e) => updateGradeBand(i, 'grade', e.target.value)}
                                className="input w-16 px-2 py-1 text-center"
                                maxLength={2}
                              />
                            ) : (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand/10 text-sm font-bold text-brand">
                                {band.grade}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {editingGrade === i ? (
                              <input
                                type="number"
                                value={band.min}
                                onChange={(e) => updateGradeBand(i, 'min', Number(e.target.value))}
                                className="input w-20 px-2 py-1"
                                min={0}
                                max={100}
                              />
                            ) : (
                              <span className="text-gray-700">{band.min}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {editingGrade === i ? (
                              <input
                                type="number"
                                value={band.max}
                                onChange={(e) => updateGradeBand(i, 'max', Number(e.target.value))}
                                className="input w-20 px-2 py-1"
                                min={0}
                                max={100}
                              />
                            ) : (
                              <span className="text-gray-700">{band.max}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {editingGrade === i ? (
                              <input
                                type="number"
                                value={band.point}
                                onChange={(e) => updateGradeBand(i, 'point', Number(e.target.value))}
                                className="input w-20 px-2 py-1"
                                min={0}
                                max={5}
                                step={0.5}
                              />
                            ) : (
                              <span className="font-semibold text-gray-900">{band.point}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {editingGrade === i ? (
                              <input
                                value={band.remark}
                                onChange={(e) => updateGradeBand(i, 'remark', e.target.value)}
                                className="input px-2 py-1"
                              />
                            ) : (
                              <span className="text-gray-500">{band.remark}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              {editingGrade === i ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingGrade(null)}
                                  className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                                  title="Done editing"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingGrade(i)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteGradeBand(i)}
                                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Click the pencil icon to edit a grade band, or add new ones.
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveGrading}
                      disabled={saving === 'grading'}
                      className="btn-primary disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {saving === 'grading' ? 'Saving…' : 'Save Grading Scale'}
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
