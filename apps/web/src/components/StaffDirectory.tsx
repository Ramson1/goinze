"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Search } from "lucide-react";
import Card from "./Card";
import { staffApi, type StaffDirectoryRecord } from "@/lib/api";
import { initialsOf } from "@/lib/content";

function displayName(member: StaffDirectoryRecord) {
  return [member.title, member.firstName, member.lastName].filter(Boolean).join(" ");
}

/**
 * Searchable staff directory grid, backed by the public staff directory API.
 */
export default function StaffDirectory() {
  const [staff, setStaff] = useState<StaffDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    staffApi
      .directory()
      .then((res) => active && setStaff(res))
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return staff;
    return staff.filter(
      (member) =>
        displayName(member).toLowerCase().includes(q) ||
        (member.designation ?? "").toLowerCase().includes(q) ||
        (member.department?.name ?? "").toLowerCase().includes(q),
    );
  }, [staff, query]);

  if (loading) {
    return <p className="py-16 text-center text-slate-500">Loading directory…</p>;
  }

  return (
    <div>
      <div className="relative mx-auto w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, role or department..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">
          {staff.length === 0
            ? "The staff directory is being updated — please check back soon."
            : "No staff members match your search."}
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <Card key={member.id} hover className="p-6 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-xl font-bold text-white">
                {initialsOf(displayName(member))}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{displayName(member)}</h3>
              {member.designation && (
                <p className="text-sm font-medium text-brand">{member.designation}</p>
              )}
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                {member.department?.name ?? (member.isLecturer ? "Academic Staff" : "Staff")}
              </p>
              {member.email && (
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <p className="flex items-center justify-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-brand" />
                    {member.email}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
