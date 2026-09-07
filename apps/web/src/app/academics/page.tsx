import type { Metadata } from "next";
import AcademicsClient from "./AcademicsClient";
import { JsonLd, buildPageMetadata, programmesJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Academics — ND Health Science Programmes",
  description:
    "Explore the National Diploma programmes at Goinze International School Abuja: Community Health (CHEW), Public Health (PH), Pharmacy Technician (PT) and Medical Laboratory Technician (MLT). Three-year ND, two-semester calendar, fully accredited.",
  path: "/academics",
  keywords: [
    "ND health science programmes Nigeria",
    "community health programme Abuja",
    "public health ND Nigeria",
    "pharmacy technician programme Abuja",
    "medical laboratory technician programme Nigeria",
  ],
});

export default function AcademicsPage() {
  return (
    <>
      <AcademicsClient />
      <JsonLd data={programmesJsonLd()} />
    </>
  );
}
