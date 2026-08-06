"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import Card from "@/components/Card";
import Container from "@/components/Container";
import { websiteApi, type EventRecord } from "@/lib/api";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function eventDay(iso: string) {
  return String(new Date(iso).getDate()).padStart(2, "0");
}

function eventMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short" });
}

function eventDateRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (!end) {
    return `${fmtDate(start)} • ${fmtTime(start)}`;
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${fmtDate(start)} • ${fmtTime(start)} – ${fmtTime(end)}`;
  }

  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

function buildCalendar(year: number, monthIndex: number, events: EventRecord[]) {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const eventDays = new Set(
    events
      .map((e) => new Date(e.startsAt))
      .filter((d) => d.getFullYear() === year && d.getMonth() === monthIndex)
      .map((d) => d.getDate()),
  );

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === monthIndex;

  return {
    monthLabel: new Date(year, monthIndex).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    cells,
    eventDays,
    today: isCurrentMonth ? now.getDate() : -1,
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    let active = true;
    websiteApi
      .events()
      .then((res) => active && setEvents(res))
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const calendar = useMemo(() => buildCalendar(calYear, calMonth, events), [calYear, calMonth, events]);

  function goToPrevMonth() {
    setCalMonth((m) => {
      if (m === 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goToNextMonth() {
    setCalMonth((m) => {
      if (m === 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function goToToday() {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
  }

  return (
    <>
      <PageHeader
        breadcrumb="Events"
        title="University Events"
        subtitle="Upcoming events, ceremonies and activities across campus."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Upcoming list */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
            {loading ? (
              <p className="mt-6 text-slate-500">Loading events…</p>
            ) : events.length === 0 ? (
              <p className="mt-6 text-slate-500">No events scheduled right now — check back soon.</p>
            ) : (
              <div className="mt-6 space-y-5">
                {events.map((event) => (
                  <Card key={event.id} hover className="flex gap-5 p-6">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand text-white">
                      <span className="text-2xl font-extrabold leading-none">
                        {eventDay(event.startsAt)}
                      </span>
                      <span className="text-xs font-semibold uppercase">
                        {eventMonth(event.startsAt)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                      {event.description && (
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-brand" />
                          {eventDateRange(event.startsAt, event.endsAt)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-brand" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900">Calendar</h2>
            <Card className="mt-6 p-6">
              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-semibold text-brand">{calendar.monthLabel}</p>
                  <button
                    type="button"
                    onClick={goToToday}
                    className="text-xs text-slate-400 transition hover:text-brand"
                  >
                    Today
                  </button>
                </div>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {weekdays.map((d) => (
                  <div key={d} className="py-1 text-xs font-semibold uppercase text-slate-400">
                    {d}
                  </div>
                ))}
                {calendar.cells.map((day, i) =>
                  day === null ? (
                    <div key={`empty-${i}`} />
                  ) : (
                    <div
                      key={day}
                      className={`flex h-9 items-center justify-center rounded-lg text-sm ${
                        calendar.eventDays.has(day)
                          ? "bg-brand font-bold text-white"
                          : day === calendar.today
                            ? "border border-brand font-semibold text-brand"
                            : "text-slate-700"
                      }`}
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-brand" /> Event day
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-brand" /> Today
                </span>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* CTA strip */}
      <div className="bg-gradient-to-r from-brand-dark to-brand">
        <Container className="py-10 text-center">
          <p className="text-lg font-semibold text-white">
            Want to host an event on campus?
          </p>
          <p className="mt-1 text-sm text-white/85">
            Reach out to the Directorate of Events to book a venue.
          </p>
        </Container>
      </div>
    </>
  );
}
