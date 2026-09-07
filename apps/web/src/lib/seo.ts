/**
 * Central SEO / AEO configuration for the public website.
 *
 * - SITE: canonical school facts used in metadata and JSON-LD structured data.
 * - buildPageMetadata(): per-page Metadata (title, description, canonical, OG, Twitter).
 * - JSON-LD builders: CollegeOrUniversity, WebSite, FAQPage, Article, ItemList.
 * - faqs: the prospective-student Q&A dataset rendered by <FaqSection /> and
 *   emitted as FAQPage structured data (Answer Engine Optimization).
 */

import { createElement } from "react";
import type { Metadata } from "next";

export const SITE = {
  name: "Goinze International School of Medical Health Science and Technology",
  shortName: "Goinze International School",
  alternateName: "Goinzeschool",
  motto: "Learn How to Maintain a Good Health",
  url: "https://goinzeschool.edu.ng",
  logo: "https://goinzeschool.edu.ng/logo.png",
  ogImage: "https://goinzeschool.edu.ng/opengraph-image",
  address: {
    streetAddress: "Along Verita University Road, Zuma 1, Opposite ECAW Church",
    addressLocality: "Bwari Area Council",
    addressRegion: "Abuja (FCT)",
    postalCode: "901101",
    addressCountry: "NG",
  },
  addressLine:
    "Along Verita University Road Zuma 1, Opposite ECAW Church, Bwari Area Council, Abuja, Nigeria",
  phones: ["+2348105576617", "+2348058176193", "+2348165129613"],
  email: "ishayadan5@gmail.com",
  hours: "Monday – Friday, 8:00 AM – 4:00 PM",
  programmes: [
    "ND Community Health (CHEW)",
    "ND Public Health (PH)",
    "ND Pharmacy Technician (PT)",
    "ND Medical Laboratory Technician (MLT)",
  ],
  keywords: [
    "Goinze International School",
    "school of medical health science and technology Abuja",
    "private medical school Nigeria",
    "health science college Abuja",
    "NBTE accredited health school Nigeria",
    "community health school Abuja",
    "public health ND programme Nigeria",
    "pharmacy technician school Abuja",
    "medical laboratory technician school Nigeria",
    "school of health technology Bwari",
    "admissions health science school Abuja",
    "ND health programmes Nigeria",
  ],
} as const;

/** Default description used when a page does not supply its own. */
export const DEFAULT_DESCRIPTION =
  "Goinze International School of Medical Health Science and Technology, Bwari, Abuja — an NBTE-licensed college offering National Diploma programmes in Community Health, Public Health, Pharmacy Technician and Medical Laboratory Technician. Admissions open.";

interface PageMetadataOptions {
  /** Page title; rendered as "<title> | Goinze International School" via the root template. */
  title?: string;
  /** Absolute title (skips the template suffix) — used on the home page. */
  titleAbsolute?: string;
  description?: string;
  /** Path including leading slash, e.g. "/admission". Used for canonical + OG url. */
  path: string;
  keywords?: string[];
  /** Set true to keep the page out of search indexes (e.g. payment callback). */
  noIndex?: boolean;
  type?: "website" | "article";
}

/** Build a complete Metadata object (title, description, canonical, OG, Twitter, robots). */
export function buildPageMetadata(opts: PageMetadataOptions): Metadata {
  const {
    title,
    titleAbsolute,
    description = DEFAULT_DESCRIPTION,
    path,
    keywords,
    noIndex = false,
    type = "website",
  } = opts;
  const canonical = `${SITE.url}${path === "/" ? "" : path}`;
  const ogTitle = titleAbsolute ?? (title ? `${title} | ${SITE.shortName}` : SITE.name);

  return {
    title: titleAbsolute ? { absolute: titleAbsolute } : title,
    description,
    keywords: keywords ?? undefined,
    alternates: { canonical },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE.name,
      title: ogTitle,
      description,
      locale: "en_NG",
      images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [SITE.ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

/* --------------------------------- JSON-LD --------------------------------- */

/** CollegeOrUniversity (EducationalOrganization) schema — emitted once in the root layout. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: SITE.name,
    alternateName: [SITE.shortName, SITE.alternateName],
    slogan: SITE.motto,
    description: DEFAULT_DESCRIPTION,
    url: SITE.url,
    logo: SITE.logo,
    image: SITE.ogImage,
    email: SITE.email,
    telephone: SITE.phones[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.streetAddress,
      addressLocality: SITE.address.addressLocality,
      addressRegion: SITE.address.addressRegion,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.addressCountry,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE.phones[0],
        contactType: "admissions",
        email: SITE.email,
        areaServed: "NG",
        availableLanguage: ["English", "Hausa"],
      },
      {
        "@type": "ContactPoint",
        telephone: SITE.phones[1],
        contactType: "customer service",
        email: SITE.email,
        areaServed: "NG",
        availableLanguage: ["English", "Hausa"],
      },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "16:00",
      },
    ],
    department: SITE.programmes.map((p) => ({
      "@type": "EducationalOrganizationDepartment",
      name: p,
    })),
    makesOffer: SITE.programmes.map((p) => ({
      "@type": "EducationalOccupationalProgram",
      name: p,
      educationalCredentialAwarded: "National Diploma (ND)",
      programType: "Full-time",
    })),
  };
}

/** WebSite schema — emitted once in the root layout alongside the organization. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.shortName,
    alternateName: SITE.alternateName,
    url: SITE.url,
    inLanguage: "en-NG",
    publisher: { "@type": "CollegeOrUniversity", name: SITE.name },
  };
}

export interface Faq {
  question: string;
  answer: string;
}

/**
 * Prospective-student Q&A (AEO). Answers are written to be read verbatim by
 * voice assistants and featured snippets: direct, short, self-contained.
 */
export const faqs: Faq[] = [
  {
    question: "What programmes does Goinze International School offer?",
    answer: `Goinze International School of Medical Health Science and Technology offers four National Diploma (ND) programmes: ${SITE.programmes.join(
      ", ",
    )}. Each programme runs for three years on a two-semester academic calendar combining theory with hands-on clinical and community practice.`,
  },
  {
    question: "Where is Goinze International School located?",
    answer: `The campus is at ${SITE.addressLine}. It sits along Verita University Road in Zuma 1, opposite ECAW Church, in the Bwari Area Council of the Federal Capital Territory, Nigeria.`,
  },
  {
    question: "What are the admission requirements?",
    answer:
      "Applicants need credit passes at SSCE (WAEC, NECO or GCE O/L) in no more than two sittings, including English Language, Mathematics and Biology or Health Science. You must also pass the college entrance examination and interview, and present original certificates, a birth certificate or declaration of age, an indigene certificate and a letter of attestation.",
  },
  {
    question: "How do I apply for admission?",
    answer:
      "Apply online through the admission portal at goinzeschool.edu.ng/admission. Fill in the application form, pay the admission fee online, and track your application status by email. Successful applicants receive an admission letter with registration instructions.",
  },
  {
    question: "Is Goinze International School accredited?",
    answer:
      "Yes. The school holds a Licence to Operate from the National Board for Technical Education (NBTE), a Certificate of Incorporation from the Corporate Affairs Commission (CAC), and both Council and National Certificates of Accreditation. All programmes are fully accredited.",
  },
  {
    question: "When do admissions open and close?",
    answer:
      "The academic calendar runs July to June. Admission into the current session is open now and applications are processed on a rolling basis until the session's quota is filled, so early application is recommended.",
  },
  {
    question: "How much does an academic transcript cost?",
    answer:
      "An academic transcript costs ₦15,000 within Nigeria and ₦25,000 outside Nigeria. Other published fees include ₦15,000 for hiring of academic gown, ₦5,000 for inter- or intra-departmental transfer and ₦15,000 per script for remarking of examination scripts.",
  },
  {
    question: "How can I contact the school?",
    answer: `Call ${SITE.phones.join(", ")} or email ${SITE.email}. The school office is open ${SITE.hours}. You can also visit the campus in person at ${SITE.addressLine}.`,
  },
];

/** FAQPage schema — powers rich results, featured snippets and voice answers. */
export function faqJsonLd(items: Faq[] = faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** Article schema for news posts. */
export function articleJsonLd(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  body?: string;
  publishedAt?: string | null;
  createdAt?: string;
}) {
  const url = `${SITE.url}/news/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverUrl ? [post.coverUrl] : [SITE.ogImage],
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.createdAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "CollegeOrUniversity", name: SITE.name },
    publisher: {
      "@type": "CollegeOrUniversity",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: SITE.logo },
    },
  };
}

/** ItemList schema for the ND programmes (academics page). */
export function programmesJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "National Diploma Programmes at Goinze International School",
    itemListElement: SITE.programmes.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "EducationalOccupationalProgram",
        name: p,
        educationalCredentialAwarded: "National Diploma (ND)",
        timeToComplete: "P3Y",
        provider: { "@type": "CollegeOrUniversity", name: SITE.name, sameAs: SITE.url },
      },
    })),
  };
}

/** Renders a JSON-LD <script> block. Use inside server components/pages. */
export function JsonLd({ data }: { data: Record<string, unknown> | object }) {
  // createElement (not JSX) so this module can stay a plain .ts file.
  return createElement("script", {
    type: "application/ld+json",
    // JSON-LD must be injected as a raw string; data is code-owned (no user input).
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  });
}
