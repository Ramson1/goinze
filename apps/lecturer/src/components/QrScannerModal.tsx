'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertCircle, Loader2, Camera, CameraOff } from 'lucide-react';
import QrScanner from './QrScanner';
import type { QrScanResult } from '@/lib/api';
import { cn } from '@/lib/cn';

interface ScannedStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  matricNumber: string | null;
  time: string;
  duplicate: boolean;
}

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onScanSuccess: (result: QrScanResult) => void;
  onScanError: (error: string) => void;
}

/**
 * Full-screen modal for QR scanning with real-time student feedback.
 * Each successful scan calls the backend immediately and shows a confirmation card.
 */
export default function QrScannerModal({
  open,
  onClose,
  courseId,
  onScanSuccess,
  onScanError,
}: QrScannerModalProps) {
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [processing, setProcessing] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ type: 'success' | 'duplicate' | 'error'; message: string } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setScannedStudents([]);
      setLastFeedback(null);
      setProcessing(false);
      // Auto-start scanner after a brief delay for the DOM to render
      const timer = setTimeout(() => setScannerActive(true), 300);
      return () => clearTimeout(timer);
    } else {
      setScannerActive(false);
    }
  }, [open]);

  // Auto-dismiss feedback after 2.5 seconds
  useEffect(() => {
    if (!lastFeedback) return;
    const timer = setTimeout(() => setLastFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [lastFeedback]);

  const handleScanDirect = useCallback(async (qrData: string) => {
    if (processing || !courseId) return;
    setProcessing(true);
    setLastFeedback(null);

    try {
      // Import the API dynamically to avoid circular deps
      const { lecturerApi } = await import('@/lib/api');
      const result = await lecturerApi.scanQr(qrData, courseId);

      const scanned: ScannedStudent = {
        studentId: result.student.id,
        firstName: result.student.firstName,
        lastName: result.student.lastName,
        matricNumber: result.student.matricNumber,
        time: new Date().toLocaleTimeString(),
        duplicate: result.duplicate,
      };

      setScannedStudents((prev) => {
        // Avoid adding duplicates to the list
        if (prev.some((s) => s.studentId === scanned.studentId)) return prev;
        return [scanned, ...prev];
      });

      if (result.duplicate) {
        setLastFeedback({
          type: 'duplicate',
          message: `${result.student.firstName} ${result.student.lastName} — already marked today`,
        });
      } else {
        setLastFeedback({
          type: 'success',
          message: `${result.student.firstName} ${result.student.lastName} — Present ✓`,
        });
      }

      onScanSuccess(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid QR code';
      setLastFeedback({ type: 'error', message: msg });
      onScanError(msg);
    } finally {
      setProcessing(false);
    }
  }, [processing, courseId, onScanSuccess, onScanError]);

  if (!open) return null;

  const uniqueCount = scannedStudents.filter((s) => !s.duplicate).length;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
        <div className="flex items-center gap-3">
          <Camera className="h-5 w-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Scan Student ID</h2>
          <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
            {uniqueCount} scanned
          </span>
        </div>
        <button
          onClick={() => {
            setScannerActive(false);
            onClose();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Camera view */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <QrScanner
            isActive={scannerActive}
            onScan={handleScanDirect}
            className="h-[320px] w-full max-w-md lg:h-[400px]"
          />

          {/* Scanner controls */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setScannerActive((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
                scannerActive
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              {scannerActive ? (
                <>
                  <CameraOff className="h-4 w-4" /> Stop Scanner
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" /> Start Scanner
                </>
              )}
            </button>
            {processing && (
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
              </span>
            )}
          </div>

          {/* Feedback toast */}
          {lastFeedback && (
            <div
              className={cn(
                'mt-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                lastFeedback.type === 'success' && 'bg-emerald-500/20 text-emerald-300',
                lastFeedback.type === 'duplicate' && 'bg-amber-500/20 text-amber-300',
                lastFeedback.type === 'error' && 'bg-red-500/20 text-red-300',
              )}
            >
              {lastFeedback.type === 'success' && <Check className="h-4 w-4" />}
              {lastFeedback.type === 'duplicate' && <AlertCircle className="h-4 w-4" />}
              {lastFeedback.type === 'error' && <AlertCircle className="h-4 w-4" />}
              {lastFeedback.message}
            </div>
          )}
        </div>

        {/* Scanned students list */}
        <div className="flex w-full flex-col border-t border-slate-700 lg:w-80 lg:border-l lg:border-t-0">
          <div className="border-b border-slate-700 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">
              Scanned Students ({uniqueCount})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {scannedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <Camera className="mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-500">No students scanned yet</p>
                <p className="mt-1 text-xs text-slate-600">
                  Start the scanner and hold student ID cards in front of the camera
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {scannedStudents.map((s) => (
                  <div key={s.studentId} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        s.duplicate
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400',
                      )}
                    >
                      {s.duplicate ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.matricNumber ?? '—'} · {s.time}
                      </p>
                    </div>
                    {s.duplicate && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                        Duplicate
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
