"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import Card from "@/components/Card";
import ContactForm from "@/components/ContactForm";
import {
  asObject,
  defaultContactInfo,
  getBlockBody,
  useContentBlocks,
} from "@/lib/content";

export default function ContactPage() {
  const { blocks } = useContentBlocks();

  const contactInfo = {
    ...defaultContactInfo,
    ...asObject(getBlockBody(blocks, "contact.info")),
  };

  const infoCards = [
    { Icon: MapPin, title: "Visit Us", lines: [contactInfo.address] },
    { Icon: Phone, title: "Call Us", lines: contactInfo.phone.split(",").map((p: string) => p.trim()) },
    { Icon: Mail, title: "Email Us", lines: [contactInfo.email] },
    { Icon: Clock, title: "Office Hours", lines: [contactInfo.hours] },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Contact"
        title="Contact Us"
        subtitle="We'd love to hear from you. Get in touch with the university."
      />

      {/* Info cards */}
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {infoCards.map(({ Icon, title, lines }) => (
            <Card key={title} hover className="p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              {lines.filter(Boolean).map((line) => (
                <p key={line} className="mt-1.5 text-sm text-slate-600">
                  {line}
                </p>
              ))}
            </Card>
          ))}
        </div>
      </Section>

      {/* Form + Map */}
      <Section className="bg-slate-50">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Send a Message</h2>
            <p className="mt-2 text-sm text-slate-600">
              Fill in the form and our team will respond within 2 working days.
            </p>
            <Card className="mt-6 p-8">
              <ContactForm />
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Find Us on the Map</h2>
            <p className="mt-2 text-sm text-slate-600">
              Our main campus is located in the heart of Goinze City.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-card">
              <div className="flex h-[420px] items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
                <div className="text-center">
                  <MapPin className="mx-auto h-10 w-10 text-brand" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Google Maps embed placeholder
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Replace with an iframe embed of the campus location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
