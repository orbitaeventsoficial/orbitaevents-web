'use client';

import { useEffect, useState } from 'react';
import { log } from '@/lib/logger';
import Image from 'next/image';

interface PortfolioImage {
  id: string;
  url: string;
  title: string;
  category: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'bodas', label: 'Bodas 💍', color: 'rose' },
  { value: 'fiestas', label: 'Fiestas 🎉', color: 'purple' },
  { value: 'empresas', label: 'Empresas 🏢', color: 'blue' },
  { value: 'quinceañeras', label: 'Quinceañeras 👑', color: 'pink' },
  { value: 'otros', label: 'Otros 🎭', color: 'slate' },
];

export default function PortfolioPage() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');      
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    url: '',
    title: '',
    category: 'bodas',
    description: '',
    order: 0,
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const res = await fetch('/api/admin/portfolio');
      const data = await res.json();
      if (data.ok) {
        setImages(data.images);
      }
    } catch (error) {
      log.error('Error cargando imágenes:', error);
      setFlashMessage({ type: 'error', text: 'Error cargando imágenes' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url.trim() || !formData.title.trim()) {
      setFlashMessage({ type: 'error', text: 'URL y título son requeridos' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadImages();
        setFormData({ url: '', title: '', category: 'bodas', description: '', order: 0 });
        setShowAddForm(false);
        setFlashMessage({ type: 'success', text: 'Imagen añadida correctamente' });
      } else {
        setFlashMessage({ type: 'error', text: data.error || 'Error añadiendo imagen' });
      }
    } catch (error) {
      log.error('Error añadiendo imagen:', error);
      setFlashMessage({ type: 'error', text: 'Error añadiendo imagen' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen del portfolio?')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadImages();
        setFlashMessage({ type: 'success', text: 'Imagen eliminada' });
      } else {
        setFlashMessage({ type: 'error', text: data.error || 'Error eliminando imagen' });
      }
    } catch (error) {
      log.error('Error eliminando imagen:', error);
      setFlashMessage({ type: 'error', text: 'Error eliminando imagen' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          id,
          isActive: !currentActive,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadImages();
        setFlashMessage({ type: 'success', text: 'Estado actualizado' });
      } else {
        setFlashMessage({ type: 'error', text: data.error || 'Error actualizando imagen' });
      }
    } catch (error) {
      log.error('Error actualizando imagen:', error);
      setFlashMessage({ type: 'error', text: 'Error actualizando imagen' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  const activeCount = images.filter(img => img.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            Portfolio Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona las imágenes del portfolio público
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 shadow-sm"
        >
          + Añadir Imagen
        </button>
      </header>

      {flashMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            flashMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{flashMessage.text}</span>
            <button
              onClick={() => setFlashMessage(null)}
              className="text-xs text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Imágenes</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{images.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Activas</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">Inactivas</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">{images.length - activeCount}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Categorías</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {new Set(images.map(img => img.category)).size}
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-700 text-white'
              : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
          }`}
        >
          🖼️ Todas ({images.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = images.filter(img => img.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-slate-700 text-white'
                  : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </section>

      {/* Add Form */}
      {showAddForm && (
        <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Añadir Nueva Imagen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL de la Imagen *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                  placeholder="Boda en Barcelona"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                rows={3}
                placeholder="Descripción opcional..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 shadow-sm disabled:opacity-50"
              >
                Añadir Imagen
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ url: '', title: '', category: 'bodas', description: '', order: 0 });
                }}
                className="inline-flex items-center rounded-md bg-stone-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-stone-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Images Grid */}
      <section>
        {filteredImages.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
            <span className="text-4xl">🖼️</span>
            <p className="mt-4 text-slate-600">
              {selectedCategory === 'all' ? 'No hay imágenes en el portfolio' : 'No hay imágenes en esta categoría'}
            </p>
            <p className="text-sm text-slate-400">Añade la primera imagen para comenzar</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map(image => (
              <div
                key={image.id}
                className={`rounded-xl border bg-stone-50 shadow-sm overflow-hidden ${
                  image.isActive ? 'border-stone-200' : 'border-stone-300 opacity-60'
                }`}
              >
                <div className="relative aspect-video bg-slate-100">
                  <Image
                    src={image.url}
                    alt={image.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        image.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-stone-100 text-slate-700'
                      }`}
                    >
                      {image.isActive ? '✓ Activa' : '○ Inactiva'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-700">{image.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {CATEGORIES.find(c => c.value === image.category)?.label || image.category} • Orden: {image.order}
                    </p>
                    {image.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{image.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(image.id, image.isActive)}
                      disabled={saving}
                      className={`flex-1 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                        image.isActive
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      {image.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={saving}
                      className="inline-flex items-center rounded-md bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
