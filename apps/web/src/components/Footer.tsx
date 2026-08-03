"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import {
  asObject,
  defaultContactInfo,
  getBlockBody,
  useContentBlocks,
} from "@/lib/content";

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Admission", href: "/admission" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
  { label: "Alumni", href: "/alumni" },
  { label: "Staff", href: "/staff" },
];

const socials = [
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Twitter", href: "#", Icon: Twitter },
  { label: "LinkedIn", href: "#", Icon: Linkedin },
  { label: "YouTube", href: "#", Icon: Youtube },
];

export default function Footer() {
  const { blocks } = useContentBlocks();
  const contactInfo = {
    ...defaultContactInfo,
    ...asObject(getBlockBody(blocks, "contact.info")),
  };

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1">
              <Image
                src="/logo.png"
                alt="Goinzeschool logo"
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
              />
            </span>
            <span className="text-lg font-bold text-white">Goinzeschool</span>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
            Motto: Learn How to Maintain a Good Health
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Goinze International School of Medical Health Science and Technology,
            Bwari Abuja, is committed to bridging the gap and creating access to
            health knowledge down to the grass roots.
          </p>
          <div className="mt-5 flex gap-3">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-colors hover:bg-brand hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-brand-light"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" />
              <span>{contactInfo.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-brand-light" />
              <span>{contactInfo.phone}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-brand-light" />
              <span>{contactInfo.email}</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Newsletter
          </h3>
          <p className="mt-4 text-sm text-slate-400">
            Subscribe to receive the latest news and updates from the university.
          </p>
          <form className="mt-4 flex gap-2" action="#">
            <input
              type="email"
              required
              placeholder="Your email address"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Goinze International School of Medical Health Science and Technology. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
