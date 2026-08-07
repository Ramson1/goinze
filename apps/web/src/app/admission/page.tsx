"use client";

import { CheckCircle2, ClipboardList, CreditCard, Download, FileText } from "lucide-react";
import { currentAcademicSession } from "@goinze/shared-utils";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import Card from "@/components/Card";
import AdmissionForm from "@/components/AdmissionForm";
import {
  asArray,
  defaultAdmissionRequirements,
  defaultFees,
  getBlockBody,
  useContentBlocks,
} from "@/lib/content";

const reqIcons = [FileText, ClipboardList, CheckCircle2, CreditCard];

export default function AdmissionPage() {
  const { blocks } = useContentBlocks();

  const fees = (() => {
    const cms = asArray(getBlockBody(blocks, "admission.fees"));
    return cms.length > 0 ? cms : defaultFees;
  })();

  const feeScheduleDoc = (() => {
    const body = getBlockBody(blocks, "admission.feeSchedule");
    if (body && typeof body === "object" && "url" in body) return body as { url: string; name: string };
    return null;
  })();

  const requirements = (() => {
    const cms = asArray(getBlockBody(blocks, "admission.requirements"));
    return cms.length > 0 ? cms : defaultAdmissionRequirements;
  })();

  return (
    <>
      <PageHeader
        breadcrumb="Admission"
        title="Admission"
        subtitle="Everything you need to join Goinze International School of Medical Health Science and Technology — requirements, fees and how to apply."
      />

      {/* Requirements */}
      <Section
        eyebrow="Before You Apply"
        title="Admission Requirements"
        subtitle="Make sure you have the following ready before starting your application."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {requirements.map((req: { title: string; body: string }, i: number) => {
            const Icon = reqIcons[i % reqIcons.length];
            return (
              <Card key={req.title || i} hover className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{req.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{req.body}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Fees table */}
      <Section
        className="bg-slate-50"
        eyebrow="Investment"
        title="Schedule of Fees"
        subtitle={`Indicative fees for the ${currentAcademicSession()} academic session.`}
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="px-6 py-4 font-semibold">Item</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((row, i) => (
                  <tr
                    key={row.item ?? i}
                    className={`border-b border-slate-100 last:border-0 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">{row.item}</td>
                    <td className="px-6 py-4 font-semibold text-brand">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-4 text-xs text-slate-500">
          * Tuition and other session/semester fees are as approved by the college —
          contact the Bursary for the current schedule. There is no refund of fees once paid.
        </p>

        {/* Uploaded fee schedule document */}
        {feeScheduleDoc && (
          <a
            href={feeScheduleDoc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-medium text-brand transition hover:bg-blue-100"
          >
            <FileText className="h-5 w-5" />
            <span>Download Schedule of Fees</span>
            <Download className="h-4 w-4" />
          </a>
        )}
      </Section>

      {/* Application form */}
      <Section
        eyebrow="Apply Now"
        title="Start Your Application"
        subtitle="Fill in the form below and our admissions team will guide you through the next steps."
        id="apply"
      >
        <Card className="p-8">
          <AdmissionForm blocks={blocks} />
        </Card>
      </Section>
    </>
  );
}
