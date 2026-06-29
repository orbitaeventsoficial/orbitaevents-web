'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { AdminHelpLegend } from '@/app/admin/components/AdminHelpLegend';
import { AdminPage } from '@/app/admin/components/AdminPage';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { PORTFOLIO_CATEGORIES, PORTFOLIO_IMAGES } from '@/app/config/portfolio-images';
import {
  PORTFOLIO_MEDIA_ADMIN_EMPTY_STATE,
  PORTFOLIO_MEDIA_IMAGE_MAX_SIZE,
  PORTFOLIO_MEDIA_UPLOAD_ACCEPT,
  PORTFOLIO_MEDIA_VIDEO_MAX_SIZE,
} from '@/lib/constants/portfolio-media';

type PortfolioEvent = {
  id: string;
  slug: string;
  categorySlug: string;
  title: string;
  subtitle: string | null;
  venue: string | null;
  location: string | null;
  eventDate: string | null;
  guestCount: number | null;
  description: string | null;
  services: string[];
  coverImage: string;
  published: boolean;
  _count?: { media: number };
};

type EventRef = {
  id: string;
  title: string;
  slug: string;
};

type MediaItem = {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  event?: EventRef | null;
  isStatic?: boolean;
};

type PreviewState = {
  url: string;
  type: 'image' | 'video';
  alt: string;
};

type EventFormState = {
  slug: string;
  categorySlug: string;
  title: string;
  subtitle: string;
  venue: string;
  location: string;
  eventDate: string;
  guestCount: string;
  description: string;
  services: string;
  coverImage: string;
  published: boolean;
};

const EMPTY_EVENT_FORM: EventFormState = {
  slug: '',
  categorySlug: 'bodas',
  title: '',
  subtitle: '',
  venue: '',
  location: '',
  eventDate: '',
  guestCount: '',
  description: '',
  services: '',
  coverImage: '',
  published: false,
};

function isImageType(type: string) {
  return type.startsWith('image/');
}

function inferMediaTypeFromUrl(url: string): 'image' | 'video' {
  return /\.(mp4|webm|mov)$/i.test(url) ? 'video' : 'image';
}

function buildStaticMediaItems(slug: string): MediaItem[] {
  const items = PORTFOLIO_IMAGES[slug as keyof typeof PORTFOLIO_IMAGES] || [];
  return items.map((item, index) => ({
    id: `static:${slug}:${index}`,
    mediaUrl: item.src,
    mediaType: inferMediaTypeFromUrl(item.src),
    caption: item.alt || null,
    sortOrder: index,
    createdAt: '',
    event: null,
    isStatic: true,
  }));
}

function buildEventPayload(form: EventFormState) {
  return {
    ...form,
    eventDate: form.eventDate || undefined,
    guestCount: form.guestCount ? Number(form.guestCount) : undefined,
    services: form.services
      ? form.services.split(',').map((value) => value.trim()).filter(Boolean)
      : [],
  };
}

function FullscreenPreview({ preview, onClose }: { preview: PreviewState | null; onClose: () => void }) {
  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [preview, onClose]);

  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 p-4" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-[var(--line)] bg-black/60 px-3 py-2 text-sm text-[var(--t)]"
      >
        Tancar
      </button>
      <div className="relative mx-auto h-full w-full max-w-7xl" onClick={(event) => event.stopPropagation()}>
        {preview.type === 'image' ? (
          <Image src={preview.url} alt={preview.alt} fill sizes="100vw" className="object-contain" />
        ) : (
          <video src={preview.url} className="h-full w-full object-contain" controls autoPlay playsInline />
        )}
      </div>
    </div>
  );
}


function CategorySection({
  slug,
  name,
  events,
  onEventsRefresh,
  onOpenPreview,
}: {
  slug: string;
  name: string;
  events: PortfolioEvent[];
  onEventsRefresh: () => Promise<void>;
  onOpenPreview: (preview: PreviewState) => void;
}) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<MediaItem | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const categoryEvents = useMemo(() => events.filter((eventItem) => eventItem.categorySlug === slug), [events, slug]);
  const coverMap = useMemo(() => {
    const map = new Map<string, PortfolioEvent[]>();
    for (const eventItem of categoryEvents) {
      const current = map.get(eventItem.coverImage) || [];
      current.push(eventItem);
      map.set(eventItem.coverImage, current);
    }
    return map;
  }, [categoryEvents]);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    const fallbackItems = buildStaticMediaItems(slug);
    try {
      const response = await fetchWithCsrf(`/api/admin/portfolio/media?slug=${slug}`, { cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Error carregant media');
      }
      const data = await response.json();
      const items = Array.isArray(data.data) ? data.data : [];
      setMedia(items.length > 0 ? items : fallbackItems);
    } catch (err) {
      log.error(`Error carregant ${slug}`, err);
      setMedia(fallbackItems);
      setError(
        fallbackItems.length > 0
          ? "No s'ha pogut llegir el portfolio editable; es mostra el catàleg públic actual en mode lectura."
          : err instanceof Error
            ? err.message
            : 'Error carregant media'
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (expanded) void loadMedia();
  }, [expanded, loadMedia]);
  const persistSortOrder = useCallback(async (items: MediaItem[]) => {
    for (let index = 0; index < items.length; index += 1) {
      await fetchWithCsrf('/api/admin/portfolio/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: items[index].id, sortOrder: index }),
      });
    }
  }, []);

  const handleUpload = useCallback(async (files: FileList | File[], replacement?: MediaItem | null) => {
    const entries = Array.from(files);
    if (entries.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of entries) {
        const maxSize = isImageType(file.type) ? PORTFOLIO_MEDIA_IMAGE_MAX_SIZE : PORTFOLIO_MEDIA_VIDEO_MAX_SIZE;
        if (file.size > maxSize) {
          throw new Error(`${file.name} supera el límit permès`);
        }

        const formData = new FormData();
        formData.append('slug', slug);
        formData.append('file', file, file.name);
        if (replacement?.caption) formData.append('caption', replacement.caption);

        const uploadResponse = await fetchWithCsrf('/api/admin/portfolio/media', {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) {
          const data = await uploadResponse.json().catch(() => ({}));
          throw new Error(data?.error || 'Error pujant fitxer');
        }

        const uploadData = await uploadResponse.json();
        const created = uploadData.data as MediaItem;

        if (replacement) {
          await fetchWithCsrf('/api/admin/portfolio/media', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mediaId: created.id,
              caption: replacement.caption,
              sortOrder: replacement.sortOrder,
              eventId: replacement.event?.id ?? null,
            }),
          });

          const coverRefs = coverMap.get(replacement.mediaUrl) || [];
          for (const eventItem of coverRefs) {
            await fetchWithCsrf('/api/admin/portfolio/events', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: eventItem.id, coverImage: created.mediaUrl }),
            });
          }

          await fetchWithCsrf(`/api/admin/portfolio/media?mediaId=${replacement.id}`, { method: 'DELETE' });
          await onEventsRefresh();
        }
      }

      await loadMedia();
    } catch (err) {
      log.error('Error pujant media', err);
      setError(err instanceof Error ? err.message : 'Error pujant media');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
      if (replaceFileRef.current) replaceFileRef.current.value = '';
      replaceTargetRef.current = null;
    }
  }, [coverMap, loadMedia, onEventsRefresh, slug]);

  const handleReplaceSelection = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !replaceTargetRef.current) return;
    void handleUpload(event.target.files, replaceTargetRef.current);
  }, [handleUpload]);

  const handleCaptionSave = useCallback(async (item: MediaItem, caption: string) => {
    setSavingId(item.id);
    setError(null);
    try {
      await fetchWithCsrf('/api/admin/portfolio/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: item.id, caption }),
      });
      setMedia((current) => current.map((entry) => (entry.id === item.id ? { ...entry, caption } : entry)));
    } catch (err) {
      log.error('Error guardant caption', err);
      setError(err instanceof Error ? err.message : 'Error guardant caption');
    } finally {
      setSavingId(null);
    }
  }, []);

  const handleAssignEvent = useCallback(async (item: MediaItem, eventId: string) => {
    setSavingId(item.id);
    setError(null);
    try {
      await fetchWithCsrf('/api/admin/portfolio/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: item.id, eventId: eventId || null }),
      });
      await loadMedia();
    } catch (err) {
      log.error('Error assignant event', err);
      setError(err instanceof Error ? err.message : 'Error assignant event');
    } finally {
      setSavingId(null);
    }
  }, [loadMedia]);

  const handleSetCover = useCallback(async (eventId: string, mediaUrl: string) => {
    setSavingId(eventId);
    setError(null);
    try {
      await fetchWithCsrf('/api/admin/portfolio/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, coverImage: mediaUrl }),
      });
      await onEventsRefresh();
    } catch (err) {
      log.error('Error actualitzant portada', err);
      setError(err instanceof Error ? err.message : 'Error actualitzant portada');
    } finally {
      setSavingId(null);
    }
  }, [onEventsRefresh]);

  const handleDelete = useCallback(async (item: MediaItem) => {
    const confirmed = await confirm({
      title: 'Eliminar media del portfolio',
      message: `Segur que vols eliminar "${item.caption || 'aquest element'}"? Aquesta acció no es pot desfer.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!confirmed) return;
    setSavingId(item.id);
    setError(null);
    try {
      const coverRefs = coverMap.get(item.mediaUrl) || [];
      if (coverRefs.length > 0) {
        throw new Error('Aquesta imatge és portada d\'un event. Substitueix-la o assigna una altra portada abans d\'eliminar-la.');
      }
      await fetchWithCsrf(`/api/admin/portfolio/media?mediaId=${item.id}`, { method: 'DELETE' });
      await loadMedia();
    } catch (err) {
      log.error('Error eliminant media', err);
      setError(err instanceof Error ? err.message : 'Error eliminant media');
    } finally {
      setSavingId(null);
    }
  }, [confirm, coverMap, loadMedia]);

  const handleDrop = useCallback(async (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const startIndex = media.findIndex((item) => item.id === draggingId);
    const targetIndex = media.findIndex((item) => item.id === targetId);
    if (startIndex === -1 || targetIndex === -1) return;

    const next = [...media];
    const [moved] = next.splice(startIndex, 1);
    next.splice(targetIndex, 0, moved);
    const normalized = next.map((item, index) => ({ ...item, sortOrder: index }));
    setMedia(normalized);
    setDraggingId(null);

    try {
      await persistSortOrder(normalized);
    } catch (err) {
      log.error('Error reordenant media', err);
      setError('No s\'ha pogut guardar el nou ordre');
      await loadMedia();
    }
  }, [draggingId, loadMedia, media, persistSortOrder]);

  const imageCount = media.filter((item) => item.mediaType === 'image').length;
  const videoCount = media.filter((item) => item.mediaType === 'video').length;

  return (
    <div className="ap-card overflow-hidden rounded-2xl">
      <input ref={fileRef} type="file" accept={PORTFOLIO_MEDIA_UPLOAD_ACCEPT} multiple className="hidden" onChange={(event) => event.target.files && void handleUpload(event.target.files)} />
      <input ref={replaceFileRef} type="file" accept={PORTFOLIO_MEDIA_UPLOAD_ACCEPT} className="hidden" onChange={handleReplaceSelection} />

      <button type="button" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--raised)]">
        <div className="flex items-center gap-3">
          <span className="text-lg">🖼️</span>
          <div>
            <p className="font-semibold text-[var(--t)]">{name}</p>
            <p className="text-xs text-[var(--t3)]">{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--t2)]">
          <span className="rounded-full border border-[var(--line)] px-2 py-1">{imageCount} fotos</span>
          <span className="rounded-full border border-[var(--line)] px-2 py-1">{videoCount} vídeos</span>
          <span className={`text-base transition-transform ${expanded ? 'rotate-180' : ''}`}>â–¾</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-[var(--line)] p-5">
          {error && <p className="rounded-xl border admin-tone-border-danger px-3 py-2 text-sm admin-tone-text-danger">{error}</p>}
          <div className="grid gap-3 lg:grid-cols-3">
            <AdminHelpLegend title="Portada" body="És la imatge principal de cada event. La pots marcar des de qualsevol miniatura." />
            <AdminHelpLegend title="Assignació" body="Vincula una peça a un event concret perquè sàpigues on surt i la puguis reutilitzar amb criteri." />
            <AdminHelpLegend title="Ordre" body="L'ordre controla la galeria pública. Arrossega targetes per canviar-lo sense tocar codi." />
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-2xl border-2 border-dashed border-[var(--line)] p-8 text-left transition-colors hover:border-[var(--hair-gold)] adm-row-hover">
              <span className="mb-3 block text-3xl">ï¼‹</span>
              <p className="text-sm font-medium text-[var(--t)]">Afegir media a {name}</p>
              <p className="mt-1 text-xs text-[var(--t3)]">Puja des de l'admin. El backend converteix imatges a AVIF, conserva l'ordre i deixa traça a la BBDD.</p>
              <p className="mt-2 text-xs text-[var(--t3)]">{uploading ? 'Pujant...' : `Límit imatge: ${PORTFOLIO_MEDIA_IMAGE_MAX_SIZE / (1024 * 1024)}MB · vídeo: ${PORTFOLIO_MEDIA_VIDEO_MAX_SIZE / (1024 * 1024)}MB`}</p>
            </button>
            <div className="ap-card p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--t3)]">Events d'aquesta categoria</p>
              <div className="mt-3 space-y-2">
                {categoryEvents.length === 0 ? <p className="text-sm text-[var(--t3)]">Encara no hi ha events creats per aquesta categoria.</p> : categoryEvents.map((eventItem) => <div key={eventItem.id} className="rounded-xl border border-[var(--line)] px-3 py-2"><p className="text-sm font-medium text-[var(--t)]">{eventItem.title}</p><p className="text-xs text-[var(--t3)]">Portada actual: {eventItem.coverImage ? 'assignada' : 'pendent'}</p></div>)}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="aspect-[0.9] animate-pulse rounded-2xl bg-[var(--raised)]" />)}</div>
          ) : media.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--t3)]">{PORTFOLIO_MEDIA_ADMIN_EMPTY_STATE}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {media.map((item) => {
                const coverRefs = coverMap.get(item.mediaUrl) || [];
                return (
                  <div key={item.id} draggable={!item.isStatic} onDragStart={() => !item.isStatic && setDraggingId(item.id)} onDragOver={(event) => !item.isStatic && event.preventDefault()} onDrop={() => !item.isStatic && void handleDrop(item.id)} className={`overflow-hidden rounded-2xl border bg-[var(--o-admin-fill-1)] transition-colors ${draggingId === item.id ? 'border-[var(--hair-gold)]' : 'border-[var(--line)] hover:border-[var(--hair-gold)]'}`}>
                    <div className="grid gap-0 md:grid-cols-[18rem_minmax(0,1fr)]">
                      <button type="button" onClick={() => onOpenPreview({ url: item.mediaUrl, type: item.mediaType, alt: item.caption || `${name} media` })} className="relative aspect-[4/3] bg-black">
                        {item.mediaType === 'image' ? <Image src={item.mediaUrl} alt={item.caption || `${name} media`} fill sizes="(max-width: 768px) 100vw, 288px" className="object-cover" /> : <video src={item.mediaUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />}
                        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-[var(--t)]">{item.mediaType === 'image' ? 'Imatge' : 'Vídeo'} · #{item.sortOrder + 1}</div>
                        <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-1 text-xs text-[var(--t)]">Clic per ampliar</div>
                      </button>
                      <div className="space-y-4 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--t)]">{item.caption || 'Sense caption'}</p>
                            <p className="text-xs text-[var(--t3)]">ID {item.id.slice(0, 8)} · destí /portfolio/{slug}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--t3)]">
                            <span className="rounded-full border border-[var(--line)] px-2 py-1">{item.isStatic ? 'Catàleg públic actual' : 'Drag & drop'}</span>
                            {item.event ? <span className="rounded-full border admin-tone-border-info px-2 py-1 admin-tone-text-info">Vinculat a {item.event.title}</span> : <span className="rounded-full border border-[var(--line)] px-2 py-1">Sense event</span>}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-[var(--t3)]">Llegenda / codi intern</label>
                          <input defaultValue={item.caption || ''} disabled={item.isStatic} onBlur={(event) => { if ((item.caption || '') !== event.target.value) { void handleCaptionSave(item, event.target.value); } }} className="w-full ap-card px-3 py-2 text-sm text-[var(--t2)] disabled:cursor-not-allowed disabled:opacity-60" placeholder="Ex: entrada-cerimonia" />
                          <p className="mt-1 text-xs text-[var(--t3)]">{item.isStatic ? 'Aquesta peça ve del catàleg públic actual. Per editar-la o reordenar-la, primer cal migrar-la al portfolio de BBDD.' : "Aquesta etiqueta t'ajuda a saber què és la peça sense obrir-la."}</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-[var(--t3)]">Assignar a event</label>
                            <select value={item.event?.id || ''} disabled={item.isStatic} onChange={(event) => void handleAssignEvent(item, event.target.value)} className="w-full ap-card px-3 py-2 text-sm text-[var(--t2)] disabled:cursor-not-allowed disabled:opacity-60">
                              <option value="">Sense assignació</option>
                              {categoryEvents.map((eventItem) => <option key={eventItem.id} value={eventItem.id}>{eventItem.title}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-[var(--t3)]">Fer portada de</label>
                            <div className="flex flex-wrap gap-2">
                              {categoryEvents.length === 0 ? <p className="text-xs text-[var(--t3)]">Crea primer un event.</p> : categoryEvents.map((eventItem) => {
                                const active = coverRefs.some((coverEvent) => coverEvent.id === eventItem.id);
                                return <button key={eventItem.id} type="button" disabled={item.isStatic} onClick={() => void handleSetCover(eventItem.id, item.mediaUrl)} className={`rounded-full border px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning' : 'border-[var(--line)] text-[var(--t2)] hover:bg-[var(--raised)]'}`}>{active ? `Portada: ${eventItem.title}` : eventItem.title}</button>;
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={item.isStatic} onClick={() => { replaceTargetRef.current = item; replaceFileRef.current?.click(); }} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--t2)] hover:bg-[var(--raised)] disabled:cursor-not-allowed disabled:opacity-60">Substituir fitxer</button>
                          <button type="button" onClick={() => void handleDelete(item)} disabled={savingId === item.id || item.isStatic} className="rounded-xl border admin-tone-border-danger px-3 py-2 text-sm admin-tone-text-danger hover:admin-tone-bg-danger disabled:opacity-50">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

function EventsManager({ events, onEventsRefresh }: { events: PortfolioEvent[]; onEventsRefresh: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();
  const [form, setForm] = useState<EventFormState>(EMPTY_EVENT_FORM);

  const handleSubmit = useCallback(async () => {
    if (!form.slug || !form.title || !form.coverImage) {
      setError('Slug, títol i portada són obligatoris');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetchWithCsrf('/api/admin/portfolio/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildEventPayload(form)),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Error creant event');
      }
      setForm(EMPTY_EVENT_FORM);
      setShowForm(false);
      await onEventsRefresh();
    } catch (err) {
      log.error('Error creant event', err);
      setError(err instanceof Error ? err.message : 'Error creant event');
    } finally {
      setSaving(false);
    }
  }, [form, onEventsRefresh]);

  const togglePublished = useCallback(async (eventItem: PortfolioEvent) => {
    try {
      await fetchWithCsrf('/api/admin/portfolio/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventItem.id, published: !eventItem.published }),
      });
      await onEventsRefresh();
    } catch (err) {
      log.error('Error actualitzant event', err);
      setError(err instanceof Error ? err.message : 'Error actualitzant event');
    }
  }, [onEventsRefresh]);

  const deleteEvent = useCallback(async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar event del portfolio',
      message: 'Segur que vols eliminar aquest event del portfolio? Aquesta acció no es pot desfer.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!confirmed) return;
    try {
      await fetchWithCsrf(`/api/admin/portfolio/events?id=${id}`, { method: 'DELETE' });
      await onEventsRefresh();
    } catch (err) {
      log.error('Error eliminant event', err);
      setError(err instanceof Error ? err.message : 'Error eliminant event');
    }
  }, [confirm, onEventsRefresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="ap-h2 text-[var(--t)]">Events del portfolio</h2>
          <p className="text-xs text-[var(--t3)]">Cada event és una mini-pàgina pública amb portada, metadades i galeria vinculada.</p>
        </div>
        <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm text-[var(--t2)] hover:bg-[var(--raised)]">{showForm ? 'Tancar formulari' : '+ Nou event'}</button>
      </div>
      {error && <p className="rounded-xl border admin-tone-border-danger px-3 py-2 text-sm admin-tone-text-danger">{error}</p>}
      <div className="grid gap-3 lg:grid-cols-3">
        <AdminHelpLegend title="Portada" body="És la imatge que representa l'event a la web. Es pot triar des de la pestanya de media." />
        <AdminHelpLegend title="Publicació" body="Un event en esborrany existeix a l'admin però no es veu a la part pública." />
        <AdminHelpLegend title="Relació amb media" body="La galeria no es guarda aquí: cada peça es vincula des de la pestanya Media per mantenir-ho monocapa." />
      </div>
      {showForm ? (
        <div className="ap-card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/g, '') }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" placeholder="Títol de l'event" />
            <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" placeholder="Slug URL" />
            <select value={form.categorySlug} onChange={(event) => setForm((current) => ({ ...current, categorySlug: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]">{PORTFOLIO_CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select>
            <input value={form.coverImage} onChange={(event) => setForm((current) => ({ ...current, coverImage: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" placeholder="URL de portada" />
            <input value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" placeholder="Subtítol" />
            <input value={form.venue} onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" placeholder="Venue" />
            <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" placeholder="Ubicació" />
            <input type="date" value={form.eventDate} onChange={(event) => setForm((current) => ({ ...current, eventDate: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" />
            <input type="number" min={0} value={form.guestCount} onChange={(event) => setForm((current) => ({ ...current, guestCount: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)]" placeholder="Convidats" />
            <input value={form.services} onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)] md:col-span-2" placeholder="Serveis separats per coma" />
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="ap-card px-3 py-2.5 text-sm text-[var(--t2)] md:col-span-2" placeholder="Descripció" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[var(--t2)]"><input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} />Publicat</label>
            <button type="button" onClick={() => void handleSubmit()} disabled={saving} className="ap-btn ap-btn--primary">{saving ? 'Guardant...' : 'Crear event'}</button>
          </div>
        </div>
      ) : null}
      <div className="space-y-3">
        {events.map((eventItem) => (
          <div key={eventItem.id} className="ap-card rounded-2xl p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-black">{eventItem.coverImage ? <Image src={eventItem.coverImage} alt={eventItem.title} fill className="object-cover" sizes="96px" /> : null}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-[var(--t)]">{eventItem.title}</p><span className={`rounded-full px-2 py-1 text-xs ${eventItem.published ? 'admin-tone-bg-success admin-tone-text-success' : 'bg-[var(--o-admin-light)]/10 text-[var(--t2)]'}`}>{eventItem.published ? 'Publicat' : 'Esborrany'}</span></div>
                <p className="mt-1 text-xs text-[var(--t3)]">/{eventItem.categorySlug}/{eventItem.slug} · {eventItem._count?.media || 0} elements vinculats</p>
                <p className="mt-1 text-xs text-[var(--t3)]">Portada: {eventItem.coverImage || 'pendent'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void togglePublished(eventItem)} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--t2)] hover:bg-[var(--raised)]">{eventItem.published ? 'Despublicar' : 'Publicar'}</button>
                <button type="button" onClick={() => void deleteEvent(eventItem.id)} className="rounded-xl border admin-tone-border-danger px-3 py-2 text-sm admin-tone-text-danger hover:admin-tone-bg-danger">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

type AdminTab = 'media' | 'events';

export default function AdminPortfolioPage() {
  const [tab, setTab] = useState<AdminTab>('media');
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const response = await fetchWithCsrf('/api/admin/portfolio/events?published=all', { cache: 'no-store' });
      if (!response.ok) throw new Error('Error carregant events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      log.error('Error carregant events', err);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      if (window.location.hash === '#media') setTab('media');
      else if (window.location.hash === '#events') setTab('events');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);


  return (
    <AdminPage
      title="Portfolio"
      subtitle="Gestor visual únic del portfolio: miniatures, destinació real, portada, ordre, substitució i assignació d'events."
    >
      <FullscreenPreview preview={preview} onClose={() => setPreview(null)} />
      <div className="grid gap-3 lg:grid-cols-3">
        <AdminHelpLegend title="Què estàs veient" body="Media gestiona fitxers i ordre. Events gestiona la pàgina pública i les seves metadades." />
        <AdminHelpLegend title="Com treballar" body="Primer crea o revisa l'event. Després vincula les imatges, tria portada i ordena la galeria des de Media." />
        <AdminHelpLegend title="Protecció" body="Les peces marcades com a portada no es deixen eliminar a cegues. Així s'evita trencar la web sense voler." />
      </div>
      <div id="media" />
      <div id="events" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setTab('media')} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === 'media' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}>Media</button>
        <button type="button" onClick={() => setTab('events')} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === 'events' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}>Events</button>
      </div>
      {tab === 'media' ? (
        <div className="space-y-3">
          {eventsLoading ? <div className="ap-card p-6 text-sm text-[var(--t3)]">Carregant events i assignacions...</div> : PORTFOLIO_CATEGORIES.map((category) => <CategorySection key={category.slug} slug={category.slug} name={category.name} events={events} onEventsRefresh={loadEvents} onOpenPreview={setPreview} />)}
        </div>
      ) : (
        <EventsManager events={events} onEventsRefresh={loadEvents} />
      )}
    </AdminPage>
  );
}












