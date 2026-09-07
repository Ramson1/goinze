import type { Metadata } from "next";
import AlumniClient from "./AlumniClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Alumni — Graduate Stories & Network",
  description:
    "Meet graduates of Goinze International School of Medical Health Science and Technology working in community health, public health, pharmacy and medical laboratory practice across Nigeria.",
  path: "/alumni",
  keywords: ["Goinze alumni", "community health graduates Nigeria", "health school alumni Abuja"],
});

export default function AlumniPage() {
  return <AlumniClient />;
}
