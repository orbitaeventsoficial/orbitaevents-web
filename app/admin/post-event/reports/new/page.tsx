'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { log } from '@/lib/logger';

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingId) {
      fetch(`/api/admin/bookings/${bookingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.booking) {
            setBooking(data.booking);
          }
        })
        .catch(err => log.error('Error loading booking', err));
    }
  }, [bookingId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bookingId) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/post-event/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          eventSummary: formData.get('eventSummary'),
          setupTime: formData.get('setupTime'),
          startTime: formData.get('startTime'),
          endTime: formData.get('endTime'),
          soundQuality: formData.get('soundQuality'),
          danceFloorLevel: formData.get('danceFloorLevel'),
          musicStyles: formData.get('musicStyles'),
          incidents: formData.get('incidents'),
          notes: formData.get('notes'),
          status: formData.get('status'),
        }),
      });

      if (res.ok) {
        router.push('/admin/post-event/reports');
      } else {
        alert('Error creant informe');
      }
    } catch (error) {
      log.error('Error creating report', error);
      alert('Error creant informe');
    } finally {
      setLoading(false);
    }
  }

  if (!bookingId) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700">❌ No s&apos;ha especificat cap reserva</p>
          <Link href="/admin/post-event" className="text-red-600 hover:underline mt-2 inline-block">
            Tornar a Post-Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          📝 Nou Informe Post-Event
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Completa aquest informe després de l&apos;event
        </p>
      </header>

      {booking && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900">Event: {booking.clientName}</h3>
          <p className="text-sm text-blue-700 mt-1">
            {new Date(booking.eventDate).toLocaleDateString('ca-ES')} · {booking.eventLocation}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
        {/* Event Summary */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Resum de l&apos;Event *
          </label>
          <textarea
            name="eventSummary"
            required
            rows={4}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="Descriu com va anar l'event en general..."
          />
        </div>

        {/* Timing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hora muntatge
            </label>
            <input
              type="time"
              name="setupTime"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hora inici
            </label>
            <input
              type="time"
              name="startTime"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hora final
            </label>
            <input
              type="time"
              name="endTime"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Quality Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Qualitat del So (1-5)
            </label>
            <input
              type="number"
              name="soundQuality"
              min="1"
              max="5"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nivell Pista (1-5)
            </label>
            <input
              type="number"
              name="danceFloorLevel"
              min="1"
              max="5"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Music Styles */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estils Musicals
          </label>
          <input
            type="text"
            name="musicStyles"
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="Reggaeton, House, Comercial..."
          />
        </div>

        {/* Incidents */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Incidències
          </label>
          <textarea
            name="incidents"
            rows={3}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="Descriu qualsevol incidència o problema..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes Addicionals
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="Qualsevol altra informació rellevant..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estat
          </label>
          <select
            name="status"
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="DRAFT">Esborrany</option>
            <option value="COMPLETED">Completat</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-rose-600 disabled:opacity-50"
          >
            {loading ? 'Guardant...' : '💾 Guardar Informe'}
          </button>
          <Link
            href="/admin/post-event"
            className="px-6 py-3 bg-stone-100 text-slate-700 rounded-lg font-medium hover:bg-stone-200"
          >
            Cancel·lar
          </Link>
        </div>
      </form>
    </div>
  );
}
