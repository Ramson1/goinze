'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  Save,
  X,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_GRADE_BANDS } from '@goinze/shared-utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import {
  authApi,
  settingsApi,
  type SchoolProfile,
} from '@/lib/api';

type TabKey = 'profile' | 'grading' | 'payments' | 'email' | 'security';

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'profile', label: 'School Profile', icon: Building2 },
  { key: 'grading', label: 'Grading', icon: GraduationCap },
  { key: 'payments', label: 'Payment Gateway', icon: CreditCard },
  { key: 'email', label: 'Email / SMS', icon: Mail },
  { key: 'security', label: 'Security', icon: KeyRound },
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
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Gateway form
  const [flwPublic, setFlwPublic] = useState('');
  const [flwSecret, setFlwSecret] = useState('');
  const [flwEnc, setFlwEnc] = useState('');
  const [flwWebhook, setFlwWebhook] = useState('');

  // Email / SMS form
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smsKey, setSmsKey] = useState('');
  const [smsSender, setSmsSender] = useState('');

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
          setWebsite(prof.website ?? '');
          setLogoUrl(prof.logoUrl ?? '');
        }

        const gateway = (settings['gateway.flutterwave'] ?? {}) as Record<string, string>;
        setFlwPublic(gateway.publicKey ?? '');
        setFlwSecret(gateway.secretKey ?? '');
        setFlwEnc(gateway.encryptionKey ?? '');
        setFlwWebhook(gateway.webhookHash ?? '');

        const smtp = (settings['notifications.smtp'] ?? {}) as Record<string, string>;
        setSmtpHost(smtp.host ?? '');
        setSmtpPort(smtp.port ?? '');
        setSmtpUser(smtp.user ?? '');
        setSmtpPass(smtp.password ?? '');

        const sms = (settings['notifications.sms'] ?? {}) as Record<string, string>;
        setSmsKey(sms.apiKey ?? '');
        setSmsSender(sms.senderId ?? '');
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
        website: website.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
      });
      setProfile(updated);
      flash('School profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveGateway(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving('gateway');
    setError(null);
    try {
      await settingsApi.updateMany({
        'gateway.flutterwave': {
          publicKey: flwPublic.trim(),
          secretKey: flwSecret.trim(),
          encryptionKey: flwEnc.trim(),
          webhookHash: flwWebhook.trim(),
        },
      });
      flash('Payment gateway settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save gateway settings.');
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveChannels(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving('channels');
    setError(null);
    try {
      await settingsApi.updateMany({
        'notifications.smtp': {
          host: smtpHost.trim(),
          port: smtpPort.trim(),
          user: smtpUser.trim(),
          password: smtpPass,
        },
        'notifications.sms': {
          apiKey: smsKey.trim(),
          senderId: smsSender.trim(),
        },
      });
      flash('Notification channels saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save channels.');
    } finally {
      setSaving(null);
    }
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }
    setSaving('password');
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      flash('Password changed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure school-wide preferences and integrations." />

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
                    <Field
                      id="school-website"
                      label="Website"
                      value={website}
                      onChange={setWebsite}
                      placeholder="https://…"
                    />
                    <Field
                      id="school-logo"
                      label="Logo URL"
                      value={logoUrl}
                      onChange={setLogoUrl}
                      placeholder="https://…/logo.png"
                    />
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
              <Card title="Grading Scale" subtitle="Default 5-point scale used for result computation">
                <div className="overflow-x-auto p-5">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Grade', 'Min', 'Max', 'Point', 'Remark'].map((h) => (
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
                      {DEFAULT_GRADE_BANDS.map((band) => (
                        <tr key={band.grade} className="odd:bg-white even:bg-gray-50/60">
                          <td className="px-4 py-2.5">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand/10 text-sm font-bold text-brand">
                              {band.grade}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{band.min}</td>
                          <td className="px-4 py-2.5 text-gray-700">{band.max}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{band.point}</td>
                          <td className="px-4 py-2.5 text-gray-500">{band.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs text-gray-400">
                    Grading bands are managed centrally via <code>@goinze/shared-utils</code>.
                    Contact a super admin to modify.
                  </p>
                </div>
              </Card>
            )}

            {tab === 'payments' && (
              <Card title="Payment Gateway" subtitle="Flutterwave integration for online fee collection">
                <form onSubmit={handleSaveGateway}>
                  <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <Field
                      id="flw-public"
                      label="Public Key"
                      value={flwPublic}
                      onChange={setFlwPublic}
                      placeholder="FLWPUBK-…"
                    />
                    <Field
                      id="flw-secret"
                      label="Secret Key"
                      type="password"
                      value={flwSecret}
                      onChange={setFlwSecret}
                      placeholder="FLWSECK-…"
                    />
                    <Field
                      id="flw-enc"
                      label="Encryption Key"
                      type="password"
                      value={flwEnc}
                      onChange={setFlwEnc}
                    />
                    <Field
                      id="flw-webhook"
                      label="Webhook Hash"
                      type="password"
                      value={flwWebhook}
                      onChange={setFlwWebhook}
                    />
                    <p className="text-xs text-gray-400 sm:col-span-2">
                      Keys are stored per school for the payment service. In production, prefer
                      provisioning secrets via environment variables on the server.
                    </p>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={saving === 'gateway'}
                        className="btn-primary disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {saving === 'gateway' ? 'Saving…' : 'Save Gateway Settings'}
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            )}

            {tab === 'email' && (
              <Card title="Email / SMS" subtitle="Outbound notification channels">
                <form onSubmit={handleSaveChannels}>
                  <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <Field id="smtp-host" label="SMTP Host" value={smtpHost} onChange={setSmtpHost} />
                    <Field id="smtp-port" label="SMTP Port" value={smtpPort} onChange={setSmtpPort} />
                    <Field id="smtp-user" label="SMTP User" value={smtpUser} onChange={setSmtpUser} />
                    <Field
                      id="smtp-pass"
                      label="SMTP Password"
                      type="password"
                      value={smtpPass}
                      onChange={setSmtpPass}
                    />
                    <Field
                      id="sms-key"
                      label="SMS API Key"
                      type="password"
                      value={smsKey}
                      onChange={setSmsKey}
                    />
                    <Field id="sms-sender" label="SMS Sender ID" value={smsSender} onChange={setSmsSender} />
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={saving === 'channels'}
                        className="btn-primary disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {saving === 'channels' ? 'Saving…' : 'Save Channels'}
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            )}

            {tab === 'security' && (
              <div className="space-y-6">
                <Card title="Change Password" subtitle="Update the password for your admin account">
                  <form onSubmit={handleChangePassword}>
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field
                          id="current-password"
                          label="Current Password"
                          type="password"
                          value={currentPassword}
                          onChange={setCurrentPassword}
                        />
                      </div>
                      <Field
                        id="new-password"
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={setNewPassword}
                      />
                      <Field
                        id="confirm-password"
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                      />
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          disabled={saving === 'password'}
                          className="btn-primary disabled:opacity-60"
                        >
                          <KeyRound className="h-4 w-4" />
                          {saving === 'password' ? 'Updating…' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  </form>
                </Card>

                <Card title="Platform Security" subtitle="Managed by the platform team">
                  <div className="p-5 text-sm leading-relaxed text-gray-500">
                    JWT signing secrets, token lifetimes and sign-in attempt limits are configured
                    centrally via server environment variables and apply to every school on the
                    platform. Contact your platform administrator to adjust these policies.
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
