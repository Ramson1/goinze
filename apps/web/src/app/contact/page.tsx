import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { JsonLd, SITE, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us — Location, Phone & Email",
  description: `Contact Goinze International School of Medical Health Science and Technology: ${SITE.addressLine}. Call ${SITE.phones[0]}, email ${SITE.email}. Office hours: ${SITE.hours}.`,
  path: "/contact",
  keywords: [
    "contact Goinze International School",
    "health school Bwari Abuja contact",
    "Goinze school phone number",
  ],
});

export default function ContactPage() {
  return (
    <>
      <ContactClient />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Goinze International School",
          url: `${SITE.url}/contact`,
          mainEntity: {
            "@type": "CollegeOrUniversity",
            name: SITE.name,
            telephone: SITE.phones[0],
            email: SITE.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: SITE.address.streetAddress,
              addressLocality: SITE.address.addressLocality,
              addressRegion: SITE.address.addressRegion,
              postalCode: SITE.address.postalCode,
              addressCountry: SITE.address.addressCountry,
            },
          },
        }}
      />
    </>
  );
}
