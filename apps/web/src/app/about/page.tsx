"use client";

import Image from "next/image";
import { Award, Compass, Eye, Landmark } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import Card from "@/components/Card";
import Container from "@/components/Container";
import {
  asArray,
  defaultManagementTeam,
  getBlockBody,
  initialsOf,
  useContentBlocks,
} from "@/lib/content";

const pillars = [
  {
    Icon: Landmark,
    title: "Our Pledge",
    body: "We acknowledge the importance of primary health in our country and the world at large. At Goinze International School of Medical Health Science and Technology, we believe in building a nation that is well informed and not deformed, holding primary care service in high esteem.",
  },
  {
    Icon: Eye,
    title: "Our Vision",
    body: "To bridge the gap and create access to health knowledge down to the grass roots, developing the younger generation and training them in health education, skills and techniques.",
  },
  {
    Icon: Compass,
    title: "Our Mission",
    body: "To train and produce persons who are equipped with comprehensive theoretical knowledge and practical skills required for meaningful engagement in all areas of primary health care.",
  },
  {
    Icon: Award,
    title: "Accreditation",
    body: "Our programmes are examined and certified by national regulatory bodies — including NBTE, CHPRBN, EHORECON, the Medical Laboratory Science Council of Nigeria and the Health Records Officers Registration Board — leading to professional registration and practice licences.",
  },
];

// Official documents from the school's registry (public/certificates).
const certificates = [
  {
    image: "/certificates/licence-to-operate.png",
    title: "Licence to Operate",
    issuer:
      "National Board for Technical Education (NBTE) — approved by the Honourable Minister of Education to operate as a College of Health Sciences, 2024.",
  },
  {
    image: "/certificates/certificate-of-incorporation.jpeg",
    title: "Certificate of Incorporation",
    issuer:
      "Corporate Affairs Commission (CAC) — incorporated under the Companies and Allied Matters Act 2020, RC No. 6954838.",
  },
  {
    image: "/certificates/council-certificate-of-accreditation.jpeg",
    title: "Council Certificate of Accreditation",
    issuer:
      "Council of Health Assistants/Technicians and Public Health Registration Board of Nigeria — approval to run Public Health Technicians and Health Technology.",
  },
  {
    image: "/certificates/national-certificate-of-accreditation.jpeg",
    title: "National Certificate of Accreditation",
    issuer:
      "National Association of Public Health Practitioners Council of Nigeria — approval to run Public Health Assistant, Technician and Technology programmes.",
  },
  {
    image: "/certificates/joint-tax-board.jpeg",
    title: "Taxpayer Identification Certificate",
    issuer:
      "Joint Tax Board / Federal Inland Revenue Service — TIN 1070586753, Bwari Area Council, FCT Abuja.",
  },
];

export default function AboutPage() {
  const { blocks } = useContentBlocks();

  const managementTeam = (() => {
    const cms = asArray(getBlockBody(blocks, "about.management"));
    return cms.length > 0 ? cms : defaultManagementTeam;
  })();

  return (
    <>
      <PageHeader
        breadcrumb="About"
        title="About Goinze International School of Medical Health Science and Technology"
        subtitle="Learn how to maintain a good health — training health professionals for the grass roots, Bwari, Abuja."
      />

      {/* Pledge / Vision / Mission / Accreditation */}
      <Section>
        <div className="grid gap-8 md:grid-cols-2">
          {pillars.map(({ Icon, title, body }) => (
            <Card key={title} hover className="p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">{title}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Management team */}
      <Section
        className="bg-slate-50"
        eyebrow="Leadership"
        title="Principal Officers"
        subtitle="Meet the leaders guiding the school's strategy and day-to-day operations."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {managementTeam.map((member) => (
            <Card key={member.name} hover className="p-6 text-center">
              {member.photo ? (
                <Image
                  src={member.photo}
                  alt={member.name ?? "Staff photo"}
                  width={112}
                  height={112}
                  className="mx-auto h-28 w-28 rounded-full border-2 border-brand/20 object-cover"
                />
              ) : (
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-2xl font-bold text-white">
                  {member.initials ?? initialsOf(member.name ?? "")}
                </span>
              )}
              <h3 className="mt-4 text-lg font-bold text-slate-900">{member.name}</h3>
              <p className="text-sm font-semibold text-brand">{member.role}</p>
              {member.bio && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{member.bio}</p>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* Certifications & licences */}
      <Section
        eyebrow="Certified & Licensed"
        title="Our Certifications"
        subtitle="Goinze International School of Medical Health Science and Technology is duly registered, licensed and accredited by the relevant national bodies."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.image} hover className="flex flex-col overflow-hidden">
              <a
                href={cert.image}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-slate-100 p-3"
                aria-label={`View ${cert.title} in full size`}
              >
                <Image
                  src={cert.image}
                  alt={cert.title}
                  width={640}
                  height={480}
                  className="mx-auto h-64 w-full rounded-lg object-contain"
                />
              </a>
              <div className="flex-1 p-5">
                <h3 className="text-lg font-bold text-slate-900">{cert.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{cert.issuer}</p>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Click any certificate to view it in full size.
        </p>
      </Section>

      {/* Core values strip */}
      <div className="bg-gradient-to-r from-brand-dark to-brand">
        <Container className="py-12 text-center">
          <h2 className="text-2xl font-bold text-white">Our Core Values</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {["Primary Health Care", "Excellence", "Integrity", "Discipline", "Community"].map((value) => (
              <span
                key={value}
                className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white"
              >
                {value}
              </span>
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}
