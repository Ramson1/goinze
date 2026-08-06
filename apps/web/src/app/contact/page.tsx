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
              Our main campus is located in Bwari Area Council, Abuja.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-card">
              <iframe
                title="School Location"
                src="https://www.google.com/maps?q=Along+Verita+University+Road+Zuma+1,+Opposite+ECAW+Church,+Bwari+Area+Council,+Abuja,+Nigeria&output=embed"
                width="100%"
                height="420"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
