'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    author: 'Òrbita Events',
    category: 'general',
    tags: '',
    featuredImage: '',
    isPublished: false,
    readingTime: 5,
    translations: {
      es: {
        title: '',
        excerpt: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
      },
      ca: {
        title: '',
        excerpt: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
      },
    },
  });

  const [activeLocale, setActiveLocale] = useState<'es' | 'ca'>('es');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        slug: formData.slug,
        author: formData.author,
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        featuredImage: formData.featuredImage || undefined,
        isPublished: formData.isPublished,
        readingTime: formData.readingTime,
        translations: [
          {
            locale: 'es',
            ...formData.translations.es,
          },
          {
            locale: 'ca',
            ...formData.translations.ca,
          },
        ],
      };

      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/blog?created=1');
      } else {
        const error = await res.json();
        setFlashMessage({
          type: 'error',
          text: error.error || 'Error al crear el post',
        });
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      setFlashMessage({ type: 'error', text: 'Error al crear el post' });
    } finally {
      setLoading(false);
    }
  };

  const updateTranslation = (locale: 'es' | 'ca', field: string, value: string) => {
    setFormData({
      ...formData,
      translations: {
        ...formData.translations,
        [locale]: {
          ...formData.translations[locale],
          [field]: value,
        },
      },
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Nuevo Post</h1>
        <p className="mt-2 text-white/60">Crea un nuevo artículo para el blog</p>
      </div>

      {flashMessage && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Configuración General</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                onBlur={(e) => {
                  if (!e.target.value && formData.translations.es.title) {
                    setFormData({
                      ...formData,
                      slug: generateSlug(formData.translations.es.title),
                    });
                  }
                }}
                placeholder="mi-primer-post"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50"
                required
              />
              <p className="mt-1 text-xs text-white/60">
                Se generará automáticamente del título español si lo dejas vacío
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Autor</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                >
                  <option value="general">General</option>
                  <option value="bodas">Bodas</option>
                  <option value="eventos">Eventos</option>
                  <option value="consejos">Consejos</option>
                  <option value="tendencias">Tendencias</option>
                  <option value="tecnologia">Tecnología</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Tags (separados por comas)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="dj, bodas, música"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Imagen Destacada (URL)
              </label>
              <input
                type="url"
                value={formData.featuredImage}
                onChange={(e) =>
                  setFormData({ ...formData, featuredImage: e.target.value })
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Tiempo de Lectura (minutos)
                </label>
                <input
                  type="number"
                  value={formData.readingTime}
                  onChange={(e) =>
                    setFormData({ ...formData, readingTime: parseInt(e.target.value) })
                  }
                  min="1"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    className="h-5 w-5 rounded"
                  />
                  <span className="text-sm font-medium text-white">Publicar ahora</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Translations */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Contenido</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveLocale('es')}
                className={`rounded-lg px-4 py-2 ${
                  activeLocale === 'es'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setActiveLocale('ca')}
                className={`rounded-lg px-4 py-2 ${
                  activeLocale === 'ca'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                Català
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Título *
              </label>
              <input
                type="text"
                value={formData.translations[activeLocale].title}
                onChange={(e) => updateTranslation(activeLocale, 'title', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Extracto *
              </label>
              <textarea
                value={formData.translations[activeLocale].excerpt}
                onChange={(e) => updateTranslation(activeLocale, 'excerpt', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Contenido (Markdown) *
              </label>
              <textarea
                value={formData.translations[activeLocale].content}
                onChange={(e) => updateTranslation(activeLocale, 'content', e.target.value)}
                rows={15}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Meta Título (SEO)
              </label>
              <input
                type="text"
                value={formData.translations[activeLocale].metaTitle}
                onChange={(e) =>
                  updateTranslation(activeLocale, 'metaTitle', e.target.value)
                }
                placeholder="Si está vacío, se usará el título"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Meta Descripción (SEO)
              </label>
              <textarea
                value={formData.translations[activeLocale].metaDescription}
                onChange={(e) =>
                  updateTranslation(activeLocale, 'metaDescription', e.target.value)
                }
                rows={2}
                placeholder="Si está vacía, se usará el extracto"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear Post'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-white hover:bg-white/10"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
