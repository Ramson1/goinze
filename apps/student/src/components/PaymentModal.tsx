'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, X, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  email: string;
  txRef: string;
  publicKey: string;
  currency?: string;
  title?: string;
  description?: string;
  onSuccess: (response: FlutterwaveResponse) => void;
  onError: (error: string) => void;
}

export interface FlutterwaveResponse {
  amount: number;
  currency: string;
  customer: { email: string; phone_number: string; name: string };
  tx_ref: string;
  flw_ref: string;
  status: string;
  transaction_id: number;
}

// ---------------------------------------------------------------------------
// Script injection helper
// ---------------------------------------------------------------------------

let scriptPromise: Promise<void> | null = null;

function injectFlutterwaveScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if ((window as any).FlutterwaveCheckout) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave script'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaymentModal({
  open,
  onClose,
  amount,
  email,
  txRef,
  publicKey,
  currency = 'NGN',
  title = 'Goinzeschool Payment',
  description = 'Secure payment via Flutterwave',
  onSuccess,
  onError,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const initiatedRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    initiatedRef.current = false;
    setLoading(false);
    setFailed(false);
  }, [open, txRef]);

  // Trigger Flutterwave checkout when modal opens
  useEffect(() => {
    if (!open || initiatedRef.current) return;
    initiatedRef.current = true;
    setLoading(true);

    const doCheckout = () => {
      const win = window as any;
      if (win.FlutterwaveCheckout) {
        win.FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: txRef,
          amount,
          currency,
          payment_options: 'card, bank_transfer, ussd',
          customer: { email, name: email },
          customizations: { title, description, logo: '' },
          callback(data: any) {
            setLoading(false);
            onSuccess({
              amount: data.amount,
              currency: data.currency,
              customer: data.customer,
              tx_ref: data.tx_ref,
              flw_ref: data.flw_ref,
              status: data.status,
              transaction_id: data.transaction_id,
            });
          },
          onclose() {
            setLoading(false);
            onClose();
          },
        });
      } else {
        setFailed(true);
        setLoading(false);
        onError('Flutterwave checkout could not load. Please try again.');
      }
    };

    injectFlutterwaveScript()
      .then(doCheckout)
      .catch(() => {
        setFailed(true);
        setLoading(false);
        onError('Could not load payment gateway. Please check your connection and try again.');
      });
  }, [open, publicKey, txRef, amount, currency, email, title, description, onSuccess, onError, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Make Payment</h2>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Amount */}
          <div className="mb-6 rounded-xl bg-blue-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Amount to Pay</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              ₦{amount.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">{currency}</p>
          </div>

          {/* Payment info */}
          <div className="mb-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Reference</span>
              <span className="font-mono text-xs text-slate-500">{txRef}</span>
            </div>
            <div className="flex justify-between">
              <span>Email</span>
              <span>{email}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Card</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Bank Transfer</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">USSD</span>
          </div>

          {/* Status */}
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 py-3 text-sm font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening payment checkout…
            </div>
          )}

          {failed && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Payment gateway unavailable</p>
                <p className="mt-1 text-xs text-red-600">
                  Could not load the Flutterwave checkout. Please close this dialog and try again, or contact support.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          Secured by Flutterwave
        </div>
      </div>
    </div>
  );
}
