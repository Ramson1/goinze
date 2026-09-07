import type { Metadata } from "next";
import EventsClient from "./EventsClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Events — Upcoming Campus Activities",
  description:
    "See what's on at Goinze International School of Medical Health Science and Technology, Abuja: matriculation, convocation, seminars, health outreach and other campus events.",
  path: "/events",
  keywords: ["Goinze school events", "campus events Abuja", "convocation Goinze"],
});

export default function EventsPage() {
  return <EventsClient />;
}
