'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';

type Locale = 'es' | 'ca';

interface TranslationData {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}

interface FormState {
  slug: string;
  author: string;
  category: string;
  tags: string;
  featuredImage: string;
  isPublished: boolean;
  readingTime: number;
  translations: Record<Locale, TranslationData>;
}

const EMPTY_TRANSLATION: TranslationData = {
  title: '',
  excerpt: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
};

const INITIAL_FORM: FormState = {
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
};

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bodas', label: 'Bodes' },
  { value: 'eventos', label: 'Esdeveniments' },
  { value: 'consejos', label: 'Consells' },
  { value: 'tendencias', label: 'Tendències' },
  { value: 'tecnologia', label: 'Tecnologia' },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface BlogEditorFormProps {
  mode: 'create' | 'edit';
  postId?: string;
}

export default function BlogEditorForm({ mode, postId }: BlogEditorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>('es');
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    if (mode !== 'edit' || !postId) return;

    const loadPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/blog?id=${postId}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.post) {
          setFlashMessage({ type: 'error', text: data?.error || 'No s\'ha pogut carregar el post' });
          return;
        }

        const post = data.post;
        const es = post.translations?.find((t: { locale: string }) => t.locale === 'es');
        const ca = post.translations?.find((t: { locale: string }) => t.locale === 'ca');

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
  }, [mode, postId]);

  const updateTranslation = (locale: Locale, field: keyof TranslationData, value: string) => {
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
    setSaving(true);
    setFlashMessage(null);

    try {
      const payload: Record<string, unknown> = {
        slug: formData.slug.trim() || generateSlug(formData.translations.es.title),
        author: formData.author.trim() || 'Òrbita Events',
        category: formData.category.trim() || 'general',
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        featuredImage: formData.featuredImage.trim() || undefined,
        isPublished: formData.isPublished,
        readingTime: Number(formData.readingTime || 5),
        translations: [
          { locale: 'es', ...formData.translations.es },
          { locale: 'ca', ...formData.translations.ca },
        ],
      };

      if (mode === 'edit') payload.id = postId;

      const res = await fetch('/api/admin/blog', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFlashMessage({ type: 'error', text: data?.error || 'Error desant' });
        return;
      }

      if (mode === 'create') {
        router.push('/admin/blog?created=1');
      } else {
        setFlashMessage({ type: 'success', text: 'Post actualitzat correctament' });
        setTimeout(() => router.push('/admin/blog'), 700);
      }
    } catch (error) {
      log.error(`Failed to ${mode} post:`, error);
      setFlashMessage({ type: 'error', text: `Error ${mode === 'create' ? 'creant' : 'desant'} el post` });
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
    <>
      {flashMessage && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            flashMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
          role={flashMessage.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-4">
            <span>{flashMessage.text}</span>
            <button
              onClick={() => setFlashMessage(null)}
              type="button"
              aria-label="Tancar missatge"
              className="text-xs text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Configuració general */}
        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Configuració</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="blog-slug" className="block text-sm mb-1">Slug (URL) *</label>
              <input
                id="blog-slug"
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                onBlur={(e) => {
                  if (!e.target.value && formData.translations.es.title) {
                    setFormData((prev) => ({ ...prev, slug: generateSlug(prev.translations.es.title) }));
                  }
                }}
                placeholder="el-meu-post"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                required
              />
              <p className="mt-1 text-xs text-white/50">Es genera automàticament des del títol si ho deixes buit</p>
            </div>
            <div>
              <label htmlFor="blog-author" className="block text-sm mb-1">Autor</label>
              <input
                id="blog-author"
                type="text"
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="blog-category" className="block text-sm mb-1">Categoria</label>
              <select
                id="blog-category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="blog-tags" className="block text-sm mb-1">Etiquetes (separades per comes)</label>
              <input
                id="blog-tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="dj, bodes, música"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="blog-featured-image" className="block text-sm mb-1">Imatge destacada (URL)</label>
              <input
                id="blog-featured-image"
                type="url"
                value={formData.featuredImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))}
                  className="h-5 w-5 rounded"
                />
                Publicat
              </label>
            </div>
          </div>
        </section>

        {/* Contingut per idioma */}
        <section className="rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contingut</h2>
            <div className="flex gap-2">
              {(['es', 'ca'] as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setActiveLocale(l)}
                  className={`rounded-xl px-3 py-1.5 text-sm ${
                    activeLocale === l
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'border border-white/10 text-white/40'
                  }`}
                >
                  {l === 'es' ? 'Castellà' : 'Català'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor={`blog-title-${activeLocale}`} className="block text-sm mb-1">Títol *</label>
              <input
                id={`blog-title-${activeLocale}`}
                type="text"
                value={formData.translations[activeLocale].title}
                onChange={(e) => updateTranslation(activeLocale, 'title', e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor={`blog-excerpt-${activeLocale}`} className="block text-sm mb-1">Extracte *</label>
              <textarea
                id={`blog-excerpt-${activeLocale}`}
                value={formData.translations[activeLocale].excerpt}
                onChange={(e) => updateTranslation(activeLocale, 'excerpt', e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor={`blog-content-${activeLocale}`} className="block text-sm mb-1">Contingut (Markdown) *</label>
              <textarea
                id={`blog-content-${activeLocale}`}
                value={formData.translations[activeLocale].content}
                onChange={(e) => updateTranslation(activeLocale, 'content', e.target.value)}
                rows={12}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor={`blog-meta-title-${activeLocale}`} className="block text-sm mb-1">Meta títol (SEO)</label>
              <input
                id={`blog-meta-title-${activeLocale}`}
                type="text"
                value={formData.translations[activeLocale].metaTitle}
                onChange={(e) => updateTranslation(activeLocale, 'metaTitle', e.target.value)}
                placeholder="Si està buit, s'usarà el títol"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor={`blog-meta-desc-${activeLocale}`} className="block text-sm mb-1">Meta descripció (SEO)</label>
              <textarea
                id={`blog-meta-desc-${activeLocale}`}
                value={formData.translations[activeLocale].metaDescription}
                onChange={(e) => updateTranslation(activeLocale, 'metaDescription', e.target.value)}
                rows={2}
                placeholder="Si està buida, s'usarà l'extracte"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
          </div>
        </section>

        {/* Accions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="rounded-xl px-6 py-2.5 text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Desant...' : mode === 'create' ? 'Crear post' : 'Desar canvis'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-white hover:bg-white/10"
          >
            Cancel·lar
          </button>
        </div>
      </form>
    </>
  );
}
