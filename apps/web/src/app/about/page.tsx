import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us — Mission, Accreditation & Leadership",
  description:
    "Learn about Goinze International School of Medical Health Science and Technology in Bwari, Abuja: our mission, NBTE licence and accreditations, management team, laboratories and campus facilities.",
  path: "/about",
  keywords: [
    "about Goinze International School",
    "NBTE accredited health school Abuja",
    "school of health technology Bwari",
  ],
});

export default function AboutPage() {
  return <AboutClient />;
}
