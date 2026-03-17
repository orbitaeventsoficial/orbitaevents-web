/**
 * Booking Form Component
 * Public form for creating reservations without payment
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Pack {
  id: string;
  slug: string;
  name: string;
  price: number;
  extraHourPrice?: number;
  djHours: number;
}

interface Extra {
  id: string;
  slug: string;
  name: string;
  price: number;
}

interface BookingFormProps {
  packs: Pack[];
  extras: Extra[];
  preselectedDate?: string;
  locale?: string;
}

export function BookingForm({ packs, extras, preselectedDate, locale = 'es' }: BookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventType: 'WEDDING',
    eventDate: preselectedDate || '',
    eventStartTime: '20:00',
    eventEndTime: '03:00',
    eventLocation: '',
    eventVenue: '',
    guestCount: 100,
    packId: '',
    extraIds: [] as string[],
    extraHours: 0,
    notes: '',
  });

  // Calculate total price
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    let total = 0;

    // Add pack price
    const selectedPack = packs.find((p) => p.id === formData.packId);
    if (selectedPack) {
      total += selectedPack.price;

      // Add extra hours
      if (formData.extraHours > 0 && selectedPack.extraHourPrice) {
        total += formData.extraHours * selectedPack.extraHourPrice;
      }
    }

    // Add extras price
    formData.extraIds.forEach((extraId) => {
      const extra = extras.find((e) => e.id === extraId);
      if (extra) {
        total += extra.price;
      }
    });

    setTotalPrice(total);
  }, [formData.packId, formData.extraIds, formData.extraHours, packs, extras]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          preferredLocale: locale,
          guestCount: Number(formData.guestCount),
          extraHours: Number(formData.extraHours),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear la reserva');
      }

      setSuccess(true);

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push(`/reserva-confirmada?ref=${data.data.reference}`);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la reserva. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraToggle = (extraId: string) => {
    setFormData((prev) => ({
      ...prev,
      extraIds: prev.extraIds.includes(extraId)
        ? prev.extraIds.filter((id) => id !== extraId)
        : [...prev.extraIds, extraId],
    }));
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg className="w-20 h-20 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4 text-white">¡Reserva Confirmada!</h2>
        <p className="text-white/70 mb-4">
          Recibirás un email de confirmación en breve.
        </p>
        <div className="animate-pulse text-purple-400">
          Redirigiendo...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Client Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Tus Datos
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              placeholder="tu@email.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              required
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              placeholder="+34 600 000 000"
            />
          </div>
        </div>
      </div>

      {/* Event Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Detalles del Evento
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Tipo de evento *
            </label>
            <select
              required
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="WEDDING">Boda</option>
              <option value="BIRTHDAY">Cumpleaños</option>
              <option value="CORPORATE">Evento Corporativo</option>
              <option value="PRIVATE_PARTY">Fiesta Privada</option>
              <option value="THEMED_PARTY">Fiesta Temática</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Fecha del evento *
            </label>
            <input
              type="date"
              required
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Hora de inicio
            </label>
            <input
              type="time"
              value={formData.eventStartTime}
              onChange={(e) => setFormData({ ...formData, eventStartTime: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Hora de fin
            </label>
            <input
              type="time"
              value={formData.eventEndTime}
              onChange={(e) => setFormData({ ...formData, eventEndTime: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Ubicación *
            </label>
            <input
              type="text"
              required
              value={formData.eventLocation}
              onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              placeholder="Barcelona, Girona..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Local/Recinto (opcional)
            </label>
            <input
              type="text"
              value={formData.eventVenue}
              onChange={(e) => setFormData({ ...formData, eventVenue: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              placeholder="Nombre del local"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Número de invitados *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Pack Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Selecciona tu Pack
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {packs.map((pack) => (
            <label
              key={pack.id}
              htmlFor={`pack-${pack.id}`}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all
                ${formData.packId === pack.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
                }
              `}
            >
              <input
                type="radio"
                id={`pack-${pack.id}`}
                name="pack"
                value={pack.id}
                checked={formData.packId === pack.id}
                onChange={(e) => setFormData({ ...formData, packId: e.target.value })}
                className="sr-only"
                required
              />
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white">{pack.name}</h4>
                <span className="text-2xl font-bold text-purple-400">{pack.price}€</span>
              </div>
              <p className="text-sm text-white/60">{pack.djHours}h de servicio</p>
              {pack.extraHourPrice && (
                <p className="text-xs text-white/60 mt-2">
                  +{pack.extraHourPrice}€/h extra
                </p>
              )}
            </label>
          ))}
        </div>

        {/* Extra Hours */}
        {packs.find((p) => p.id === formData.packId)?.extraHourPrice && (
          <div>
            <label htmlFor="extra-hours" className="block text-sm font-medium text-white/70 mb-2">
              Horas extra (opcional)
            </label>
            <input
              type="number"
              id="extra-hours"
              name="extraHours"
              min="0"
              max="10"
              value={formData.extraHours}
              onChange={(e) => setFormData({ ...formData, extraHours: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        )}
      </div>

      {/* Extras Selection */}
      {extras.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Extras (Opcional)
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {extras.map((extra) => (
              <label
                key={extra.id}
                htmlFor={`booking-extra-${extra.id}`}
                className={`
                  relative p-4 rounded-lg border cursor-pointer transition-all
                  ${formData.extraIds.includes(extra.id)
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                  }
                `}
              >
                <input
                  type="checkbox"
                  id={`booking-extra-${extra.id}`}
                  name={`booking-extra-${extra.id}`}
                  checked={formData.extraIds.includes(extra.id)}
                  onChange={() => handleExtraToggle(extra.id)}
                  className="sr-only"
                />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">{extra.name}</span>
                  <span className="text-lg font-bold text-purple-400">+{extra.price}€</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
          placeholder="Cuéntanos más detalles sobre tu evento..."
        />
      </div>

      {/* Total Price */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <span className="text-xl text-white/70">Total estimado:</span>
          <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {totalPrice}€
          </span>
        </div>
        <p className="text-sm text-white/50 mt-2">
          * Precio final sujeto a confirmación
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white text-lg transition-all shadow-lg hover:shadow-purple-500/50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </span>
        ) : (
          'Confirmar Reserva'
        )}
      </button>

      <p className="text-center text-sm text-white/50">
        Al confirmar, aceptas nuestros{' '}
        <a href="/legal/terminos" className="text-purple-400 hover:underline">
          términos y condiciones
        </a>
      </p>
    </form>
  );
}


