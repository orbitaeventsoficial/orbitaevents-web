'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import { AdminPage } from '../../../components/AdminPage';

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
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AdminPage
      title="Editar post"
      subtitle="Actualitza contingut, SEO i estat de publicació"
      back={{ href: '/admin/blog', label: 'Blog' }}
    >
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
        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Configuració</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="blog-slug" className="block text-sm mb-1">Slug</label>
              <input id="blog-slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                required
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor="blog-author" className="block text-sm mb-1">Autor</label>
              <input
                id="blog-author"
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor="blog-category" className="block text-sm mb-1">Categoria</label>
              <input
                id="blog-category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="blog-tags" className="block text-sm mb-1">Etiquetes (separades per comes)</label>
              <input
                id="blog-tags"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="blog-featured-image" className="block text-sm mb-1">URL imatge destacada</label>
              <input
                id="blog-featured-image"
                value={formData.featuredImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor="blog-reading-time" className="block text-sm mb-1">Temps lectura (min)</label>
              <input
                id="blog-reading-time"
                type="number"
                min={1}
                value={formData.readingTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, readingTime: Number(e.target.value || 5) }))}
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
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

        <section className="rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contingut</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveLocale('es')}
                className={`rounded-xl px-3 py-1.5 text-sm ${
                  activeLocale === 'es'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'border border-white/10 text-white/40'
                }`}
              >
                Espanyol
              </button>
              <button
                type="button"
                onClick={() => setActiveLocale('ca')}
                className={`rounded-xl px-3 py-1.5 text-sm ${
                  activeLocale === 'ca'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'border border-white/10 text-white/40'
                }`}
              >
                Català
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor={`blog-title-${activeLocale}`} className="block text-sm mb-1">Títol</label>
              <input
                id={`blog-title-${activeLocale}`}
                value={formData.translations[activeLocale].title}
                onChange={(e) => updateTranslation(activeLocale, 'title', e.target.value)}
                required
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor={`blog-excerpt-${activeLocale}`} className="block text-sm mb-1">Extracte</label>
              <textarea
                id={`blog-excerpt-${activeLocale}`}
                value={formData.translations[activeLocale].excerpt}
                onChange={(e) => updateTranslation(activeLocale, 'excerpt', e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor={`blog-content-${activeLocale}`} className="block text-sm mb-1">Contingut</label>
              <textarea
                id={`blog-content-${activeLocale}`}
                value={formData.translations[activeLocale].content}
                onChange={(e) => updateTranslation(activeLocale, 'content', e.target.value)}
                rows={12}
                required
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor={`blog-meta-title-${activeLocale}`} className="block text-sm mb-1">Meta títol (SEO)</label>
              <input
                id={`blog-meta-title-${activeLocale}`}
                value={formData.translations[activeLocale].metaTitle}
                onChange={(e) => updateTranslation(activeLocale, 'metaTitle', e.target.value)}
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor={`blog-meta-desc-${activeLocale}`} className="block text-sm mb-1">Meta descripció (SEO)</label>
              <textarea
                id={`blog-meta-desc-${activeLocale}`}
                value={formData.translations[activeLocale].metaDescription}
                onChange={(e) => updateTranslation(activeLocale, 'metaDescription', e.target.value)}
                rows={2}
                className="w-full rounded-xl border px-4 py-2"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-6 py-2.5 text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Desant...' : 'Desar canvis'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="rounded-xl border px-6 py-2.5"
          >
            Cancel·lar
          </button>
        </div>
      </form>
    </AdminPage>
  );
}
