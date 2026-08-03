"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const inputClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

/**
 * Contact form (demo — no backend call).
 */
export default function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">Message sent!</h3>
        <p className="mt-2 text-sm text-slate-600">
          Thank you for reaching out. Our team will get back to you within 2 working days.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input id="c-name" type="text" required placeholder="Your name" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <input id="c-email" type="email" required placeholder="you@example.com" className={inputClasses} />
        </div>
      </div>
      <div>
        <label htmlFor="c-subject" className="mb-1.5 block text-sm font-medium text-slate-700">
          Subject
        </label>
        <input id="c-subject" type="text" required placeholder="How can we help?" className={inputClasses} />
      </div>
      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="c-message"
          required
          rows={5}
          placeholder="Write your message..."
          className={inputClasses}
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        <Send className="h-4 w-4" />
        Send Message
      </button>
    </form>
  );
}
