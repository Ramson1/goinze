"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
};

const slides: Slide[] = [
  // Campus buildings
  {
    image: "/hero/building-1.png",
    eyebrow: "Welcome",
    title: "Goinze International School of Medical Health Science and Technology",
    subtitle:
      "Learn how to maintain a good health — training health professionals who take primary health care down to the grass roots, from our campus in Bwari, Abuja.",
    cta: { label: "Apply Now", href: "/admission" },
  },
  {
    image: "/hero/building-2.png",
    eyebrow: "Our Campus",
    title: "A Serene, Purpose-Built Learning Environment",
    subtitle:
      "Modern lecture halls, laboratories, a library and hostels — everything a disciplined community of health learners needs to thrive.",
    cta: { label: "About the School", href: "/about" },
  },
  // Graduation & success stories
  {
    image: "/hero/graduation-1.png",
    eyebrow: "Graduation",
    title: "Your Journey Ends in a Cap and Gown",
    subtitle:
      "Every year we celebrate graduates who leave Goinze ready to serve their communities as licensed health professionals.",
    cta: { label: "Meet Our Alumni", href: "/alumni" },
  },
  {
    image: "/hero/graduation-2.jpeg",
    eyebrow: "Success Stories",
    title: "From Bwari to Health Facilities Nationwide",
    subtitle:
      "Our graduates work in hospitals, laboratories, pharmacies and public health agencies across Nigeria and beyond.",
    cta: { label: "Start Your Application", href: "/admission" },
  },
  // Laboratories
  {
    image: "/hero/anatomy-lab.png",
    eyebrow: "Anatomy Laboratory",
    title: "Understand the Human Body from First Principles",
    subtitle:
      "Hands-on anatomy sessions with models and specimens give our students a solid foundation for every health profession.",
    cta: { label: "Explore Programmes", href: "/academics" },
  },
  {
    image: "/hero/biology-lab.png",
    eyebrow: "Biology Laboratory",
    title: "Where the Science of Life Comes Alive",
    subtitle:
      "From cell biology to microscopy, students build practical laboratory skills that power careers in the health sciences.",
    cta: { label: "Explore Programmes", href: "/academics" },
  },
  {
    image: "/hero/chemistry-lab.png",
    eyebrow: "Chemistry Laboratory",
    title: "Practical Chemistry for Health Professionals",
    subtitle:
      "Fully equipped benches for general, organic and clinical chemistry — the backbone of laboratory and pharmaceutical training.",
    cta: { label: "Explore Programmes", href: "/academics" },
  },
  {
    image: "/hero/hematology-lab.png",
    eyebrow: "Hematology Laboratory",
    title: "Training the Next Generation of Lab Scientists",
    subtitle:
      "Students learn blood analysis, cell counting and diagnostic techniques used every day in hospitals and clinics.",
    cta: { label: "Medical Laboratory Programmes", href: "/academics" },
  },
  {
    image: "/hero/microbiology-lab.png",
    eyebrow: "Microbiology Laboratory",
    title: "Fighting Disease Starts with Understanding It",
    subtitle:
      "Culturing, staining and identifying microorganisms — practical skills for public health, community health and lab technicians.",
    cta: { label: "Explore Programmes", href: "/academics" },
  },
  {
    image: "/hero/pathology-lab.png",
    eyebrow: "Pathology Laboratory",
    title: "Learn to Read What the Body Is Saying",
    subtitle:
      "Our pathology lab trains students to recognise disease processes and support accurate clinical diagnosis.",
    cta: { label: "Explore Programmes", href: "/academics" },
  },
  {
    image: "/hero/pharmacology-lab.png",
    eyebrow: "Pharmacology Laboratory",
    title: "The Science Behind Every Safe Medicine",
    subtitle:
      "Pharmaceutical Technology students gain hands-on experience in drug preparation, dosage and safe dispensing practice.",
    cta: { label: "Pharmaceutical Technology", href: "/academics" },
  },
  {
    image: "/hero/physiology-lab.png",
    eyebrow: "Physiology Laboratory",
    title: "Explore How the Human Body Really Works",
    subtitle:
      "Practical physiology sessions connect classroom theory to living systems — from vital signs to organ function.",
    cta: { label: "Explore Programmes", href: "/academics" },
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), []);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div
      id="site-hero"
      data-hero
      className="relative h-[520px] w-full overflow-hidden sm:h-[600px]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          {/* Background image */}
          <Image
            src={slide.image}
            alt={slide.eyebrow}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-brand-dark/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl pt-16 text-white">
                <span className="inline-flex items-center rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  {slide.eyebrow}
                </span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {slide.title}
                </h1>
                <p className="mt-5 text-base text-white/90 sm:text-lg">{slide.subtitle}</p>
                <Link
                  href={slide.cta.href}
                  className="mt-8 inline-flex items-center rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  {slide.cta.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/40"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/40"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.image}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
