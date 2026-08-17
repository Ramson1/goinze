'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Check,
  Eye,
  FileText,
  Key,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  admissionsApi,
  academicsApi,
  ApiError,
  type ApplicationRecord,
  type Programme,
  type DepartmentFull,
} from '@/lib/api';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ADMITTED', label: 'Admitted' },
  { value: 'REJECTED', label: 'Rejected' },
];

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

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

const reviewable = new Set(['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW']);

interface ApprovalTarget {
  application: ApplicationRecord;
  programmeId: string;
  departmentId: string;
}

export default function AdmissionsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [rows, setRows] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewingApplication, setViewingApplication] = useState<ApplicationRecord | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<ApprovalTarget | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<DepartmentFull[]>([]);
  const [approving, setApproving] = useState(false);
  const [verification, setVerification] = useState({
    verificationDocumentsReviewed: false,
    verificationDocumentsMatch: false,
    verificationCourseApproved: false,
  });
  const [savingVerification, setSavingVerification] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Check user role on mount
  useEffect(() => {
    const token = getCookie('access_token');
    const role = token ? decodeRoleFromToken(token) : null;
    setIsSuperAdmin(role === 'SUPER_ADMIN');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await admissionsApi.list({
        search: search || undefined,
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
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    academicsApi.programmes().then(setProgrammes).catch(() => setProgrammes([]));
    academicsApi.departments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

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

  const onApprove = (r: ApplicationRecord) => {
    setApprovalTarget({
      application: r,
      programmeId: r.programmeId ?? '',
      departmentId: r.departmentId ?? '',
    });
  };

  const handleConfirmApprove = async () => {
    if (!approvalTarget) return;
    setApproving(true);
    setNotice(null);
    try {
      const updated = await admissionsApi.approve(approvalTarget.application.id, {
        programmeId: approvalTarget.programmeId || undefined,
        departmentId: approvalTarget.departmentId || undefined,
      });
      patchRow(updated);
      setNotice(`Approved — student provisioned for ${approvalTarget.application.applicationNo}.`);
      setApprovalTarget(null);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  const onReject = (r: ApplicationRecord) =>
    run(r.id, () => admissionsApi.reject(r.id), `Application ${r.applicationNo} rejected.`);

  const onLetter = (r: ApplicationRecord) =>
    run(r.id, () => admissionsApi.generateLetter(r.id), 'Admission letter generated and sent.');

  const onSendLetter = async (r: ApplicationRecord) => {
    setBusyId(r.id);
    setNotice(null);
    try {
      const res = await admissionsApi.sendLetterEmail(r.id);
      setNotice(res.message);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Failed to send letter email.');
    } finally {
      setBusyId(null);
    }
  };

  const onCreatePassword = async (r: ApplicationRecord) => {
    setBusyId(r.id);
    setError(null);
    try {
      const res = await admissionsApi.createStudentPassword(r.id);
      setNotice(`Password created: ${res.tempPassword} — share this with the student.`);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Failed to create password.');
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = (r: ApplicationRecord) => {
    setConfirmDialog({
      message: `Delete application ${r.applicationNo} (${r.firstName} ${r.lastName})? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setBusyId(r.id);
        setNotice(null);
        try {
          const res = await admissionsApi.remove(r.id);
          setNotice(res.message);
          setRows((prev) => prev.filter((row) => row.id !== r.id));
        } catch (err) {
          setNotice(err instanceof ApiError ? err.message : 'Failed to delete application.');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleVerificationChange = async (
    field: keyof typeof verification,
    value: boolean,
  ) => {
    if (!viewingApplication) return;
    const updated = { ...verification, [field]: value };
    setVerification(updated);
    setSavingVerification(true);
    try {
      await admissionsApi.updateVerification(viewingApplication.id, updated);
      setViewingApplication({ ...viewingApplication, ...updated });
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Failed to save verification.');
      setVerification(verification);
    } finally {
      setSavingVerification(false);
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

            {(r.status === 'APPROVED' || r.status === 'ADMITTED') && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onLetter(r)}
                  className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5" /> Letter
                </button>
                {r.admissionLetterUrl && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSendLetter(r)}
                    className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
                    title="Send admission letter email to the student"
                  >
                    <Mail className="h-3.5 w-3.5" /> Send
                  </button>
                )}
                {r.student && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onCreatePassword(r)}
                    className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
                    title="Create a temporary password for the student portal"
                  >
                    <Key className="h-3.5 w-3.5" /> Password
                  </button>
                )}
              </>
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

            <button
              type="button"
              onClick={async () => {
                try {
                  const full = await admissionsApi.get(r.id);
                  setViewingApplication(full);
                  setVerification({
                    verificationDocumentsReviewed: full.verificationDocumentsReviewed ?? false,
                    verificationDocumentsMatch: full.verificationDocumentsMatch ?? false,
                    verificationCourseApproved: full.verificationCourseApproved ?? false,
                  });
                } catch (err) {
                  setNotice(err instanceof ApiError ? err.message : 'Failed to load application details.');
                }
              }}
              className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs"
            >
              <Eye className="h-3.5 w-3.5" /> Details
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(r)}
                className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                title="Delete this application"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
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

      {/* Application Detail Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-5xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-500">{viewingApplication.applicationNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingApplication(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-5">
              {/* Personal Information */}
              <section className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Personal Information</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
                  <Field label="Surname" value={viewingApplication.lastName} />
                  <Field label="Other Names" value={`${viewingApplication.firstName} ${viewingApplication.middleName ?? ''}`} />
                  <Field label="Date of Birth" value={viewingApplication.dateOfBirth ? new Date(viewingApplication.dateOfBirth).toLocaleDateString() : null} />
                  <Field label="Sex" value={viewingApplication.gender} />
                  <Field label="Marital Status" value={viewingApplication.maritalStatus} />
                  <Field label="State of Origin" value={viewingApplication.stateOfOrigin} />
                  <Field label="Local Government" value={viewingApplication.localGovernment} />
                  <Field label="GSM Number" value={viewingApplication.phone} />
                  <Field label="Email" value={viewingApplication.email} />
                  <Field label="Postal Address" value={viewingApplication.postalAddress} />
                  <Field label="Home Address" value={viewingApplication.homeAddress} />
                  <Field label="Guardian/Sponsor" value={viewingApplication.guardianName} />
                  <Field label="Guardian Phone" value={viewingApplication.guardianPhone} />
                  <Field label="Guardian GSM" value={viewingApplication.guardianGsm} />
                  <Field label="Medical History" value={viewingApplication.medicalHistory} />
                </div>
              </section>

              {/* Programme Choices */}
              <section className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Programme Choices</h3>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <Field label="First Choice" value={viewingApplication.firstChoice} />
                  <Field label="Second Choice" value={viewingApplication.secondChoice} />
                  <Field label="Third Choice" value={viewingApplication.thirdChoice} />
                </div>
              </section>

              {/* Schools Attended */}
              {viewingApplication.educationData?.schools && viewingApplication.educationData.schools.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Schools Attended</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">School Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">From</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">To</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Certificate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewingApplication.educationData.schools.map((s, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{s.schoolName}</td>
                            <td className="px-3 py-2">{s.from}</td>
                            <td className="px-3 py-2">{s.to}</td>
                            <td className="px-3 py-2">{s.certificate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* O'Level Results */}
              {viewingApplication.educationData?.olevelResults && viewingApplication.educationData.olevelResults.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">O&apos; Level Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Examination</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Centre No.</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Subject</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Grade</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Year</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewingApplication.educationData.olevelResults.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{r.examination}</td>
                            <td className="px-3 py-2">{r.centreNo}</td>
                            <td className="px-3 py-2">{r.subject}</td>
                            <td className="px-3 py-2">{r.grade}</td>
                            <td className="px-3 py-2">{r.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* A'Level Results */}
              {viewingApplication.educationData?.alevelResults && viewingApplication.educationData.alevelResults.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">A&apos; Level Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Institution</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">From</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">To</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Programme</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Qualification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewingApplication.educationData.alevelResults.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{r.institution}</td>
                            <td className="px-3 py-2">{r.from}</td>
                            <td className="px-3 py-2">{r.to}</td>
                            <td className="px-3 py-2">{r.programme}</td>
                            <td className="px-3 py-2">{r.qualification}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Employment Records */}
              {viewingApplication.educationData?.employmentRecords && viewingApplication.educationData.employmentRecords.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Employment Records</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Employer</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Position</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">From</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">To</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewingApplication.educationData.employmentRecords.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{r.employer}</td>
                            <td className="px-3 py-2">{r.position}</td>
                            <td className="px-3 py-2">{r.from}</td>
                            <td className="px-3 py-2">{r.to}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Uploaded Documents */}
              {viewingApplication.documents && viewingApplication.documents.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    {viewingApplication.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-blue-600 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{doc.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{doc.type}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Declaration */}
              <section className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Declaration</h3>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <Field label="Agreed" value={viewingApplication.declarationAgreed ? 'Yes' : 'No'} />
                  <Field label="Signed By" value={viewingApplication.declarationName} />
                  <Field label="Date" value={viewingApplication.declarationDate ? new Date(viewingApplication.declarationDate).toLocaleDateString() : null} />
                </div>
              </section>

              {/* Office Use Only */}
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-700">Office Use Only — Verification Checklist</h3>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={verification.verificationDocumentsReviewed}
                      onChange={(e) => handleVerificationChange('verificationDocumentsReviewed', e.target.checked)}
                      disabled={savingVerification}
                    />
                    <span>Supporting documents reviewed (if submitted)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={verification.verificationDocumentsMatch}
                      onChange={(e) => handleVerificationChange('verificationDocumentsMatch', e.target.checked)}
                      disabled={savingVerification}
                    />
                    <span>Documents agree with form information</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={verification.verificationCourseApproved}
                      onChange={(e) => handleVerificationChange('verificationCourseApproved', e.target.checked)}
                      disabled={savingVerification}
                    />
                    <span>Approved course of study</span>
                  </label>
                </div>
                {savingVerification && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </div>
                )}
              </section>
            </div>

            <div className="flex justify-end border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setViewingApplication(null)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Approve Application</h2>
                <p className="text-sm text-gray-500">
                  {approvalTarget.application.firstName} {approvalTarget.application.lastName} —{' '}
                  {approvalTarget.application.applicationNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovalTarget(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {/* Course choices from application */}
              {(approvalTarget.application.firstChoice ||
                approvalTarget.application.secondChoice ||
                approvalTarget.application.thirdChoice) && (
                <div>
                  <label className="label font-semibold text-gray-700">Applicant&apos;s Course Choices</label>
                  <div className="space-y-1 text-sm text-gray-600">
                    {approvalTarget.application.firstChoice && (
                      <p>1st Choice: <span className="font-medium text-gray-900">{approvalTarget.application.firstChoice}</span></p>
                    )}
                    {approvalTarget.application.secondChoice && (
                      <p>2nd Choice: <span className="font-medium text-gray-900">{approvalTarget.application.secondChoice}</span></p>
                    )}
                    {approvalTarget.application.thirdChoice && (
                      <p>3rd Choice: <span className="font-medium text-gray-900">{approvalTarget.application.thirdChoice}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Programme selection */}
              <div>
                <label className="label">Programme</label>
                <select
                  value={approvalTarget.programmeId}
                  onChange={(e) =>
                    setApprovalTarget((prev) =>
                      prev ? { ...prev, programmeId: e.target.value } : prev,
                    )
                  }
                  className="input"
                >
                  <option value="">— Select Programme —</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department selection */}
              <div>
                <label className="label">Department</label>
                <select
                  value={approvalTarget.departmentId}
                  onChange={(e) =>
                    setApprovalTarget((prev) =>
                      prev ? { ...prev, departmentId: e.target.value } : prev,
                    )
                  }
                  className="input"
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setApprovalTarget(null)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approving}
                className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-60"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm dialog ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="pt-1.5 text-sm text-slate-700">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string | null | boolean }) {
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{display || <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}
