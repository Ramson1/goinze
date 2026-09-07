import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import FaqSection from "@/components/FaqSection";
import { JsonLd, SITE, buildPageMetadata, faqs, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  titleAbsolute: `${SITE.name} | Medical & Health Science College in Abuja`,
  description:
    "Goinze International School of Medical Health Science and Technology, Bwari, Abuja — NBTE-licensed ND programmes in Community Health, Public Health, Pharmacy Technician and Medical Laboratory Technician. Admissions open.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HomeClient />
      <FaqSection faqs={faqs} />
      <JsonLd data={faqJsonLd(faqs)} />
    </>
  );
}
