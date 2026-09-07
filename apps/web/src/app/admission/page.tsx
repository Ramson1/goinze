import type { Metadata } from "next";
import AdmissionClient from "./AdmissionClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Admissions — Requirements & How to Apply",
  description:
    "Apply to Goinze International School of Medical Health Science and Technology, Abuja. See ND admission requirements, SSCE subject combinations, entrance examination details and the step-by-step online application process.",
  path: "/admission",
  keywords: [
    "Goinze admission requirements",
    "apply to health school Abuja",
    "ND admission Nigeria",
    "SSCE requirements for school of health technology",
  ],
});

export default function AdmissionPage() {
  return <AdmissionClient />;
}
