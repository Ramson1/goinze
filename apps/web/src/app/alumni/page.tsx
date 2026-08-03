"use client";

import { Award, Briefcase, GraduationCap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import Card from "@/components/Card";
import AlumniForm from "@/components/AlumniForm";
import {
  asArray,
  defaultAlumniStories,
  getBlockBody,
  initialsOf,
  useContentBlocks,
} from "@/lib/content";

export default function AlumniPage() {
  const { blocks } = useContentBlocks();

  const alumniStories = (() => {
    const cms = asArray(getBlockBody(blocks, "alumni.stories"));
    return cms.length > 0 ? cms : defaultAlumniStories;
  })();

  return (
    <>
      <PageHeader
        breadcrumb="Alumni"
        title="Alumni Network"
        subtitle="Stay connected with Goinze and celebrate the achievements of our graduates."
      />

      {/* Success stories */}
      <Section
        eyebrow="Inspiration"
        title="Alumni Success Stories"
        subtitle="Our graduates are making an impact around the world."
      >
        <div className="grid gap-8 sm:grid-cols-2">
          {alumniStories.map((story) => (
            <Card key={story.name} hover className="p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-lg font-bold text-white">
                  {story.initials ?? initialsOf(story.name ?? "")}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{story.name}</h3>
                  {story.currentRole && (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-brand">
                      <Briefcase className="h-3.5 w-3.5" />
                      {story.currentRole}
                    </p>
                  )}
                </div>
              </div>
              {story.story && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">"{story.story}"</p>
              )}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-xs">
                {story.programme && (
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-semibold text-brand">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {story.programme}
                  </span>
                )}
                {story.graduationYear && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
                    <Award className="h-3.5 w-3.5" />
                    Class of {story.graduationYear}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Registration form */}
      <Section
        className="bg-slate-50"
        eyebrow="Reconnect"
        title="Register as an Alumnus"
        subtitle="Join the alumni network to receive updates, invitations and mentorship opportunities."
      >
        <Card className="mx-auto max-w-3xl p-8">
          <AlumniForm />
        </Card>
      </Section>
    </>
  );
}
