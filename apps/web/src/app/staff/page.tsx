import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import StaffDirectory from "@/components/StaffDirectory";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Staff Directory",
  description:
    "Meet the academic and administrative staff of Goinze International School of Medical Health Science and Technology, Bwari, Abuja.",
  path: "/staff",
  keywords: ["Goinze staff directory", "health school lecturers Abuja"],
});

export default function StaffPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Staff"
        title="Staff Directory"
        subtitle="Find and connect with the academic and administrative staff of the university."
      />
      <Section>
        <StaffDirectory />
      </Section>
    </>
  );
}
