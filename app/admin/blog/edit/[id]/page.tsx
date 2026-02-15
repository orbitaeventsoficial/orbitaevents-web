'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { log } from '@/lib/logger';

type Locale = 'es' | 'ca';

interface BlogTranslation {
  locale: Locale;
  title: string;
  excerpt: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

interface BlogPost {
  id: string;
  slug: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage?: string | null;
  isPublished: boolean;
  readingTime?: number | null;
  translations: BlogTranslation[];
}

interface FormDataState {
  slug: string;
  author: string;
  category: string;
  tags: string;
  featuredImage: string;
  isPublished: boolean;
  readingTime: number;
  translations: Record<Locale, {
    title: string;
    excerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
  }>;
}

const EMPTY_TRANSLATION = {
  title: '',
  excerpt: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
};

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>('es');
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<FormDataState>({
    slug: '',
    author: 'Òrbita Events',
    category: 'general',
    tags: '',
    featuredImage: '',
    isPublished: false,
    readingTime: 5,
    translations: {
      es: { ...EMPTY_TRANSLATION },
      ca: { ...EMPTY_TRANSLATION },
    },
  });

  useEffect(() => {
    if (!postId) return;

    const loadPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/blog?id=${postId}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.post) {
          setFlashMessage({ type: 'error', text: data?.error || 'No s\'ha pogut carregar el post' });
          return;
        }

        const post: BlogPost = data.post;
        const es = post.translations.find((t) => t.locale === 'es');
        const ca = post.translations.find((t) => t.locale === 'ca');

        setFormData({
          slug: post.slug || '',
          author: post.author || 'Òrbita Events',
          category: post.category || 'general',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          featuredImage: post.featuredImage || '',
          isPublished: Boolean(post.isPublished),
          readingTime: Number(post.readingTime || 5),
          translations: {
            es: {
              title: es?.title || '',
              excerpt: es?.excerpt || '',
              content: es?.content || '',
              metaTitle: es?.metaTitle || '',
              metaDescription: es?.metaDescription || '',
            },
            ca: {
              title: ca?.title || '',
              excerpt: ca?.excerpt || '',
              content: ca?.content || '',
              metaTitle: ca?.metaTitle || '',
              metaDescription: ca?.metaDescription || '',
            },
          },
        });
      } catch (error) {
        log.error('Failed to load blog post', error);
        setFlashMessage({ type: 'error', text: 'Error carregant el post' });
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  const updateTranslation = (locale: Locale, field: keyof FormDataState['translations']['es'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;

    setSaving(true);
    setFlashMessage(null);

    try {
      const payload = {
        id: postId,
        slug: formData.slug.trim(),
        author: formData.author.trim() || 'Òrbita Events',
        category: formData.category.trim() || 'general',
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        featuredImage: formData.featuredImage.trim() || undefined,
        isPublished: formData.isPublished,
        readingTime: Number(formData.readingTime || 5),
        translations: [
          { locale: 'es', ...formData.translations.es },
          { locale: 'ca', ...formData.translations.ca },
        ],
      };

      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFlashMessage({ type: 'error', text: data?.error || 'Error desant canvis' });
        return;
      }

      setFlashMessage({ type: 'success', text: 'Post actualitzat correctament' });
      setTimeout(() => router.push('/admin/blog'), 700);
    } catch (error) {
      log.error('Failed to update blog post', error);
      setFlashMessage({ type: 'error', text: 'Error desant canvis' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]" role="status" aria-live="polite">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Editar post</h1>
          <p className="mt-1 text-sm text-slate-400">Actualitza contingut, SEO i estat de publicació</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          Tornar
        </button>
      </header>

      {flashMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            flashMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
          role={flashMessage.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          {flashMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Configuració</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Slug</label>
              <input
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                required
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Autor</label>
              <input
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Categoria</label>
              <input
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Etiquetes (separades per comes)</label>
              <input
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">URL imatge destacada</label>
              <input
                value={formData.featuredImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Temps lectura (min)</label>
              <input
                type="number"
                min={1}
                value={formData.readingTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, readingTime: Number(e.target.value || 5) }))}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))}
                />
                Publicat
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Contingut</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveLocale('es')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  activeLocale === 'es'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'border border-slate-700 text-slate-400'
                }`}
              >
                Espanyol
              </button>
              <button
                type="button"
                onClick={() => setActiveLocale('ca')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  activeLocale === 'ca'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'border border-slate-700 text-slate-400'
                }`}
              >
                Català
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Títol</label>
              <input
                value={formData.translations[activeLocale].title}
                onChange={(e) => updateTranslation(activeLocale, 'title', e.target.value)}
                required
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Extracte</label>
              <textarea
                value={formData.translations[activeLocale].excerpt}
                onChange={(e) => updateTranslation(activeLocale, 'excerpt', e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Contingut</label>
              <textarea
                value={formData.translations[activeLocale].content}
                onChange={(e) => updateTranslation(activeLocale, 'content', e.target.value)}
                rows={12}
                required
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Meta títol (SEO)</label>
              <input
                value={formData.translations[activeLocale].metaTitle}
                onChange={(e) => updateTranslation(activeLocale, 'metaTitle', e.target.value)}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Meta descripció (SEO)</label>
              <textarea
                value={formData.translations[activeLocale].metaDescription}
                onChange={(e) => updateTranslation(activeLocale, 'metaDescription', e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Desant...' : 'Desar canvis'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-6 py-2.5 text-slate-200"
          >
            Cancel·lar
          </button>
        </div>
      </form>
    </div>
  );
}



