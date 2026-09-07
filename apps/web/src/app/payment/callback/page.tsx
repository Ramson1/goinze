import type { Metadata } from "next";
import PaymentCallbackClient from "./PaymentCallbackClient";
import { buildPageMetadata } from "@/lib/seo";

/* Transactional page — must never appear in search results. */
export const metadata: Metadata = buildPageMetadata({
  title: "Payment Confirmation",
  description: "Payment confirmation callback for Goinze International School applications.",
  path: "/payment/callback",
  noIndex: true,
});

export default function PaymentCallbackPage() {
  return <PaymentCallbackClient />;
}
