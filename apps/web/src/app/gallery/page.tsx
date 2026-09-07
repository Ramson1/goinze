import type { Metadata } from "next";
import GalleryClient from "./GalleryClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Gallery — Campus Life in Pictures",
  description:
    "Photos of campus life at Goinze International School of Medical Health Science and Technology, Abuja: laboratories, classrooms, clinics, ceremonies and student activities.",
  path: "/gallery",
  keywords: ["Goinze campus photos", "health school gallery Abuja", "campus life Nigeria"],
});

export default function GalleryPage() {
  return <GalleryClient />;
}
