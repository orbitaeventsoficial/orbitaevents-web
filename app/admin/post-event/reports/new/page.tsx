'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { log } from '@/lib/logger';
import { AdminPage } from '../../../components/AdminPage';

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<Array<{
    id: string;
    inventoryItem: { id: string; code: string; name: string; category: string; condition: string };
    checkedOut: boolean;
    checkedIn: boolean;
    conditionAfter: string | null;
  }>>([]);

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

      fetch(`/api/admin/bookings/${bookingId}/inventory`)
        .then(res => res.json())
        .then(data => {
          if (data.assignedItems) {
            setInventoryItems(data.assignedItems);
          }
        })
        .catch(() => { /* inventory not available */ });
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
        <div className="border rounded-xl p-6">
          <p className="">❌ No s&apos;ha especificat cap reserva</p>
          <Link href="/admin/post-event" className="hover:underline mt-2 inline-block">
            Tornar a Post-event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminPage
      title="Nou Informe Post-event"
      subtitle="Completa aquest informe després de l'event"
      back={{ href: '/admin/post-event/reports', label: 'Informes' }}
    >

      {booking && (
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold">Event: {booking.clientName}</h3>
          <p className="text-sm mt-1">
            {new Date(booking.eventDate).toLocaleDateString('ca-ES')} · {booking.eventLocation}
          </p>
        </div>
      )}

      {/* Inventory used */}
      {inventoryItems.length > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Equipament utilitzat ({inventoryItems.length})</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {inventoryItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
              >
                <span className="text-xs font-mono font-bold">{item.inventoryItem.code}</span>
                <span className="text-sm flex-1 truncate">{item.inventoryItem.name}</span>
                {item.checkedIn && (
                  <span className="text-[10px] rounded-full px-2 py-0.5">Retornat</span>
                )}
                {item.conditionAfter && item.conditionAfter !== item.inventoryItem.condition && (
                  <span className="text-[10px] rounded-full px-2 py-0.5">
                    {item.conditionAfter}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border border-white/10 rounded-xl p-6 space-y-6">
        {/* Event Summary */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Resum de l&apos;Event *
          </label>
          <textarea
            name="eventSummary"
            required
            rows={4}
            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            placeholder="Descriu com va anar l'event en general..."
          />
        </div>

        {/* Timing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Hora muntatge
            </label>
            <input
              type="time"
              name="setupTime"
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Hora inici
            </label>
            <input
              type="time"
              name="startTime"
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Hora final
            </label>
            <input
              type="time"
              name="endTime"
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            />
          </div>
        </div>

        {/* Quality Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Qualitat del So (1-5)
            </label>
            <input
              type="number"
              name="soundQuality"
              min="1"
              max="5"
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Nivell Pista (1-5)
            </label>
            <input
              type="number"
              name="danceFloorLevel"
              min="1"
              max="5"
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            />
          </div>
        </div>

        {/* Music Styles */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Estils Musicals
          </label>
          <input
            type="text"
            name="musicStyles"
            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            placeholder="Reggaeton, House, Comercial..."
          />
        </div>

        {/* Incidents */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Incidències
          </label>
          <textarea
            name="incidents"
            rows={3}
            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            placeholder="Descriu qualsevol incidència o problema..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Notes Addicionals
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
            placeholder="Qualsevol altra informació rellevant..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Estat
          </label>
          <select
            name="status"
            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2"
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
            className="flex-1 px-6 py-3 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Guardant...' : '💾 Desar Informe'}
          </button>
          <Link
            href="/admin/post-event"
            className="px-6 py-3 bg-white/5 rounded-lg font-medium hover:bg-white/10"
          >
            Cancel·lar
          </Link>
        </div>
      </form>
    </AdminPage>
  );
}





