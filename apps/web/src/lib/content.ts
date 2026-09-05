/**
 * CMS content helpers for the public website.
 *
 * Dynamic collections (news, events, gallery, announcements, academics, staff)
 * are fetched from the live API in each page/component. Static marketing
 * content (stats, testimonials, management team, contact details, fees and
 * alumni stories) is read from CMS content blocks, falling back to the inline
 * defaults below whenever a block is missing or malformed — so pages always
 * render even before an admin has populated the CMS.
 */

import { useEffect, useState } from "react";
import { websiteApi, type WebsiteContentRecord } from "./api";

/* ------------------------------- CMS fetching ------------------------------ */

/** Load all CMS content blocks once on mount. Never throws. */
export function useContentBlocks() {
  const [blocks, setBlocks] = useState<WebsiteContentRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    websiteApi
      .content()
      .then((res) => {
        if (active) setBlocks(Array.isArray(res) ? res : []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { blocks, loaded };
}

/** Return the body of the content block with the given key, or null. */
export function getBlockBody(blocks: WebsiteContentRecord[], key: string): unknown {
  const block = blocks.find((b) => b.key === key);
  return block?.body ?? null;
}

/**
 * Unwrap the `{ text: "..." }` envelope that the admin CMS stores.
 * If the value is `{ text: <string> }`, try to JSON-parse the text;
 * otherwise return the raw text so callers can still display it.
 */
function unwrapText(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "text" in (value as Record<string, unknown>)
  ) {
    const inner = (value as Record<string, unknown>).text;
    if (typeof inner === "string") {
      try {
        return JSON.parse(inner);
      } catch {
        return inner; // plain text — return as-is
      }
    }
  }
  return value;
}

/** Tolerant array coercion — accepts arrays, JSON strings, or {text: JSON-string}. */
export function asArray(value: unknown): any[] {
  const v = unwrapText(value);
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Tolerant object coercion — accepts objects, JSON strings, or {text: JSON-string}. */
export function asObject(value: unknown): Record<string, any> {
  const v = unwrapText(value);
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, any>;
  }
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Compute up to two initials from a name, skipping common honorifics. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !/^(prof\.?|dr\.?|mr\.?|mrs\.?|miss\.?|engr\.?)$/i.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/* ---------------------------- Marketing defaults --------------------------- */
/* Rendered when the matching CMS block has not been created yet.             */

export const defaultStats = [
  { label: "Academic Departments", value: "4" },
  { label: "ND Programmes", value: "4" },
  { label: "Licensing & Examining Boards", value: "6" },
  { label: "Programmes Accredited", value: "100%" },
];

export const defaultTestimonials = [
  {
    name: "Ngozi Adaeze",
    role: "Final Year, Community Health",
    quote:
      "The lecturers genuinely care about your growth. The practical postings to real practice areas prepared me for the field better than I ever expected.",
  },
  {
    name: "Tunde Bakare",
    role: "Alumnus, Public Health",
    quote:
      "Goinze gave me a foundation of discipline and curiosity. The hands-on primary health care training led directly to my first job in a community clinic.",
  },
  {
    name: "Mrs. Halima Yusuf",
    role: "Parent",
    quote:
      "The communication from the school is excellent. I always know how my daughter is doing, and the campus is safe and well run.",
  },
  {
    name: "David Okon",
    role: "Student, Medical Laboratory Technician",
    quote:
      "The laboratory sessions and supportive tutors here are outstanding. I am being trained for my licensing examination from day one.",
  },
];

export const defaultManagementTeam = [
  {
    name: "Mr Habila Audu",
    role: "Provost",
    photo: "/staffs/provost.jpeg",
    bio: "Provides academic leadership across all departments and chairs the day-to-day running of the college.",
  },
  {
    name: "Mr. Cornelius A. Ngara",
    role: "Registrar",
    photo: "/staffs/registrar.jpeg",
    bio: "In charge of the school's administration — admissions, records and all administrative duties of the institution.",
  },
  {
    name: "Mr. Daniel",
    role: "Administrator",
    photo: "/staffs/admin.jpeg",
    bio: "Coordinates administrative operations and supports the smooth running of the school's offices and services.",
  },
  {
    name: "Barr. Ibrahim Isah Esq.",
    role: "Legal Adviser",
    photo: "/staffs/legal-adviser.jpeg",
    bio: "Advises the institution on legal and regulatory matters and safeguards the interests of the school.",
  },
];

export const defaultContactInfo = {
  address: "Along Verita University Road Zuma 1, Opposite ECAW Church, Bwari Area Council, Abuja, Nigeria",
  phone: "0810 557 6617, 0805 817 6193, 0816 512 9613",
  email: "ishayadan5@gmail.com",
  hours: "Monday – Friday, 8:00 AM – 4:00 PM",
};

export const defaultFees = [
  { item: "Academic Transcript (within Nigeria)", amount: "₦15,000" },
  { item: "Academic Transcript (outside Nigeria)", amount: "₦25,000" },
  { item: "Hiring of Academic Gown", amount: "₦15,000" },
  { item: "Inter/Intra Departmental Transfer", amount: "₦5,000" },
  { item: "Remarking of Examination Scripts (per script)", amount: "₦15,000" },
  { item: "Late National Examination Registration Surcharge", amount: "₦100,000" },
];

export const defaultAlumniStories = [
  {
    name: "Linda Eze",
    graduationYear: "2025",
    programme: "ND Community Health",
    currentRole: "Community Health Extension Worker, Bwari PHC",
    story:
      "The community postings during my training showed me the real gaps in primary health care. Today I serve the same communities that trained me.",
  },
  {
    name: "Kwame Mensah",
    graduationYear: "2025",
    programme: "ND Public Health (PH)",
    currentRole: "Public Health Officer, FCT Health Services",
    story:
      "The fieldwork at Goinze was real community work, not textbook exercises. That practical grounding has defined my entire public health career.",
  },
  {
    name: "Aisha Bello",
    graduationYear: "2026",
    programme: "ND Pharmacy Technician (PT)",
    currentRole: "Health Records Officer, General Hospital Bwari",
    story:
      "Goinze prepared me thoroughly for my professional registration. I passed my licensing examination at the first sitting.",
  },
  {
    name: "Tunde Bakare",
    graduationYear: "2026",
    programme: "ND Medical Lab Technician (MLT)",
    currentRole: "Laboratory Technician, Private Diagnostics Centre",
    story:
      "The laboratory practice at the college clinic meant I started my job already confident with real samples and real patients.",
  },
];

export const defaultAdmissionRequirements = [
  {
    title: "SSCE Credit Passes",
    body: "Credit passes at SSCE (WAEC, NECO or GCE O/L) in no more than two sittings, including English Language, Mathematics and Biology or Health Science, as required by your chosen programme.",
  },
  {
    title: "Entrance Examination",
    body: "Secure the cut-off pass mark in the entrance examination and be successful at an interview conducted by the college authority.",
  },
  {
    title: "Certificates & Documents",
    body: "Original certificates/results, testimonials, birth certificate or declaration of age, indigene certificate and a letter of attestation from a respected member of your community.",
  },
  {
    title: "Acceptance & Registration Fees",
    body: "Pay the acceptance and registration fees through the designated banks and complete your registration formalities within the specified time frame.",
  },
];

export const defaultAcademicsNote =
  "All programmes run on a two-semester academic calendar leading to the National Diploma (ND) qualification, awarded after 3 years of structured theoretical and practical training.";

