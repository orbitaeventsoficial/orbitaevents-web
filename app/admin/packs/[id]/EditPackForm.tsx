'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PackTranslation {
  locale: string;
  name: string;
  description: string | null;
  tagline: string | null;
  features: string[];
}

interface Pack {
  id: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  extraHourPrice: number;
  djHours: number;
  soundWatts: number;
  includesFog: boolean;
  includesMic: boolean;
  minGuests: number | null;
  maxGuests: number | null;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  translations: PackTranslation[];
}

export default function EditPackForm({ pack }: { pack: Pack }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    price: pack.price,
    originalPrice: pack.originalPrice || '',
    extraHourPrice: pack.extraHourPrice,
    djHours: pack.djHours,
    soundWatts: pack.soundWatts,
    includesFog: pack.includesFog,
    includesMic: pack.includesMic,
    minGuests: pack.minGuests || '',
    maxGuests: pack.maxGuests || '',
    isActive: pack.isActive,
    isFeatured: pack.isFeatured,
    order: pack.order,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/packs/${pack.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: parseFloat(formData.price.toString()),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice.toString()) : null,
          extraHourPrice: parseFloat(formData.extraHourPrice.toString()),
          djHours: parseInt(formData.djHours.toString()),
          soundWatts: parseInt(formData.soundWatts.toString()),
          includesFog: formData.includesFog,
          includesMic: formData.includesMic,
          minGuests: formData.minGuests ? parseInt(formData.minGuests.toString()) : null,
          maxGuests: formData.maxGuests ? parseInt(formData.maxGuests.toString()) : null,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          order: parseInt(formData.order.toString()),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error actualitzant pack');
      }

      setSuccess(true);
      router.refresh();

      // Redirect després d'1 segon
      setTimeout(() => {
        router.push('/admin/packs');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-800">✅ Pack actualitzat correctament!</p>
        </div>
      )}

      {/* Pricing Section */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">💰 Preus</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">
              Preu Base *
            </label>
            <div className="relative">
              <input
                type="number"
                id="price"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="block w-full rounded-md border-stone-300 pr-8 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 text-sm">
                €
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="originalPrice" className="block text-sm font-medium text-slate-700 mb-1">
              Preu Original
            </label>
            <div className="relative">
              <input
                type="number"
                id="originalPrice"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="block w-full rounded-md border-stone-300 pr-8 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
                placeholder="Opcional"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 text-sm">
                €
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="extraHourPrice" className="block text-sm font-medium text-slate-700 mb-1">
              Preu Hora Extra *
            </label>
            <div className="relative">
              <input
                type="number"
                id="extraHourPrice"
                step="0.01"
                required
                value={formData.extraHourPrice}
                onChange={(e) => setFormData({ ...formData, extraHourPrice: parseFloat(e.target.value) || 0 })}
                className="block w-full rounded-md border-stone-300 pr-8 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 text-sm">
                €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🎵 Característiques</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="djHours" className="block text-sm font-medium text-slate-700 mb-1">
              Hores de DJ *
            </label>
            <input
              type="number"
              id="djHours"
              required
              min="1"
              value={formData.djHours}
              onChange={(e) => setFormData({ ...formData, djHours: parseInt(e.target.value) || 0 })}
              className="block w-full rounded-md border-stone-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="soundWatts" className="block text-sm font-medium text-slate-700 mb-1">
              Potència So (W) *
            </label>
            <input
              type="number"
              id="soundWatts"
              required
              min="0"
              value={formData.soundWatts}
              onChange={(e) => setFormData({ ...formData, soundWatts: parseInt(e.target.value) || 0 })}
              className="block w-full rounded-md border-stone-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includesFog"
              checked={formData.includesFog}
              onChange={(e) => setFormData({ ...formData, includesFog: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-slate-800 focus:ring-slate-900"
            />
            <label htmlFor="includesFog" className="text-sm text-slate-700">
              🌫️ Inclou Màquina de Fum
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includesMic"
              checked={formData.includesMic}
              onChange={(e) => setFormData({ ...formData, includesMic: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-slate-800 focus:ring-slate-900"
            />
            <label htmlFor="includesMic" className="text-sm text-slate-700">
              🎤 Inclou Micròfon
            </label>
          </div>
        </div>
      </div>

      {/* Capacity Section */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">👥 Capacitat</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="minGuests" className="block text-sm font-medium text-slate-700 mb-1">
              Mínim Convidats
            </label>
            <input
              type="number"
              id="minGuests"
              min="0"
              value={formData.minGuests}
              onChange={(e) => setFormData({ ...formData, minGuests: e.target.value })}
              className="block w-full rounded-md border-stone-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label htmlFor="maxGuests" className="block text-sm font-medium text-slate-700 mb-1">
              Màxim Convidats
            </label>
            <input
              type="number"
              id="maxGuests"
              min="0"
              value={formData.maxGuests}
              onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
              className="block w-full rounded-md border-stone-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">⚙️ Estat i Ordre</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-slate-800 focus:ring-slate-900"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              ✅ Pack Actiu (Visible a la web)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-600"
            />
            <label htmlFor="isFeatured" className="text-sm text-slate-700">
              ⭐ Pack Destacat
            </label>
          </div>

          <div className="max-w-xs">
            <label htmlFor="order" className="block text-sm font-medium text-slate-700 mb-1">
              Ordre de Visualització
            </label>
            <input
              type="number"
              id="order"
              required
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="block w-full rounded-md border-stone-300 focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Ordre menor = apareix primer
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Link
          href="/admin/packs"
          className="rounded-md border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel·lar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-stone-50 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardant...' : 'Guardar Canvis'}
        </button>
      </div>
    </form>
  );
}
