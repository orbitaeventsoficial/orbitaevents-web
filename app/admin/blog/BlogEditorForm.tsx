'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { BLOG_CATEGORY_OPTIONS } from '@/lib/constants';
import { EditorControlStrip } from '../components/EditorControlStrip';

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getFlashClass(type: 'success' | 'error') {
  return type === 'success' ? 'ap-inline-alert ap-inline-alert--success' : 'ap-inline-alert ap-inline-alert--danger';
}

function getLocaleTabClass(isActive: boolean) {
  return isActive ? 'ap-tab ap-tab--active' : 'ap-tab ap-tab--idle';
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
  const filledLocales = (['es', 'ca'] as Locale[]).filter((locale) => {
    const translation = formData.translations[locale];
    return Boolean(translation.title.trim() || translation.excerpt.trim() || translation.content.trim());
  }).length;
  const missingLocales = 2 - filledLocales;
  const activeTranslation = formData.translations[activeLocale];
  const activeWordCount = activeTranslation.content.trim()
    ? activeTranslation.content.trim().split(/\s+/).length
    : 0;
  const seoReady = Boolean(
    activeTranslation.metaTitle.trim() || activeTranslation.title.trim(),
  ) && Boolean(activeTranslation.metaDescription.trim() || activeTranslation.excerpt.trim());
  const workspaceTone = loading
    ? 'default'
    : saving || missingLocales > 0 || !formData.slug.trim()
      ? 'warning'
      : 'success';
  const actionTitle = loading
    ? 'Esperar la càrrega abans d’editar el post'
    : saving
      ? 'Deixar que el post es desi correctament'
      : mode === 'create'
        ? missingLocales > 0
          ? 'Completar primer la base editorial del post'
          : 'Revisar i crear la peça amb la base completa'
        : missingLocales > 0
          ? 'Regularitzar traduccions i SEO abans de sortir'
          : 'Refinar el post i tornar al catàleg';
  const actionDescription = loading
    ? 'Sense el contingut carregat no toca prendre decisions editorials a cegues.'
    : saving
      ? 'Ara mateix el sistema està persistint els canvis i preparant el retorn al catàleg.'
      : missingLocales > 0
        ? 'El retorn més alt ara no és afegir més capes, sinó completar les peces bàsiques que encara falten per idioma.'
        : 'Amb la base editorial coberta, el següent pas bo és polir SEO, estat de publicació i qualitat final abans de sortir.';

  useEffect(() => {
    if (mode !== 'edit' || !postId) return;

    const loadPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/blog?id=${postId}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.post) {
          setFlashMessage({ type: 'error', text: data?.error || "No s'ha pogut carregar el post" });
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

      const res = await fetchWithCsrf('/api/admin/blog', {
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
      <div className="flex min-h-[320px] items-center justify-center admin-tone-text-neutral" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura',
          title: mode === 'create' ? 'Quin estat té ara mateix el nou post' : 'Quin estat té ara mateix l’edició del post',
          tone: workspaceTone,
          stats: [
            { label: 'Idiomes plens', value: filledLocales, tone: filledLocales === 2 ? 'success' : 'warning', hint: 'sobre 2' },
            { label: 'Slug', value: formData.slug.trim() ? 'OK' : 'Pendent', tone: formData.slug.trim() ? 'success' : 'warning', hint: 'URL editorial' },
            { label: activeLocale.toUpperCase(), value: activeWordCount, hint: 'paraules visibles' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans de desar',
          tone: loading ? 'default' : missingLocales > 0 || !seoReady ? 'warning' : 'info',
          items: [
            missingLocales > 0
              ? `${missingLocales} idioma/es encara no tenen base editorial completa.`
              : 'Les dues llengües ja tenen base editorial present al formulari.',
            seoReady
              ? `La pestanya ${activeLocale.toUpperCase()} ja té base SEO suficient per publicar sense buit evident.`
              : `La pestanya ${activeLocale.toUpperCase()} encara depèn de títol/extracte o de SEO incomplet.`,
            flashMessage
              ? `Últim missatge de l’editor: ${flashMessage.text}`
              : formData.isPublished
                ? 'El post està marcat com a publicat dins del formulari.'
                : 'El post continua en esborrany dins del formulari.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: actionTitle,
          description: actionDescription,
          tone: loading || saving || missingLocales > 0 ? 'warning' : 'success',
          secondaryPills: [
            formData.isPublished ? 'Publicat' : 'Esborrany',
            activeLocale.toUpperCase(),
          ],
        }}
        className="mb-6"
      />

      {flashMessage && (
        <div className={`mb-6 ${getFlashClass(flashMessage.type)}`} role={flashMessage.type === 'success' ? 'status' : 'alert'} aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <span>{flashMessage.text}</span>
            <button onClick={() => setFlashMessage(null)} type="button" aria-label="Tancar missatge" className="text-xs">
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="ap-card rounded-2xl p-6">
          <h2 className="mb-4 ap-h2">Configuració</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="blog-slug" className="mb-1 block text-sm">Slug (URL) *</label>
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
                className="ap-input w-full px-4 py-2"
                required
              />
              <p className="mt-1 text-xs admin-tone-text-neutral">Es genera automàticament des del títol si ho deixes buit</p>
            </div>
            <div>
              <label htmlFor="blog-author" className="mb-1 block text-sm">Autor</label>
              <input id="blog-author" type="text" value={formData.author} onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))} className="ap-input w-full px-4 py-2" />
            </div>
            <div>
              <label htmlFor="blog-category" className="mb-1 block text-sm">Categoria</label>
              <select id="blog-category" value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} className="ap-input w-full px-4 py-2">
                {BLOG_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="blog-tags" className="mb-1 block text-sm">Etiquetes (separades per comes)</label>
              <input id="blog-tags" type="text" value={formData.tags} onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))} placeholder="dj, bodes, música" className="ap-input w-full px-4 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="blog-featured-image" className="mb-1 block text-sm">Imatge destacada (URL)</label>
              <input id="blog-featured-image" type="url" value={formData.featuredImage} onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))} placeholder="https://..." className="ap-input w-full px-4 py-2" />
            </div>
            <div>
              <label htmlFor="blog-reading-time" className="mb-1 block text-sm">Temps lectura (min)</label>
              <input id="blog-reading-time" type="number" min={1} value={formData.readingTime} onChange={(e) => setFormData((prev) => ({ ...prev, readingTime: Number(e.target.value || 5) }))} className="ap-input w-full px-4 py-2" />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))} className="h-5 w-5 rounded" />
                Publicat
              </label>
            </div>
          </div>
        </section>

        <section className="ap-card rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="ap-h2">Contingut</h2>
            <div role="tablist" aria-label="Idioma del contingut" className="ap-tabs-nav">
              {(['es', 'ca'] as Locale[]).map((l) => (
                <button key={l} type="button" role="tab" aria-selected={activeLocale === l} onClick={() => setActiveLocale(l)} className={getLocaleTabClass(activeLocale === l)}>
                  {l === 'es' ? 'Castellà' : 'Català'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor={`blog-title-${activeLocale}`} className="mb-1 block text-sm">Títol *</label>
              <input id={`blog-title-${activeLocale}`} type="text" value={formData.translations[activeLocale].title} onChange={(e) => updateTranslation(activeLocale, 'title', e.target.value)} required className="ap-input w-full px-4 py-2" />
            </div>
            <div>
              <label htmlFor={`blog-excerpt-${activeLocale}`} className="mb-1 block text-sm">Extracte *</label>
              <textarea id={`blog-excerpt-${activeLocale}`} value={formData.translations[activeLocale].excerpt} onChange={(e) => updateTranslation(activeLocale, 'excerpt', e.target.value)} rows={3} required className="ap-input w-full px-4 py-2" />
            </div>
            <div>
              <label htmlFor={`blog-content-${activeLocale}`} className="mb-1 block text-sm">Contingut (Markdown) *</label>
              <textarea id={`blog-content-${activeLocale}`} value={formData.translations[activeLocale].content} onChange={(e) => updateTranslation(activeLocale, 'content', e.target.value)} rows={12} required className="ap-input w-full px-4 py-2 font-mono text-sm" />
            </div>
            <div>
              <label htmlFor={`blog-meta-title-${activeLocale}`} className="mb-1 block text-sm">Meta títol (SEO)</label>
              <input id={`blog-meta-title-${activeLocale}`} type="text" value={formData.translations[activeLocale].metaTitle} onChange={(e) => updateTranslation(activeLocale, 'metaTitle', e.target.value)} placeholder="Si està buit, s'usarà el títol" className="ap-input w-full px-4 py-2" />
            </div>
            <div>
              <label htmlFor={`blog-meta-desc-${activeLocale}`} className="mb-1 block text-sm">Meta descripció (SEO)</label>
              <textarea id={`blog-meta-desc-${activeLocale}`} value={formData.translations[activeLocale].metaDescription} onChange={(e) => updateTranslation(activeLocale, 'metaDescription', e.target.value)} rows={2} placeholder="Si està buida, s'usarà l'extracte" className="ap-input w-full px-4 py-2" />
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} aria-busy={saving} className="ap-btn ap-btn--primary">
            {saving ? 'Desant...' : mode === 'create' ? 'Crear post' : 'Desar canvis'}
          </button>
          <button type="button" onClick={() => router.push('/admin/blog')} className="ap-btn ap-btn--secondary">
            Cancel·lar
          </button>
        </div>
      </form>
    </>
  );
}
