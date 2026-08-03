import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import NewsExplorer from "@/components/NewsExplorer";

export default function NewsPage() {
  return (
    <>
      <PageHeader
        breadcrumb="News"
        title="University News"
        subtitle="Stories, achievements and updates from across Goinze International School of Medical Health Science and Technology."
      />
      <Section>
        <NewsExplorer />
      </Section>
    </>
  );
}
