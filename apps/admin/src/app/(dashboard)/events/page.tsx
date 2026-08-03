'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { eventsApi, type EventRecord } from '@/lib/api';

function eventStatus(e: EventRecord): string {
  const now = Date.now();
  const start = new Date(e.startsAt).getTime();
  const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
  if (now < start) return 'Upcoming';
  if (end != null && now > end) return 'Completed';
  return 'Ongoing';
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEvents(await eventsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await eventsApi.create({
        title: title.trim(),
        location: location.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        description: description.trim() || undefined,
      });
      setFormOpen(false);
      setTitle('');
      setLocation('');
      setStartsAt('');
      setEndsAt('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<EventRecord>[] = [
    {
      key: 'title',
      header: 'Event',
      render: (r) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900">{r.title}</p>
          {r.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{r.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'startsAt',
      header: 'Date',
      className: 'whitespace-nowrap',
      render: (r) => {
        const start = formatDateTime(r.startsAt);
        const end = formatDateTime(r.endsAt);
        return (
          <span className="text-gray-700">
            {start ?? '—'}
            {end ? <span className="text-gray-400"> → {end}</span> : null}
          </span>
        );
      },
    },
    {
      key: 'location',
      header: 'Venue',
      render: (r) => r.location ?? <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={eventStatus(r)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Plan and manage school events and ceremonies."
        action={
          <button type="button" onClick={() => setFormOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> New Event
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">Loading events…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={events}
            keyField="id"
            emptyMessage="No events scheduled yet."
          />
        )}
      </Card>

      {/* New event modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">New Event</h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">Event Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Matriculation Ceremony 2026"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Venue (optional)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Starts</label>
                  <input
                    required
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Ends (optional)</label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What should attendees expect…"
                  className="input resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  <Plus className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
