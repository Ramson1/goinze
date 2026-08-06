"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { contactApi, type ContactMessageInput } from "@/lib/api";

const inputClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    const form = e.currentTarget;
    const data: ContactMessageInput = {
      name: (form.elements.namedItem("c-name") as HTMLInputElement).value,
      email: (form.elements.namedItem("c-email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("c-subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("c-message") as HTMLTextAreaElement).value,
      phone: (form.elements.namedItem("c-phone") as HTMLInputElement)?.value || undefined,
    };

    try {
      await contactApi.sendMessage(data);
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

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
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input id="c-name" name="c-name" type="text" required placeholder="Your name" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <input id="c-email" name="c-email" type="email" required placeholder="you@example.com" className={inputClasses} />
        </div>
      </div>
      <div>
        <label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
          Phone Number <span className="text-slate-400">(optional)</span>
        </label>
        <input id="c-phone" name="c-phone" type="tel" placeholder="+234 ..." className={inputClasses} />
      </div>
      <div>
        <label htmlFor="c-subject" className="mb-1.5 block text-sm font-medium text-slate-700">
          Subject
        </label>
        <input id="c-subject" name="c-subject" type="text" required placeholder="How can we help?" className={inputClasses} />
      </div>
      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="c-message"
          name="c-message"
          required
          rows={5}
          placeholder="Write your message..."
          className={inputClasses}
        />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
