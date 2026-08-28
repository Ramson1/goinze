"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { financeApi } from "@/lib/api";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    // Support both Flutterwave (tx_ref) and Paystack (reference) query params
    const txRef = searchParams.get("tx_ref") || searchParams.get("reference");

    if (!txRef) {
      setStatus("failed");
      setMessage("No payment reference found. Please try again.");
      return;
    }

    // Verify the payment on the backend (gateway-agnostic)
    financeApi
      .verifyPayment(txRef)
      .then(() => {
        // Store the reference so the admission form can pick it up
        sessionStorage.setItem("paymentReference", txRef);
        sessionStorage.setItem("paymentStatus", "verified");
        setStatus("success");
        setMessage("Payment verified! Redirecting to complete your application…");
        setTimeout(() => {
          router.push("/admission?paymentSuccess=true");
        }, 2000);
      })
      .catch(() => {
        setStatus("failed");
        setMessage("Payment verification failed. Please contact support or try again.");
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">Verifying Payment</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">Payment Successful</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">Payment Failed</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <button
              onClick={() => router.push("/admission#apply")}
              className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Back to Application
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
