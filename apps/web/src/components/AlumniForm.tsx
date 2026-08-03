"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const inputClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

/**
 * Alumni registration form (demo — no backend call).
 */
export default function AlumniForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">Registration received!</h3>
        <p className="mt-2 text-sm text-slate-600">
          Welcome back to the Goinze alumni family. We'll be in touch with details about
          the alumni network and upcoming reunions.
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
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="a-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input id="a-name" type="text" required placeholder="Your name" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="a-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <input id="a-email" type="email" required placeholder="you@example.com" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="a-programme" className="mb-1.5 block text-sm font-medium text-slate-700">
            Programme Studied
          </label>
          <input
            id="a-programme"
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
            type="number"
            required
            min={1970}
            max={2030}
            placeholder="e.g. 2018"
            className={inputClasses}
          />
        </div>
      </div>
      <div>
        <label htmlFor="a-role" className="mb-1.5 block text-sm font-medium text-slate-700">
          Current Role / Organisation (optional)
        </label>
        <input
          id="a-role"
          type="text"
          placeholder="e.g. Software Engineer at Acme Corp"
          className={inputClasses}
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        Join the Alumni Network
      </button>
    </form>
  );
}
