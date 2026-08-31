'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Check,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { alumniApi, type AlumniRegistration } from '@/lib/api';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DECLINED', label: 'Declined' },
];

export default function AlumniPage() {
  const [registrations, setRegistrations] = useState<AlumniRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alumniApi.list(statusFilter || undefined);
      setRegistrations(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      await alumniApi.approve(id);
      await fetchRegistrations();
    } catch {
      // silently fail
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDecline(id: string) {
    if (!confirm('Are you sure you want to decline this alumni registration?')) return;
    setDecliningId(id);
    try {
      await alumniApi.decline(id);
      await fetchRegistrations();
    } catch {
      // silently fail
    } finally {
      setDecliningId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to permanently delete this record?')) return;
    setDeletingId(id);
    try {
      await alumniApi.delete(id);
      await fetchRegistrations();
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  const pendingCount = registrations.filter((r) => r.status === 'PENDING').length;

  return (
    <>
      <PageHeader
        title="Alumni Registrations"
        subtitle={`Manage alumni registration requests. ${pendingCount > 0 ? `${pendingCount} pending review.` : ''}`}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.value
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchRegistrations}
            className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </Card>

      {loading && registrations.length === 0 ? (
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </Card>
      ) : registrations.length === 0 ? (
        <Card className="py-16 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">No alumni registrations found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <Card key={reg.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm font-bold text-white">
                      {reg.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-900">{reg.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{reg.email}</span>
                      </div>
                    </div>
                    <StatusBadge status={reg.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-brand">
                      <GraduationCap className="h-3 w-3" />
                      {reg.programme}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">
                      <Award className="h-3 w-3" />
                      Class of {reg.graduationYear}
                    </span>
                    {reg.currentRole && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                        {reg.currentRole}
                      </span>
                    )}
                    <span className="text-gray-400">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {reg.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(reg.id)}
                        disabled={approvingId === reg.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-60"
                      >
                        {approvingId === reg.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(reg.id)}
                        disabled={decliningId === reg.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                      >
                        {decliningId === reg.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                        Decline
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(reg.id)}
                    disabled={deletingId === reg.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-60"
                    title="Delete"
                  >
                    {deletingId === reg.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
