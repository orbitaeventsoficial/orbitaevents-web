/**
import { log } from '@/lib/logger';
 * ADMIN EVENTS PASSATS
 * ====================
 * Panel per veure events passats i enviar seqüències post-event
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { log } from '@/lib/logger';

interface Booking {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type: string;
  event_date: string;
  event_location?: string;
  status: string;
  review_requested_at?: string;
  post_event_sent_at?: string;
  total_price?: number;
  notes?: string;
}

export default function AdminEventsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'sent' | 'all'>('pending');
  const [sending, setSending] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [daysAgo, setDaysAgo] = useState(7); // Events dels últims X dies

  // Obtenir credencials
  const getAuthHeaders = (): Record<string, string> => {
    const credentials = localStorage.getItem('admin_credentials');
    if (credentials) {
      return { Authorization: `Basic ${btoa(credentials)}` };
    }
    return {};
  };

  // Carregar bookings
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/events?status=completed&days=${daysAgo}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      }
    } catch (error) {
      log.error('Error carregant bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [daysAgo]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Filtrar bookings
  const filteredBookings = bookings.filter((booking) => {
    // Filtre per cerca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !booking.client_name?.toLowerCase().includes(search) &&
        !booking.client_email?.toLowerCase().includes(search) &&
        !booking.reference?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Filtre per estat d'enviament
    if (filter === 'pending') {
      return !booking.post_event_sent_at;
    } else if (filter === 'sent') {
      return !!booking.post_event_sent_at;
    }
    return true;
  });

  // Enviar seqüència post-event
  const sendPostEvent = async (booking: Booking) => {
    if (!confirm(`Enviar seqüència post-event a ${booking.client_name}?`)) return;

    setSending(booking.id);
    try {
      // Primer, buscar o crear customer
      const customerResponse = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: booking.client_name,
          email: booking.client_email,
          phone: booking.client_phone,
          source: 'booking',
        }),
      });

      let customerId: string | null = null;
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customerId = customerData.data?.id;
      } else if (customerResponse.status === 409) {
        // Ja existeix, buscar-lo
        const listResponse = await fetch(
          `/api/admin/customers?email=${encodeURIComponent(booking.client_email)}`,
          { headers: getAuthHeaders() }
        );
        if (listResponse.ok) {
          const listData = await listResponse.json();
          customerId = listData.data?.find(
            (c: { email: string }) => c.email === booking.client_email.toLowerCase()
          )?.id;
        }
      }

      if (!customerId) {
        throw new Error('No s\'ha pogut obtenir el customer');
      }

      // Enviar procés post-event
      const processResponse = await fetch('/api/admin/start-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          customerId,
          bookingId: booking.id,
          processType: 'post_event',
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Error enviant procés');
      }

      // Actualitzar booking amb data d'enviament
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          bookingId: booking.id,
          post_event_sent_at: new Date().toISOString(),
        }),
      });

      // Actualitzar llista
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, post_event_sent_at: new Date().toISOString() }
            : b
        )
      );

      alert('✅ Seqüència post-event enviada correctament!');
    } catch (error) {
      log.error('Error enviant post-event:', error);
      alert('❌ Error enviant la seqüència');
    } finally {
      setSending(null);
    }
  };

  // Enviar a tots els pendents
  const sendAllPending = async () => {
    const pendingBookings = filteredBookings.filter((b) => !b.post_event_sent_at);
    if (pendingBookings.length === 0) {
      alert('No hi ha events pendents d\'enviament');
      return;
    }

    if (
      !confirm(
        `Enviar seqüència post-event a ${pendingBookings.length} clients?`
      )
    )
      return;

    for (const booking of pendingBookings) {
      await sendPostEvent(booking);
      // Esperar entre enviaments per evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  // Event type badge color
  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      boda: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      corporativo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      privado: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      fiesta: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-100 text-black p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-400">📅 Events Passats</h1>
            <p className="text-gray-400 mt-1">
              Gestiona les seqüències post-event per als clients
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={sendAllPending}
              disabled={filteredBookings.filter((b) => !b.post_event_sent_at).length === 0}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Enviar a tots ({filteredBookings.filter((b) => !b.post_event_sent_at).length})
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Cerca */}
          <div>
            <input
              type="text"
              placeholder="Cercar per nom, email o referència..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Dies */}
          <div>
            <select
              value={daysAgo}
              onChange={(e) => setDaysAgo(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-black focus:outline-none focus:border-amber-500/50"
            >
              <option value={3}>Últims 3 dies</option>
              <option value={7}>Última setmana</option>
              <option value={14}>Últimes 2 setmanes</option>
              <option value={30}>Últim mes</option>
              <option value={90}>Últims 3 mesos</option>
            </select>
          </div>

          {/* Filtre estat */}
          <div className="flex gap-2">
            {[
              { value: 'pending', label: 'Pendents', icon: '⏳' },
              { value: 'sent', label: 'Enviats', icon: '✅' },
              { value: 'all', label: 'Tots', icon: '📋' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as typeof filter)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                  filter === f.value
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-100 text-gray-400 border border-transparent hover:bg-slate-200'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-end gap-4 text-sm">
            <span className="text-gray-400">
              Total: <span className="text-black font-semibold">{filteredBookings.length}</span>
            </span>
            <span className="text-amber-400">
              Pendents:{' '}
              <span className="font-semibold">
                {filteredBookings.filter((b) => !b.post_event_sent_at).length}
              </span>
            </span>
          </div>
        </div>

        {/* Llista */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto" />
            <p className="mt-4 text-gray-400">Carregant events...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-slate-100 rounded-xl border border-slate-200">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-400">No hi ha events amb els filtres seleccionats</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-6 rounded-xl border transition-all ${
                  booking.post_event_sent_at
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-slate-100 border-slate-200 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Info principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{booking.client_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getEventTypeColor(booking.event_type)}`}>
                        {booking.event_type}
                      </span>
                      {booking.post_event_sent_at && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          ✓ Enviat
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="text-gray-300">{booking.client_email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Data event:</span>
                        <p className="text-gray-300">
                          {format(new Date(booking.event_date), "d MMM yyyy", { locale: ca })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Referència:</span>
                        <p className="text-amber-400 font-mono">{booking.reference}</p>
                      </div>
                      {booking.event_location && (
                        <div>
                          <span className="text-gray-500">Lloc:</span>
                          <p className="text-gray-300">{booking.event_location}</p>
                        </div>
                      )}
                    </div>

                    {booking.post_event_sent_at && (
                      <p className="mt-3 text-xs text-gray-500">
                        Enviat el{' '}
                        {format(new Date(booking.post_event_sent_at), "d MMM yyyy 'a les' HH:mm", {
                          locale: ca,
                        })}
                      </p>
                    )}
                  </div>

                  {/* Accions */}
                  <div className="ml-4">
                    {!booking.post_event_sent_at ? (
                      <button
                        onClick={() => sendPostEvent(booking)}
                        disabled={sending === booking.id}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {sending === booking.id ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                            Enviant...
                          </>
                        ) : (
                          <>📧 Enviar Post-Event</>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => sendPostEvent(booking)}
                        disabled={sending === booking.id}
                        className="px-4 py-2 bg-slate-100 text-gray-400 rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
                      >
                        🔄 Re-enviar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <h4 className="font-semibold text-amber-400 mb-2">💡 Com funciona?</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Els events completats apareixen automàticament aquí després de la data</li>
            <li>• La seqüència post-event envia un email amb codi de descompte personalitzat</li>
            <li>• El client pot deixar una opinió per obtenir fins a 25% de descompte</li>
            <li>• Els codis es guarden automàticament a Supabase</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
