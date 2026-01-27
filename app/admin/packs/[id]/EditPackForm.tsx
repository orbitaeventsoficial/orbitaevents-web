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
    slug: pack.slug,
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

  const [translations, setTranslations] = useState<PackTranslation[]>(
    pack.translations.length > 0
      ? pack.translations
      : [
          { locale: 'es', name: '', description: '', tagline: '', features: [] },
          { locale: 'ca', name: '', description: '', tagline: '', features: [] }
        ]
  );

  const updateTranslation = (locale: string, field: keyof PackTranslation, value: string | string[]) => {
    setTranslations(prev =>
      prev.map(t =>
        t.locale === locale ? { ...t, [field]: value } : t
      )
    );
  };

  const getTranslation = (locale: string) => {
    return translations.find(t => t.locale === locale) || {
      locale,
      name: '',
      description: '',
      tagline: '',
      features: []
    };
  };

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
          slug: formData.slug,
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
          translations: translations,
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

  const inputClasses = "block w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 sm:text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 p-4 border border-rose-500/30" role="alert">
          <p className="text-sm text-rose-300">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/30" role="status" aria-live="polite">
          <p className="text-sm text-emerald-300">✅ Pack actualitzat correctament!</p>
        </div>
      )}

      {/* Slug Section */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">🔗 Slug (URL)</h3>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-300 mb-1">
            Slug del Pack *
          </label>
          <input
            type="text"
            id="slug"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className={inputClasses}
            placeholder="pack-basic"
          />
          <p className="mt-1 text-xs text-slate-500">
            URL del pack (sense espais, només lletres, números i guions)
          </p>
        </div>
      </div>

      {/* Translations Section - Spanish */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">🇪🇸 Traduccions - Espanyol</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name-es" className="block text-sm font-medium text-slate-300 mb-1">
              Nom del Pack *
            </label>
            <input
              type="text"
              id="name-es"
              required
              value={getTranslation('es').name}
              onChange={(e) => updateTranslation('es', 'name', e.target.value)}
              className={inputClasses}
              placeholder="Pack Básico"
            />
          </div>

          <div>
            <label htmlFor="tagline-es" className="block text-sm font-medium text-slate-300 mb-1">
              Tagline
            </label>
            <input
              type="text"
              id="tagline-es"
              value={getTranslation('es').tagline || ''}
              onChange={(e) => updateTranslation('es', 'tagline', e.target.value)}
              className={inputClasses}
              placeholder="Perfecto para eventos pequeños"
            />
          </div>

          <div>
            <label htmlFor="description-es" className="block text-sm font-medium text-slate-300 mb-1">
              Descripció
            </label>
            <textarea
              id="description-es"
              rows={3}
              value={getTranslation('es').description || ''}
              onChange={(e) => updateTranslation('es', 'description', e.target.value)}
              className={inputClasses}
              placeholder="Descripción completa del pack..."
            />
          </div>

          <div>
            <label htmlFor="features-es" className="block text-sm font-medium text-slate-300 mb-1">
              Característiques (una per línia)
            </label>
            <textarea
              id="features-es"
              rows={5}
              value={(getTranslation('es').features || []).join('\n')}
              onChange={(e) => updateTranslation('es', 'features', e.target.value.split('\n').filter(f => f.trim()))}
              className={`${inputClasses} font-mono text-xs`}
              placeholder="DJ profesional&#10;Sistema de sonido&#10;Iluminación básica"
            />
          </div>
        </div>
      </div>

      {/* Translations Section - Catalan */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">🏴 Traduccions - Català</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name-ca" className="block text-sm font-medium text-slate-300 mb-1">
              Nom del Pack *
            </label>
            <input
              type="text"
              id="name-ca"
              required
              value={getTranslation('ca').name}
              onChange={(e) => updateTranslation('ca', 'name', e.target.value)}
              className={inputClasses}
              placeholder="Pack Bàsic"
            />
          </div>

          <div>
            <label htmlFor="tagline-ca" className="block text-sm font-medium text-slate-300 mb-1">
              Tagline
            </label>
            <input
              type="text"
              id="tagline-ca"
              value={getTranslation('ca').tagline || ''}
              onChange={(e) => updateTranslation('ca', 'tagline', e.target.value)}
              className={inputClasses}
              placeholder="Perfecte per a esdeveniments petits"
            />
          </div>

          <div>
            <label htmlFor="description-ca" className="block text-sm font-medium text-slate-300 mb-1">
              Descripció
            </label>
            <textarea
              id="description-ca"
              rows={3}
              value={getTranslation('ca').description || ''}
              onChange={(e) => updateTranslation('ca', 'description', e.target.value)}
              className={inputClasses}
              placeholder="Descripció completa del pack..."
            />
          </div>

          <div>
            <label htmlFor="features-ca" className="block text-sm font-medium text-slate-300 mb-1">
              Característiques (una per línia)
            </label>
            <textarea
              id="features-ca"
              rows={5}
              value={(getTranslation('ca').features || []).join('\n')}
              onChange={(e) => updateTranslation('ca', 'features', e.target.value.split('\n').filter(f => f.trim()))}
              className={`${inputClasses} font-mono text-xs`}
              placeholder="DJ professional&#10;Sistema de so&#10;Il·luminació bàsica"
            />
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">💰 Preus</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-300 mb-1">
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
                className={`${inputClasses} pr-8`}
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-sm">
                €
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="originalPrice" className="block text-sm font-medium text-slate-300 mb-1">
              Preu Original
            </label>
            <div className="relative">
              <input
                type="number"
                id="originalPrice"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className={`${inputClasses} pr-8`}
                placeholder="Opcional"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-sm">
                €
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="extraHourPrice" className="block text-sm font-medium text-slate-300 mb-1">
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
                className={`${inputClasses} pr-8`}
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-sm">
                €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">🎵 Característiques</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="djHours" className="block text-sm font-medium text-slate-300 mb-1">
              Hores de DJ *
            </label>
            <input
              type="number"
              id="djHours"
              required
              min="1"
              value={formData.djHours}
              onChange={(e) => setFormData({ ...formData, djHours: parseInt(e.target.value) || 0 })}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="soundWatts" className="block text-sm font-medium text-slate-300 mb-1">
              Potència So (W) *
            </label>
            <input
              type="number"
              id="soundWatts"
              required
              min="0"
              value={formData.soundWatts}
              onChange={(e) => setFormData({ ...formData, soundWatts: parseInt(e.target.value) || 0 })}
              className={inputClasses}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includesFog"
              checked={formData.includesFog}
              onChange={(e) => setFormData({ ...formData, includesFog: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="includesFog" className="text-sm text-slate-300">
              🌫️ Inclou Màquina de Fum
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includesMic"
              checked={formData.includesMic}
              onChange={(e) => setFormData({ ...formData, includesMic: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="includesMic" className="text-sm text-slate-300">
              🎤 Inclou Micròfon
            </label>
          </div>
        </div>
      </div>

      {/* Capacity Section */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">👥 Capacitat</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="minGuests" className="block text-sm font-medium text-slate-300 mb-1">
              Mínim Convidats
            </label>
            <input
              type="number"
              id="minGuests"
              min="0"
              value={formData.minGuests}
              onChange={(e) => setFormData({ ...formData, minGuests: e.target.value })}
              className={inputClasses}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label htmlFor="maxGuests" className="block text-sm font-medium text-slate-300 mb-1">
              Màxim Convidats
            </label>
            <input
              type="number"
              id="maxGuests"
              min="0"
              value={formData.maxGuests}
              onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
              className={inputClasses}
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">⚙️ Estat i Ordre</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-300">
              ✅ Pack Actiu (Visible a la web)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="isFeatured" className="text-sm text-slate-300">
              ⭐ Pack Destacat
            </label>
          </div>

          <div className="max-w-xs">
            <label htmlFor="order" className="block text-sm font-medium text-slate-300 mb-1">
              Ordre de Visualització
            </label>
            <input
              type="number"
              id="order"
              required
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className={inputClasses}
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
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600/50 transition-colors"
        >
          Cancel·lar
        </Link>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Guardant...' : 'Guardar Canvis'}
        </button>
      </div>
    </form>
  );
}
