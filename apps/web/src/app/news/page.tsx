import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import NewsExplorer from "@/components/NewsExplorer";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "News — Stories & Updates",
  description:
    "News, achievements and updates from Goinze International School of Medical Health Science and Technology, Bwari, Abuja.",
  path: "/news",
  keywords: ["Goinze school news", "health college news Abuja"],
});

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
