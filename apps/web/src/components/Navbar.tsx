"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";

type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Staff Directory", href: "/staff" },
      { label: "Alumni", href: "/alumni" },
    ],
  },
  {
    label: "Academics",
    children: [
      { label: "Programmes", href: "/academics" },
      { label: "Admission", href: "/admission" },
    ],
  },
  {
    label: "Media",
    children: [
      { label: "News", href: "/news" },
      { label: "Events", href: "/events" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Flip to the blue variant only after the user scrolls past the hero
  // (or top banner) section; fall back to a viewport-height threshold.
  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const threshold = hero
        ? hero.offsetTop + hero.offsetHeight - 80
        : window.innerHeight * 0.5;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const onBlue = scrolled;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 pb-1 sm:px-6">
      <nav
        className={`mx-auto w-full max-w-7xl rounded-full border-2 shadow-lg transition-colors duration-300 lg:w-[80%] ${
          onBlue
            ? "border-white bg-brand text-white shadow-brand-dark/30"
            : "border-brand bg-white text-slate-700 shadow-slate-900/10"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0.5 ${
                onBlue ? "bg-white" : ""
              }`}
            >
              <Image
                src="/logo.png"
                alt="Goinzeschool logo"
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
                priority
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className={`text-[11px] font-bold uppercase tracking-wide ${onBlue ? "text-white" : "text-brand"}`}>
                Goinze International School
              </span>
              <span className={`text-[9px] font-medium uppercase tracking-wider ${onBlue ? "text-blue-100" : "text-slate-500"}`}>
                of Medical Health Science and Technology
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <button
                    type="button"
                    className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      onBlue
                        ? "text-white hover:bg-white/15"
                        : "text-slate-700 hover:bg-blue-50 hover:text-brand"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-brand"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    onBlue
                      ? "text-white hover:bg-white/15"
                      : "text-slate-700 hover:bg-blue-50 hover:text-brand"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>

          <div className="hidden items-center gap-2 xl:flex">
            <a
              href="http://localhost:3002"
              className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                onBlue
                  ? "border-white bg-white text-brand hover:bg-blue-50"
                  : "border-brand bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              Portal
            </a>
            <Link
              href="/admission"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Apply
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className={`rounded-full p-2 transition-colors xl:hidden ${
              onBlue ? "text-white hover:bg-white/15" : "text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mx-auto mt-2 w-full max-w-7xl rounded-3xl bg-white shadow-xl xl:hidden lg:w-[80%]">
          <div className="space-y-1 px-4 py-4">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="pb-1">
                  <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-brand"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-brand"
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="flex flex-col gap-3 pt-3">
              <a
                href="http://localhost:3002"
                className="rounded-full border-2 border-brand bg-brand px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Portal
              </a>
              <Link
                href="/admission"
                onClick={() => setOpen(false)}
                className="rounded-full bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Apply
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
