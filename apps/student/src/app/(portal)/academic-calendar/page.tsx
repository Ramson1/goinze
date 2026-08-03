'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDays,
  GraduationCap,
  BookOpen,
  Coffee,
  Award,
  AlarmClock,
  Loader2,
  MapPin,
} from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { contentApi, type EventRecord } from '@/lib/api';
import { cn } from '@/lib/utils';

type CalendarEventType =
  | 'Resumption'
  | 'Academic'
  | 'Exam'
  | 'Break'
  | 'Ceremony'
  | 'Deadline';

const typeConfig: Record<CalendarEventType, { cls: string; dot: string; icon: typeof BookOpen }> = {
  Resumption: { cls: 'bg-blue-50 text-brand', dot: 'bg-brand', icon: GraduationCap },
  Academic: { cls: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500', icon: BookOpen },
  Exam: { cls: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', icon: AlarmClock },
  Break: { cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', icon: Coffee },
  Ceremony: { cls: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500', icon: Award },
  Deadline: { cls: 'bg-red-50 text-red-700', dot: 'bg-red-500', icon: AlarmClock },
};

/** Derive a calendar category from the event title (the CMS stores free-form events). */
function inferType(title: string): CalendarEventType {
  const t = title.toLowerCase();
  if (/exam|test|cbt/.test(t)) return 'Exam';
  if (/break|holiday|vacation/.test(t)) return 'Break';
  if (/ceremony|convocation|matric|award/.test(t)) return 'Ceremony';
  if (/deadline|closes|last day|due/.test(t)) return 'Deadline';
  if (/resum|registration|resume/.test(t)) return 'Resumption';
  return 'Academic';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contentApi
      .events()
      .then((list) =>
        setEvents(
          [...list].sort(
            (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          ),
        ),
      )
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load the calendar.'))
      .finally(() => setLoading(false));
  }, []);

  // Group events by month, preserving chronological order.
  const groups = events.reduce<Array<{ month: string; events: EventRecord[] }>>((acc, ev) => {
    const m = monthLabel(ev.startsAt);
    const last = acc[acc.length - 1];
    if (last && last.month === m) last.events.push(ev);
    else acc.push({ month: m, events: [ev] });
    return acc;
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Academic Calendar"
        description="Key dates and events published by the university."
        actions={
          <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-brand">
            <CalendarDays className="h-4 w-4" /> Official Calendar
          </span>
        }
      />

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading calendar…
        </Card>
      )}

      {!loading && error && (
        <Card className="p-10 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && events.length === 0 && (
        <Card className="p-10 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No events published yet</p>
          <p className="mt-1 text-xs text-slate-400">
            The academic calendar will appear here once the university publishes its key dates.
          </p>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.month}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                {group.month}
              </h2>
              <div className="relative space-y-4 pl-6">
                {/* Vertical line */}
                <span className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200" aria-hidden="true" />

                {group.events.map((ev) => {
                  const type = inferType(ev.title);
                  const cfg = typeConfig[type];
                  const Icon = cfg.icon;
                  return (
                    <div key={ev.id} className="relative">
                      {/* Timeline dot */}
                      <span
                        className={cn('absolute -left-6 top-5 h-3.5 w-3.5 rounded-full ring-4 ring-white', cfg.dot)}
                        aria-hidden="true"
                      />
                      <Card hover className="p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3.5">
                            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', cfg.cls)}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">{ev.title}</h3>
                                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', cfg.cls)}>
                                  {type}
                                </span>
                              </div>
                              {ev.description && (
                                <p className="mt-1 text-sm leading-relaxed text-slate-500">{ev.description}</p>
                              )}
                              {ev.location && (
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                  <MapPin className="h-3.5 w-3.5" /> {ev.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-slate-800">{formatDate(ev.startsAt)}</p>
                            {ev.endsAt && (
                              <p className="text-xs text-slate-400">→ {formatDate(ev.endsAt)}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
