import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import StaffDirectory from "@/components/StaffDirectory";

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
