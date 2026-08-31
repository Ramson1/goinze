"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { contactApi, type AlumniRegistrationInput } from "@/lib/api";

const inputClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export default function AlumniForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data: AlumniRegistrationInput = {
      name: (form.elements.namedItem("a-name") as HTMLInputElement).value,
      email: (form.elements.namedItem("a-email") as HTMLInputElement).value,
      programme: (form.elements.namedItem("a-programme") as HTMLInputElement).value,
      graduationYear: parseInt((form.elements.namedItem("a-year") as HTMLInputElement).value, 10),
      currentRole: (form.elements.namedItem("a-role") as HTMLInputElement)?.value || undefined,
    };

    try {
      await contactApi.registerAlumni(data);
      setSubmitted(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">Registration received!</h3>
        <p className="mt-2 text-sm text-slate-600">
          Welcome back to the Goinze alumni family. Your registration is pending approval.
          We&apos;ll be in touch with details about the alumni network and upcoming reunions.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Register another alumnus
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="a-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input id="a-name" name="a-name" type="text" required placeholder="Your name" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="a-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <input id="a-email" name="a-email" type="email" required placeholder="you@example.com" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="a-programme" className="mb-1.5 block text-sm font-medium text-slate-700">
            Programme Studied
          </label>
          <input
            id="a-programme"
            name="a-programme"
            type="text"
            required
            placeholder="e.g. B.Sc. Computer Science"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="a-year" className="mb-1.5 block text-sm font-medium text-slate-700">
            Graduation Year
          </label>
          <input
            id="a-year"
            name="a-year"
            type="number"
            required
            min={1950}
            max={2030}
            placeholder="e.g. 2025"
            className={inputClasses}
          />
        </div>
      </div>
      <div>
        <label htmlFor="a-role" className="mb-1.5 block text-sm font-medium text-slate-700">
          Current Role / Organisation <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="a-role"
          name="a-role"
          type="text"
          placeholder="e.g. Software Engineer at Acme Corp"
          className={inputClasses}
        />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitting ? "Submitting..." : "Join the Alumni Network"}
      </button>
    </form>
  );
}
