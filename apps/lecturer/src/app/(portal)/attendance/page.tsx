'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ClipboardCheck,
  Loader2,
  QrCode,
  Save,
  ScanLine,
  X,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import {
  lecturerApi,
  type AllocatedCourse,
  type RosterStudent,
} from '@/lib/api';
import { cn } from '@/lib/cn';

type AttendanceMode = 'Manual' | 'QR' | 'Digital ID';

export default function AttendancePage() {
  const [courses, setCourses] = useState<AllocatedCourse[]>([]);
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<AttendanceMode>('Manual');
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [records, setRecords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lecturerApi
      .courses()
      .then((list) => {
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses.'));
  }, []);

  // Load roster + existing attendance whenever course/date changes.
  const load = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    Promise.all([
      lecturerApi.roster(courseId),
      lecturerApi.attendance(courseId, date).catch(() => []),
    ])
      .then(([ros, existing]) => {
        setRoster(ros.students);
        const map: Record<string, boolean> = {};
        for (const s of ros.students) map[s.studentId] = true; // default present
        for (const rec of existing) map[rec.studentId] = rec.status === 'PRESENT';
        setRecords(map);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load roster.'))
      .finally(() => setLoading(false));
  }, [courseId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const presentCount = roster.filter((s) => records[s.studentId] !== false).length;
  const selectedCourse = courses.find((c) => c.id === courseId);

  function setStatus(studentId: string, present: boolean) {
    setSaved(false);
    setRecords((prev) => ({ ...prev, [studentId]: present }));
  }

  function markAll(present: boolean) {
    setSaved(false);
    const next: Record<string, boolean> = {};
    for (const s of roster) next[s.studentId] = present;
    setRecords(next);
  }

  async function handleSave() {
    if (!courseId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await lecturerApi.markAttendance(
        courseId,
        date,
        roster.map((s) => ({
          studentId: s.studentId,
          status: records[s.studentId] !== false ? 'PRESENT' : 'ABSENT',
        })),
      );
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark and track attendance for your classes." />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Controls */}
      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="label">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="input"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Mode toggle */}
          <div>
            <label className="label">Mode</label>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(['Manual', 'QR', 'Digital ID'] as AttendanceMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    mode === m
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {m === 'QR' ? (
                    <QrCode className="h-4 w-4" />
                  ) : m === 'Digital ID' ? (
                    <ScanLine className="h-4 w-4" />
                  ) : (
                    <ClipboardCheck className="h-4 w-4" />
                  )}
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || mode !== 'Manual'}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Attendance
          </button>
        </CardBody>
      </Card>

      {mode !== 'Manual' ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              {mode === 'QR' ? <QrCode className="h-8 w-8" /> : <ScanLine className="h-8 w-8" />}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {mode === 'QR' ? 'QR Attendance' : 'Digital ID Mode'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {mode === 'QR'
                ? 'Display the class QR code and let students scan in. Attendance syncs automatically as they check in.'
                : 'Students tap their digital ID card on the reader to check in. Attendance syncs automatically.'}
            </p>
            <span className="mt-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Coming soon — stub for hardware / mobile integration
            </span>
          </CardBody>
        </Card>
      ) : loading ? (
        <Card>
          <CardBody className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading roster…
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={`${selectedCourse?.code ?? ''} — ${date}`}
            subtitle={`${presentCount} of ${roster.length} present`}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAll(true)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Mark all present
                </button>
                <button
                  type="button"
                  onClick={() => markAll(false)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Mark all absent
                </button>
              </div>
            }
          />
          <CardBody className="divide-y divide-slate-100 px-0 py-0">
            {roster.map((s) => {
              const present = records[s.studentId] !== false;
              const name = `${s.firstName} ${s.lastName}`;
              return (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                      {name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">{s.matricNo ?? '—'}</p>
                    </div>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => setStatus(s.studentId, true)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                        present
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      <Check className="h-3.5 w-3.5" /> Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(s.studentId, false)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                        !present
                          ? 'bg-red-500 text-white'
                          : 'text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      <X className="h-3.5 w-3.5" /> Absent
                    </button>
                  </div>
                </div>
              );
            })}
            {roster.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                No students enrolled in this course.
              </p>
            )}
          </CardBody>
          {saved && (
            <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
              Attendance for {selectedCourse?.code} on {date} saved successfully.
            </div>
          )}
        </Card>
      )}
    </>
  );
}
