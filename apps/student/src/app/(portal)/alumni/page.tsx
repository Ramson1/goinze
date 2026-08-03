'use client';

import { useEffect, useState } from 'react';
import { Users, Briefcase, GraduationCap, Loader2 } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { contentApi } from '@/lib/api';

interface AlumniStory {
  name: string;
  graduationYear: string;
  programme: string;
  currentRole: string;
  company: string;
  story: string;
}

/**
 * Alumni spotlight stories are managed in the Website CMS under the
 * `alumni.stories` content block (body: { stories: [...] }).
 */
function parseStories(body: unknown): AlumniStory[] {
  const raw = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { stories?: unknown }).stories)
      ? (body as { stories: unknown[] }).stories
      : [];
  return raw
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
    .map((s) => ({
      name: typeof s.name === 'string' ? s.name : 'Alumnus',
      graduationYear: typeof s.graduationYear === 'string' ? s.graduationYear : String(s.graduationYear ?? '—'),
      programme: typeof s.programme === 'string' ? s.programme : '',
      currentRole: typeof s.currentRole === 'string' ? s.currentRole : '',
      company: typeof s.company === 'string' ? s.company : '',
      story: typeof s.story === 'string' ? s.story : '',
    }))
    .filter((s) => s.name !== 'Alumnus' || s.story);
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<AlumniStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi
      .content()
      .then((blocks) => {
        const block = blocks.find((b) => b.key === 'alumni.stories');
        setAlumni(block ? parseStories(block.body) : []);
      })
      .catch(() => setAlumni([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Alumni"
        description="See where Goinzeschool graduates are building their careers."
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-brand-dark">
        <Users className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Join the alumni network</p>
          <p className="mt-0.5 opacity-90">
            Connect with mentors, find internships and give back. The alumni office pairs final-year
            students with graduates in their field.
          </p>
        </div>
      </div>

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading alumni stories…
        </Card>
      )}

      {!loading && alumni.length === 0 && (
        <Card className="p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">Alumni spotlights coming soon</p>
          <p className="mt-1 text-xs text-slate-400">
            The alumni office hasn't published any graduate stories yet. Check back later.
          </p>
        </Card>
      )}

      {!loading && alumni.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {alumni.map((a, i) => (
            <Card key={`${a.name}-${i}`} hover className="p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-lg font-bold text-white">
                  {a.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900">{a.name}</h2>
                  {(a.currentRole || a.company) && (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-brand">
                      <Briefcase className="h-3.5 w-3.5" /> {a.currentRole}
                      {a.company ? ` · ${a.company}` : ''}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <GraduationCap className="h-3.5 w-3.5" /> Class of {a.graduationYear}
                    {a.programme ? ` · ${a.programme}` : ''}
                  </p>
                </div>
              </div>
              {a.story && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
                  {a.story}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
