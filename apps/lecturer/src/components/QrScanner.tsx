'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

interface QrScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
  className?: string;
}

/**
 * Reusable QR code scanner component wrapping html5-qrcode.
 * Renders a camera viewfinder with a guided scanning region.
 */
export default function QrScanner({ onScan, onError, isActive, className = '' }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const scannerId = `qr-scanner-${Date.now()}`;
    containerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId, { verbose: false });
    scannerRef.current = scanner;
    setCameraError(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    scanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Debounce: ignore the same code scanned within 2 seconds
          const now = Date.now();
          if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 2000) {
            return;
          }
          lastScanRef.current = decodedText;
          lastScanTimeRef.current = now;
          onScan(decodedText);
        },
        (_error: any) => {
          // Scan in progress — no QR found in this frame (ignore)
        },
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        const message =
          typeof err === 'string'
            ? err
            : err instanceof Error
              ? err.message
              : 'Failed to start camera.';

        if (message.includes('NotAllowedError') || message.includes('Permission')) {
          setCameraError('Camera access was denied. Please allow camera permission in your browser settings.');
        } else if (message.includes('NotFoundError') || message.includes('No camera')) {
          setCameraError('No camera found on this device.');
        } else {
          setCameraError(message);
        }
        onError?.(message);
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {
          // Ignore cleanup errors
        })
        .finally(() => {
          scannerRef.current = null;
          setIsScanning(false);
        });
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 border-slate-200 bg-black ${className}`}>
      {/* Scanner container — html5-qrcode renders its video here */}
      <div ref={containerRef} className="w-full" />

      {/* Overlay states */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white">
          <Camera className="mb-2 h-10 w-10 text-slate-400" />
          <p className="text-sm font-medium text-slate-300">Camera is off</p>
          <p className="mt-1 text-xs text-slate-500">Press &quot;Start Scanner&quot; to begin</p>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 px-6 text-center text-white">
          <CameraOff className="mb-2 h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-red-300">{cameraError}</p>
        </div>
      )}

      {isScanning && !cameraError && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            Point camera at student ID card QR code
          </span>
        </div>
      )}
    </div>
  );
}
