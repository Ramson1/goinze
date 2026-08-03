'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  UserCheck,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  admissionsApi,
  financeApi,
  ApiError,
  type ApplicationRecord,
} from '@/lib/api';

const ACCEPTANCE_FEE = 50000; // NGN — demo acceptance fee amount

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ADMITTED', label: 'Admitted' },
  { value: 'REJECTED', label: 'Rejected' },
];

const reviewable = new Set(['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW']);

export default function AdmissionsPage() {
  const [rows, setRows] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await admissionsApi.list({
        status: status || undefined,
        pageSize: 50,
      });
      setRows(res.items);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load applications. Is the API running on port 4000?',
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  function patchRow(updated: ApplicationRecord) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  }

  async function run(id: string, fn: () => Promise<ApplicationRecord>, successMsg: string) {
    setBusyId(id);
    setNotice(null);
    try {
      const updated = await fn();
      patchRow(updated);
      setNotice(successMsg);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  const onApprove = (r: ApplicationRecord) =>
    run(r.id, () => admissionsApi.approve(r.id), `Approved — student provisioned for ${r.applicationNo}.`);

  const onReject = (r: ApplicationRecord) =>
    run(r.id, () => admissionsApi.reject(r.id), `Application ${r.applicationNo} rejected.`);

  const onLetter = (r: ApplicationRecord) =>
    run(r.id, () => admissionsApi.generateLetter(r.id), 'Admission letter generated.');

  // Simulate the applicant paying the acceptance fee, then finalize admission.
  const onCollectFeeAndAdmit = async (r: ApplicationRecord) => {
    setBusyId(r.id);
    setNotice(null);
    try {
      const init = await financeApi.initAcceptanceFee(
        r.id,
        ACCEPTANCE_FEE,
        typeof window !== 'undefined' ? window.location.origin : undefined,
      );
      await financeApi.verify(init.reference);
      const updated = await admissionsApi.admit(r.id);
      patchRow(updated);
      setNotice(`Acceptance fee recorded — ${r.applicationNo} admitted & student activated.`);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Payment/admission failed.');
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<ApplicationRecord>[] = [
    {
      key: 'applicationNo',
      header: 'App No',
      className: 'font-mono text-xs',
      render: (r) => <span className="font-mono text-xs">{r.applicationNo}</span>,
    },
    {
      key: 'name',
      header: 'Applicant',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">
            {r.firstName} {r.lastName}
          </p>
          <p className="text-xs text-gray-400">{r.email}</p>
        </div>
      ),
    },
    {
      key: 'matric',
      header: 'Matric No',
      render: (r) =>
        r.student?.matricNumber ? (
          <span className="font-mono text-xs text-gray-700">{r.student.matricNumber}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: 'fee',
      header: 'Acceptance Fee',
      render: (r) =>
        r.acceptanceFeePaid ? (
          <span className="text-xs font-medium text-emerald-600">Paid</span>
        ) : (
          <span className="text-xs text-gray-400">Unpaid</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status.replace(/_/g, ' ')} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => {
        const busy = busyId === r.id;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {reviewable.has(r.status) && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onApprove(r)}
                  className="btn-primary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(r)}
                  className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </>
            )}

            {r.status === 'APPROVED' && !r.acceptanceFeePaid && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCollectFeeAndAdmit(r)}
                className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
              >
                <UserCheck className="h-3.5 w-3.5" /> Collect fee & admit
              </button>
            )}

            {(r.status === 'APPROVED' || r.status === 'ADMITTED') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onLetter(r)}
                className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5" /> Letter
              </button>
            )}

            {r.admissionLetterUrl && (
              <a
                href={r.admissionLetterUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-brand hover:underline"
              >
                View
              </a>
            )}

            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle="Review applications, approve & provision students, collect the acceptance fee, and admit."
        action={
          <button onClick={load} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input w-auto min-w-[180px]"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading applications…
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            keyField="id"
            emptyMessage="No applications yet. Submit one from the public website's Apply Now form."
          />
        )}
      </Card>
    </>
  );
}
