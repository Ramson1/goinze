'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, X, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GatewayId = 'FLUTTERWAVE' | 'PAYSTACK';

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
  gateway?: GatewayId;
  onSuccess: (response: PaymentResponse) => void;
  onError: (error: string) => void;
}

/** Unified payment response from either gateway. */
export interface PaymentResponse {
  txRef: string;
  gatewayRef: string;
  status: string;
  amount: number;
  currency: string;
}

/** @deprecated Use PaymentResponse instead. */
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
// Script injection helpers
// ---------------------------------------------------------------------------

let flutterwaveScriptPromise: Promise<void> | null = null;
let paystackScriptPromise: Promise<void> | null = null;

function injectFlutterwaveScript(): Promise<void> {
  if ((window as any).FlutterwaveCheckout) return Promise.resolve();
  if (flutterwaveScriptPromise) return flutterwaveScriptPromise;
  flutterwaveScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      flutterwaveScriptPromise = null;
      reject(new Error('Failed to load Flutterwave script'));
    };
    document.head.appendChild(script);
  });
  return flutterwaveScriptPromise;
}

function injectPaystackScript(): Promise<void> {
  if ((window as any).PaystackPop) return Promise.resolve();
  if (paystackScriptPromise) return paystackScriptPromise;
  paystackScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      paystackScriptPromise = null;
      reject(new Error('Failed to load Paystack script'));
    };
    document.head.appendChild(script);
  });
  return paystackScriptPromise;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GATEWAY_LABELS: Record<GatewayId, string> = {
  FLUTTERWAVE: 'Flutterwave',
  PAYSTACK: 'Paystack',
};

export default function PaymentModal({
  open,
  onClose,
  amount,
  email,
  txRef,
  publicKey,
  currency = 'NGN',
  title = 'Goinzeschool Payment',
  description,
  gateway = 'FLUTTERWAVE',
  onSuccess,
  onError,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const initiatedRef = useRef(false);
  const gatewayLabel = GATEWAY_LABELS[gateway] || 'Payment Gateway';
  const desc = description ?? `Secure payment via ${gatewayLabel}`;

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    initiatedRef.current = false;
    setLoading(false);
    setFailed(false);
  }, [open, txRef]);

  // Trigger checkout when modal opens
  useEffect(() => {
    if (!open || initiatedRef.current) return;
    if (!publicKey) {
      setFailed(true);
      onError('Payment key not loaded. Please refresh the page and try again.');
      return;
    }
    initiatedRef.current = true;
    setLoading(true);

    if (gateway === 'PAYSTACK') {
      // --- Paystack checkout ---
      const doPaystack = () => {
        const win = window as any;
        if (typeof win.PaystackPop?.setup === 'function') {
          const handler = win.PaystackPop.setup({
            key: publicKey,
            email,
            amount: Math.round(amount * 100), // Paystack uses kobo
            currency,
            ref: txRef,
            metadata: {
              custom_fields: [
                {
                  display_name: 'Description',
                  variable_name: 'description',
                  value: title,
                },
              ],
            },
            callback(response: any) {
              setLoading(false);
              onSuccess({
                txRef: response.reference || txRef,
                gatewayRef: response.reference || txRef,
                status: 'successful',
                amount,
                currency,
              });
            },
            onClose() {
              setLoading(false);
              onClose();
            },
          });
          if (handler) {
            handler.openIframe();
          } else {
            setFailed(true);
            setLoading(false);
            onError('Paystack checkout could not load. Please try again.');
          }
        } else {
          setFailed(true);
          setLoading(false);
          onError('Paystack checkout could not load. Please try again.');
        }
      };

      injectPaystackScript()
        .then(doPaystack)
        .catch(() => {
          setFailed(true);
          setLoading(false);
          onError('Could not load payment gateway. Please check your connection and try again.');
        });
    } else {
      // --- Flutterwave checkout ---
      const doCheckout = () => {
        const win = window as any;
        if (typeof win.FlutterwaveCheckout === 'function') {
          win.FlutterwaveCheckout({
            public_key: publicKey,
            tx_ref: txRef,
            amount,
            currency,
            payment_options: 'card, bank_transfer, ussd',
            customer: { email, name: email },
            custom_texts: { title, description: desc },
            customizations: { title, description: desc, logo: '' },
            callback(data: any) {
              setLoading(false);
              onSuccess({
                txRef: data.tx_ref || txRef,
                gatewayRef: data.flw_ref || '',
                status: data.status || 'successful',
                amount: data.amount ?? amount,
                currency: data.currency ?? currency,
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
          onError(`${gatewayLabel} checkout could not load. Please try again.`);
        }
      };

      injectFlutterwaveScript()
        .then(doCheckout)
        .catch(() => {
          setFailed(true);
          setLoading(false);
          onError('Could not load payment gateway. Please check your connection and try again.');
        });
    }
  }, [open, publicKey, txRef, amount, currency, email, title, desc, gateway, gatewayLabel, onSuccess, onError, onClose]);

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
            <div className="flex justify-between">
              <span>Gateway</span>
              <span className="font-medium text-slate-800">{gatewayLabel}</span>
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
              Opening {gatewayLabel} checkout…
            </div>
          )}

          {failed && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Payment gateway unavailable</p>
                <p className="mt-1 text-xs text-red-600">
                  Could not load the {gatewayLabel} checkout. Please close this dialog and try again, or contact support.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          Secured by {gatewayLabel}
        </div>
      </div>
    </div>
  );
}
