"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Cog,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import Card from "@/components/Card";
import {
  academicsApi,
  type FacultyRecord,
  type ProgrammeRecord,
} from "@/lib/api";

const iconCycle: LucideIcon[] = [
  FlaskConical,
  Cog,
  Briefcase,
  HeartPulse,
  BookOpen,
  GraduationCap,
];

export default function AcademicsPage() {
  const [faculties, setFaculties] = useState<FacultyRecord[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([academicsApi.faculties(), academicsApi.programmes()])
      .then(([facRes, progRes]) => {
        if (!active) return;
        if (facRes.status === "fulfilled") setFaculties(facRes.value);
        if (progRes.status === "fulfilled") setProgrammes(progRes.value);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Index programmes by department id so each faculty can list its own.
  const programmesByDept = useMemo(() => {
    const map = new Map<string, ProgrammeRecord[]>();
    for (const prog of programmes) {
      if (!prog.department) continue;
      const list = map.get(prog.department.id) ?? [];
      list.push(prog);
      map.set(prog.department.id, list);
    }
    return map;
  }, [programmes]);

  return (
    <>
      <PageHeader
        breadcrumb="Academics"
        title="Academics"
        subtitle="Explore our faculties, departments and the programmes they offer."
      />

      <Section>
        {loading ? (
          <p className="py-16 text-center text-slate-500">Loading academics…</p>
        ) : faculties.length === 0 ? (
          <p className="py-16 text-center text-slate-500">
            Faculty information is being updated — please check back soon.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {faculties.map((faculty, index) => {
              const Icon = iconCycle[index % iconCycle.length];
              const facultyProgrammes = faculty.departments.flatMap(
                (dept) => programmesByDept.get(dept.id) ?? [],
              );
              return (
                <Card key={faculty.id} hover className="p-8">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{faculty.name}</h2>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {faculty.code}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Departments
                      </h3>
                      {faculty.departments.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">—</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {faculty.departments.map((dept) => (
                            <li
                              key={dept.id}
                              className="flex items-center gap-2 text-sm text-slate-700"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
                              {dept.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Programmes
                      </h3>
                      {facultyProgrammes.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">—</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {facultyProgrammes.map((prog) => (
                            <li key={prog.id} className="text-sm">
                              <p className="font-medium text-slate-800">{prog.name}</p>
                              <p className="text-xs text-slate-500">
                                {prog.degreeType ?? "Programme"} · {prog.durationYears} years
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {/* Academic calendar note */}
      <Section className="bg-slate-50">
        <Card className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Flexible learning pathways</h2>
            <p className="mt-1 text-sm text-slate-600">
              Most undergraduate programmes run on a two-semester academic calendar, with
              options for sandwich and part-time study. Postgraduate programmes offer
              taught and research tracks to suit your goals.
            </p>
          </div>
        </Card>
      </Section>
    </>
  );
}
