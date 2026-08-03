"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Search, Upload } from "lucide-react";
import {
  academicsApi,
  admissionsApi,
  ApiError,
  type ApplyResult,
  type ProgrammeRecord,
  type TrackResult,
} from "@/lib/api";

const inputClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted — under review",
  UNDER_REVIEW: "Under review",
  INTERVIEW: "Interview scheduled",
  APPROVED: "Approved — pay acceptance fee",
  REJECTED: "Not successful",
  ADMITTED: "Admitted",
};

/** Split "Jane Mary Doe" into first / middle / last. */
function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
  const middleName = parts.slice(1, -1).join(" ") || undefined;
  return { firstName, lastName, middleName };
}

export default function AdmissionForm() {
  // Programme options loaded from the live academics API.
  const [programmes, setProgrammes] = useState<ProgrammeRecord[]>([]);

  // Apply form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);

  useEffect(() => {
    let active = true;
    academicsApi
      .programmes()
      .then((res) => active && setProgrammes(res))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Tracking state
  const [trackNo, setTrackNo] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { firstName, lastName, middleName } = splitName(fullName);
      const res = await admissionsApi.apply({
        schoolSlug: "goinze-demo",
        firstName,
        lastName,
        middleName,
        email,
        phone,
        programmeId: programmeId || undefined,
      });
      setResult(res);
      setTrackNo(res.applicationNo);
      setTrackEmail(email);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to submit right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setTracking(true);
    setTrackError(null);
    setTrackResult(null);
    try {
      const res = await admissionsApi.track(trackNo, trackEmail);
      setTrackResult(res);
    } catch (err) {
      setTrackError(
        err instanceof ApiError ? err.message : "Unable to look up that application.",
      );
    } finally {
      setTracking(false);
    }
  }

  function resetForm() {
    setResult(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setProgrammeId("");
    setFileName(null);
    setError(null);
  }

  return (
    <div className="space-y-10">
      {/* ---- Application form / success ---- */}
      {result ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
          <h3 className="mt-4 text-xl font-bold text-slate-900">Application received!</h3>
          <p className="mt-2 text-sm text-slate-600">
            Thank you for applying to {result.schoolName}. Save your application
            number — you&apos;ll need it to track your status and pay the acceptance fee.
          </p>
          <div className="mx-auto mt-5 inline-block rounded-lg border border-blue-200 bg-white px-6 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Application Number</p>
            <p className="font-mono text-lg font-bold text-brand">{result.applicationNo}</p>
          </div>
          <div className="mt-6">
            <button
              onClick={resetForm}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Submit another application
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="app-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="app-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Mary Doe"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="app-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                id="app-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="app-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="app-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0810 557 6617"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="app-programme" className="mb-1.5 block text-sm font-medium text-slate-700">
                Programme of Interest
              </label>
              <select
                id="app-programme"
                required
                value={programmeId}
                onChange={(e) => setProgrammeId(e.target.value)}
                className={inputClasses}
              >
                <option value="" disabled>
                  {programmes.length === 0 ? "Loading programmes…" : "Select a programme"}
                </option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Supporting Documents (optional)
            </span>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5 transition-colors hover:border-brand hover:bg-blue-50">
              <Upload className="h-5 w-5 shrink-0 text-brand" />
              <span className="text-sm text-slate-600">
                {fileName ?? "Attach transcripts / certificates (PDF, JPG)"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Your application is submitted securely to the admissions office.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      )}

      {/* ---- Status tracking ---- */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Search className="h-4 w-4 text-brand" /> Track your application
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Enter your application number and the email you applied with.
        </p>
        <form
          onSubmit={handleTrack}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            value={trackNo}
            onChange={(e) => setTrackNo(e.target.value)}
            required
            placeholder="Application number (e.g. APP/2026/0001234)"
            className={inputClasses}
          />
          <input
            type="email"
            value={trackEmail}
            onChange={(e) => setTrackEmail(e.target.value)}
            required
            placeholder="Email used to apply"
            className={inputClasses}
          />
          <button
            type="submit"
            disabled={tracking}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {tracking && <Loader2 className="h-4 w-4 animate-spin" />}
            Track
          </button>
        </form>

        {trackError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {trackError}
          </p>
        )}

        {trackResult && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{trackResult.applicantName}</p>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">
                {STATUS_LABEL[trackResult.status] ?? trackResult.status}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">Application No.</dt>
                <dd className="font-mono text-slate-800">{trackResult.applicationNo}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Acceptance Fee</dt>
                <dd className="text-slate-800">
                  {trackResult.acceptanceFeePaid ? "Paid" : "Not paid"}
                </dd>
              </div>
              {trackResult.student?.matricNumber && (
                <div>
                  <dt className="text-slate-400">Matric Number</dt>
                  <dd className="font-mono text-slate-800">
                    {trackResult.student.matricNumber}
                  </dd>
                </div>
              )}
            </dl>
            {trackResult.admissionLetterUrl && (
              <a
                href={trackResult.admissionLetterUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                View admission letter
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
