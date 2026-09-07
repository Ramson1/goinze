"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Section from "./Section";
import type { Faq } from "@/lib/seo";

/**
 * Accessible FAQ accordion (AEO). The matching FAQPage JSON-LD is emitted by
 * the server page wrapper so search engines get the same Q&A as structured
 * data for featured snippets and voice answers.
 */
export default function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      eyebrow="Answers"
      title="Frequently Asked Questions"
      subtitle="Quick answers about admissions, programmes, fees and life at Goinze International School."
    >
      <div className="max-w-3xl space-y-3">
        {faqs.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div
              key={faq.question}
              className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-card"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                aria-controls={`faq-answer-${i}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-brand transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${i}`}
                hidden={!open}
                className="border-t border-slate-100 px-5 py-4"
              >
                <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
