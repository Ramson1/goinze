'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Search, AlertCircle, GraduationCap, Printer, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { studentApi, resultsApi, type ResultsResponse, type SemesterResult } from '@/lib/api';
import { computeGpa, resolveGrade } from '@goinze/shared-utils';

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function ResultCheckerPage() {
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [loadingResults, setLoadingResults] = useState(true);

  const [pin, setPin] = useState('');
  const [session, setSession] = useState('');
  const [semester, setSemester] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SemesterResult | null>(null);

  useEffect(() => {
    studentApi
      .results()
      .then((res) => {
        setResults(res);
        const last = res.semesters[res.semesters.length - 1];
        setSession(last?.session ?? '');
        setSemester(last?.semester ?? '');
      })
      .catch(() => undefined)
      .finally(() => setLoadingResults(false));
  }, []);

  const sessions = results
    ? Array.from(new Set(results.semesters.map((s) => s.session)))
    : [];
  const semesterOptions = results
    ? Array.from(new Set(results.semesters.map((s) => s.semester)))
    : [];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const clean = pin.trim();
    if (!/^\d{4}-\d{4}-\d{4}$/.test(clean)) {
      setError('Enter a valid result PIN in the format 1234-5678-9012.');
      return;
    }
    if (!results) return;

    setChecking(true);
    try {
      await resultsApi.verifyPin({ code: clean });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN verification failed.');
      setChecking(false);
      return;
    }

    const found = results.semesters.find(
      (s) => s.session === session && s.semester === semester,
    );
    setChecking(false);
    if (!found) {
      setError('No result found for the selected session and semester. The result may not be released yet.');
      return;
    }
    setResult(found);
  }

  const gpa = result
    ? computeGpa(result.courses.map((c) => ({ creditUnits: c.units, score: c.score })))
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Result Checker"
        description="Check a semester result using a result-checker PIN."
      />

      {/* Checker form */}
      <Card className="mb-6 p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="pin" className="field-label">
              Result PIN
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234-5678-9012"
                className="input-field pl-10 font-mono"
              />
            </div>
          </div>
          <div>
            <label htmlFor="session" className="field-label">
              Session
            </label>
            <select
              id="session"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="input-field"
              disabled={loadingResults || sessions.length === 0}
            >
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="semester" className="field-label">
              Semester
            </label>
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="input-field"
              disabled={loadingResults || semesterOptions.length === 0}
            >
              {semesterOptions.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)} Semester
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={checking || loadingResults} className="btn-primary disabled:opacity-60">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {checking ? 'Verifying PIN…' : 'Check Result'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Result */}
      {result && gpa && (
        <Card className="print-area overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <GraduationCap className="h-4 w-4 text-brand" />
                {result.session} — {titleCase(result.semester)} Semester ({result.level} Level)
              </h2>
              <p className="text-xs text-slate-500">
                GPA <strong className="text-brand">{gpa.gpa.toFixed(2)}</strong> · {gpa.totalUnits} units ·{' '}
                {gpa.classification}
              </p>
            </div>
            <button onClick={() => window.print()} className="btn-secondary px-3 py-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3 text-center">Units</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-6 py-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.courses.map((c) => {
                  const band = resolveGrade(c.score);
                  return (
                    <tr key={c.code} className="transition hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{c.code}</td>
                      <td className="px-4 py-3.5 text-slate-700">{c.title}</td>
                      <td className="px-4 py-3.5 text-center text-slate-600">{c.units}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{c.score}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-brand">
                          {c.grade ?? band.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!result && (
        <Card className="p-8 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No result loaded yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Enter a valid result PIN and select a session & semester to view a result. PINs are sold at
            the bursary or via the payments page.
          </p>
        </Card>
      )}
    </div>
  );
}
