'use client';

import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { lecturerApi, type ExamRecord, type SchoolEvent } from '@/lib/api';
import { cn } from '@/lib/cn';

type CalType = 'Exam' | 'Event';

interface CalItem {
  id: string;
  dateKey: string;
  time: string;
  title: string;
  type: CalType;
  meta: string;
  sortKey: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const eventTypeStyles: Record<CalType, { dot: string; badge: string }> = {
  Exam: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  Event: { dot: 'bg-pink-500', badge: 'bg-pink-100 text-pink-700' },
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function toCalItem(
  id: string,
  iso: string,
  title: string,
  type: CalType,
  meta: string,
): CalItem | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    id,
    dateKey: toDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    title,
    type,
    meta,
    sortKey: d.getTime(),
  };
}

export default function CalendarPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      lecturerApi.exams().catch(() => [] as ExamRecord[]),
      lecturerApi.schoolEvents().catch(() => [] as SchoolEvent[]),
    ])
      .then(([examList, eventList]) => {
        if (cancelled) return;
        setExams(examList);
        setEvents(eventList);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    const list: CalItem[] = [];
    for (const exam of exams) {
      if (!exam.startsAt) continue;
      const item = toCalItem(
        `exam-${exam.id}`,
        exam.startsAt,
        exam.title,
        'Exam',
        exam.course?.code ?? '',
      );
      if (item) list.push(item);
    }
    for (const ev of events) {
      const item = toCalItem(`event-${ev.id}`, ev.startsAt, ev.title, 'Event', ev.location ?? '');
      if (item) list.push(item);
    }
    return list;
  }, [exams, events]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalItem[]> = {};
    for (const item of items) {
      (map[item.dateKey] ??= []).push(item);
    }
    return map;
  }, [items]);

  const { year, month } = cursor;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayKey = toDateKey(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );

  const selectedEvents = (eventsByDate[selectedDate] ?? []).sort((a, b) => a.sortKey - b.sortKey);
  const upcoming = items
    .filter((i) => i.dateKey >= todayKey)
    .sort((a, b) => a.sortKey - b.sortKey);

  function shiftMonth(delta: number) {
    setCursor(({ year: y, month: m }) => {
      const d = new Date(y, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Your exam schedule and school events at a glance."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Month grid */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title={monthLabel}
              action={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              }
            />
            <CardBody>
              {loading ? (
                <p className="py-16 text-center text-sm text-slate-400">Loading calendar…</p>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((d) => (
                      <div
                        key={d}
                        className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        {d}
                      </div>
                    ))}
                    {cells.map((day, i) => {
                      if (day === null) {
                        return <div key={`empty-${i}`} className="min-h-20 rounded-lg" />;
                      }
                      const key = toDateKey(year, month, day);
                      const dayEvents = eventsByDate[key] ?? [];
                      const isToday = key === todayKey;
                      const isSelected = key === selectedDate;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDate(key)}
                          className={cn(
                            'flex min-h-20 flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors',
                            isSelected
                              ? 'border-brand bg-brand/5'
                              : 'border-slate-100 hover:border-brand/40 hover:bg-slate-50',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                              isToday ? 'bg-brand text-white' : 'text-slate-700',
                            )}
                          >
                            {day}
                          </span>
                          <span className="flex flex-wrap gap-1">
                            {dayEvents.slice(0, 3).map((ev) => (
                              <span
                                key={ev.id}
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  eventTypeStyles[ev.type].dot,
                                )}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                    {Object.entries(eventTypeStyles).map(([type, style]) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500"
                      >
                        <span className={cn('h-2 w-2 rounded-full', style.dot)} /> {type}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={
                selectedDate === todayKey
                  ? "Today's Agenda"
                  : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
              }
              subtitle={`${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'}`}
            />
            <CardBody className="space-y-3">
              {selectedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{ev.title}</p>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          eventTypeStyles[ev.type].badge,
                        )}
                      >
                        {ev.type}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {ev.time}
                      </span>
                      {ev.meta && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {ev.meta}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              {selectedEvents.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  No events on this day.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Upcoming" subtitle="Next scheduled items" />
            <CardBody className="space-y-2.5">
              {upcoming.slice(0, 6).map((ev) => (
                <div key={ev.id} className="flex items-center gap-3">
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', eventTypeStyles[ev.type].dot)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{ev.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(ev.sortKey).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {ev.time}
                      {ev.meta ? ` · ${ev.meta}` : ''}
                    </p>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  Nothing scheduled ahead.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
