'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import {
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_POST_STATUS_LABELS,
  SOCIAL_CONTENT_TYPE_LABELS,
  SOCIAL_CATEGORY_LABELS,
  SOCIAL_PLATFORMS,
  SOCIAL_POST_STATUSES,
  SOCIAL_CONTENT_TYPES,
  SOCIAL_CATEGORIES,
  type SocialPlatform,
  type SocialPostStatus,
  type SocialContentType,
  type SocialCategory,
} from '@/lib/constants';

type SerializedPost = {
  id: string;
  title: string;
  caption: string | null;
  hashtags: string[];
  platforms: string[];
  status: string;
  contentType: string;
  category: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  mediaUrls: string[];
  bookingId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type SerializedIdea = {
  id: string;
  source: 'booking' | 'testimonial' | 'portfolio' | 'upcoming-event';
  title: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  contentType: string;
  category: string;
  scheduledAt: string | null;
  mediaUrl: string | null;
  sourceRef: { type: string; id: string; label: string };
  reason: string;
};

type PostSeed = {
  title: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  contentType: string;
  category: string;
  scheduledAt: string | null;
  mediaUrl: string | null;
  bookingId: string | null;
};

type Counts = Record<SocialPostStatus, number>;

const IDEA_SOURCE_ICON: Record<SerializedIdea['source'], string> = {
  booking: '📅',
  testimonial: '⭐',
  portfolio: '🖼️',
  'upcoming-event': '⏳',
};

const IDEA_SOURCE_LABEL: Record<SerializedIdea['source'], string> = {
  booking: 'Esdeveniment recent',
  testimonial: 'Testimoni aprovat',
  portfolio: 'Nou al portfolio',
  'upcoming-event': 'Teaser proper',
};

const STATUS_TONE: Record<string, string> = {
  IDEA: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
  DRAFT: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  SCHEDULED: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
  PUBLISHED: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  ARCHIVED: 'bg-white/[0.03] border-white/10 text-white/40',
};

const PLATFORM_ICON: Record<string, string> = {
  INSTAGRAM: '📸',
  TIKTOK: '🎵',
  FACEBOOK: '📘',
  LINKEDIN: '💼',
  X: '🐦',
  PINTEREST: '📌',
  YOUTUBE: '🎬',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SocialClient({
  initialPosts,
  initialCounts,
  initialIdeas = [],
}: {
  initialPosts: SerializedPost[];
  initialCounts: Counts;
  initialIdeas?: SerializedIdea[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [counts] = useState(initialCounts);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState<SerializedPost | null>(null);
  const [postSeed, setPostSeed] = useState<PostSeed | null>(null);
  const [showIdeas, setShowIdeas] = useState(true);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredPosts = useMemo(() => {
    if (statusFilter === 'all') return posts;
    return posts.filter((p) => p.status === statusFilter);
  }, [posts, statusFilter]);

  // Calendar grouping
  const calendarData = useMemo(() => {
    const grouped: Record<string, SerializedPost[]> = {};
    for (const post of posts) {
      const ref = post.scheduledAt ?? post.publishedAt;
      if (!ref) continue;
      const key = ref.slice(0, 10);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(post);
    }
    return grouped;
  }, [posts]);

  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const calDays = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month, 1);
    const lastDay = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const startOffset = (first.getDay() + 6) % 7; // Monday = 0
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(calMonth.year, calMonth.month, -i);
      days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(calMonth.year, calMonth.month, d);
      days.push({ date: date.toISOString().slice(0, 10), day: d, isCurrentMonth: true });
    }
    // Next month padding
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(calMonth.year, calMonth.month + 1, i);
        days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false });
      }
    }
    return days;
  }, [calMonth]);

  async function handleDelete(id: string) {
    if (!confirm('Segur que vols eliminar aquesta publicació?')) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/social-posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setFlash({ type: 'success', text: 'Publicació eliminada' });
      router.refresh();
    } catch {
      setFlash({ type: 'error', text: 'Error eliminant publicació' });
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetchWithCsrf(`/api/admin/social-posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p));
      setFlash({ type: 'success', text: `Estat canviat a ${SOCIAL_POST_STATUS_LABELS[newStatus as SocialPostStatus] || newStatus}` });
    } catch {
      setFlash({ type: 'error', text: 'Error canviant estat' });
    }
  }

  function handleUseIdea(idea: SerializedIdea) {
    setEditingPost(null);
    setPostSeed({
      title: idea.title,
      caption: idea.caption,
      hashtags: idea.hashtags,
      platforms: idea.platforms,
      contentType: idea.contentType,
      category: idea.category,
      scheduledAt: idea.scheduledAt,
      mediaUrl: idea.mediaUrl,
      bookingId: idea.source === 'booking' ? idea.sourceRef.id : null,
    });
    setShowCreate(true);
  }

  function handleDismissIdea(ideaId: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  }

  const totalPosts = counts.IDEA + counts.DRAFT + counts.SCHEDULED + counts.PUBLISHED + counts.ARCHIVED;
  const scheduledCount = counts.SCHEDULED ?? 0;
  const draftCount = counts.DRAFT ?? 0;
  const publishedCount = counts.PUBLISHED ?? 0;
  const weakestLink = totalPosts === 0
    ? 'Encara no hi ha cap peça al calendari editorial.'
    : draftCount > 0
      ? `${draftCount} publicacions continuen en esborrany i demanen decisió editorial.`
      : scheduledCount === 0 && publishedCount === 0
        ? 'Hi ha peces en pipeline però cap calendari o publicació activa ara mateix.'
        : 'El calendari té peça viva i no hi ha coll editorial evident al primer nivell.';
  const nextStepTitle = totalPosts === 0
    ? 'Crear la primera publicació del calendari'
    : draftCount > 0
      ? 'Tancar esborranys abans d’obrir més fronts'
      : ideas.length > 0
        ? 'Convertir idees suggerides en peces programades'
        : 'Mantenir el calendari viu i revisar la propera onada';
  const nextStepDescription = totalPosts === 0
    ? 'Sense peces al calendari no hi ha pipeline social real per operar.'
    : draftCount > 0
      ? 'El retorn més alt aquí no és generar més idees, sinó passar primer els esborranys a programats o descartar-los.'
      : ideas.length > 0
        ? 'La millor palanca actual és transformar idees automàtiques en publicacions reals abans que es refredin.'
        : 'Amb el pipeline estable, el següent pas útil és revisar programació, publicació i tracció del calendari actual.';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què veu el sistema al calendari social',
          items: [
            `${totalPosts} peces totals al pipeline social.`,
            ideas.length > 0
              ? `${ideas.length} idees generades automàticament des de bookings, testimonials, portfolio o esdeveniments propers.`
              : 'Sense idees automàtiques pendents ara mateix.',
            view === 'calendar'
              ? 'La vista activa és calendari i el sistema agrupa el contingut per dia.'
              : 'La vista activa és llista i el sistema prioritza estat i accions directes.',
          ],
          tone: totalPosts > 0 ? 'info' : 'warning',
          emptyText: 'Encara no hi ha lectura automàtica útil perquè no hi ha peces al pipeline.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On et cal intervenir',
          items: [
            weakestLink,
            statusFilter === 'all'
              ? 'No hi ha filtre d’estat actiu: estàs governant el catàleg complet.'
              : `Hi ha filtre actiu sobre ${SOCIAL_POST_STATUS_LABELS[statusFilter as SocialPostStatus] || statusFilter}.`,
            showIdeas
              ? 'El panell d’idees és visible i permet convertir o descartar suggeriments.'
              : 'El panell d’idees està ocult i no està entrant a la lectura principal.',
          ],
          tone: draftCount > 0 || totalPosts === 0 ? 'warning' : 'success',
          emptyText: 'No hi ha coll manual evident al primer nivell.',
        }}
        nextStep={{
          eyebrow: 'Següent pas',
          title: nextStepTitle,
          detail: `${nextStepDescription} Ara tens ${scheduledCount} programades i ${publishedCount} publicades.`,
          href: '/admin/social',
          ctaLabel: totalPosts === 0 ? 'Crear publicació' : 'Revisar calendari',
          secondaryAction: ideas.length > 0
            ? { href: '/admin/social', label: 'Veure idees' }
            : undefined,
        }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(SOCIAL_POST_STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            type="button"
            className={`admin-stagger-item rounded-xl border p-3 text-left transition-colors ${statusFilter === key ? STATUS_TONE[key] : 'border-white/10 admin-card-glass hover:bg-white/[0.06]'}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">{label}</p>
            <p className="mt-1 text-xl font-bold">{counts[key as SocialPostStatus]}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setView('list')}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'}`}
          >
            Llista
          </button>
          <button
            onClick={() => setView('calendar')}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'}`}
          >
            Calendari
          </button>
          <span className="text-xs opacity-50 sm:ml-2">{filteredPosts.length} de {totalPosts}</span>
        </div>
        <button
          onClick={() => { setEditingPost(null); setShowCreate(true); }}
          type="button"
          className="ap-btn ap-btn--primary w-full sm:w-auto"
        >
          + Nova publicació
        </button>
      </div>

      {flash && (
        <div className={`rounded-xl border px-4 py-2 text-sm ${flash.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
          {flash.text}
          <button onClick={() => setFlash(null)} type="button" className="ml-3 text-xs opacity-60">✕</button>
        </div>
      )}

      {/* Ideas Panel — auto-generades des de bookings, testimonials, portfolio i events futurs */}
      {ideas.length > 0 && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-4 admin-card-glass">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span>💡</span>
                <span>Idees suggerides</span>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-200">{ideas.length}</span>
              </h3>
              <p className="mt-0.5 text-[11px] opacity-50">Generades automàticament des de bookings, testimonials, portfolio i esdeveniments propers.</p>
            </div>
            <button
              onClick={() => setShowIdeas((v) => !v)}
              type="button"
              className="rounded-lg border border-white/10 px-2 py-1 text-[11px] hover:bg-white/5 sm:self-auto self-start"
            >
              {showIdeas ? 'Amagar' : 'Mostrar'}
            </button>
          </div>

          {showIdeas && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="admin-stagger-item rounded-lg border border-white/10 admin-card-glass p-3 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] opacity-60">
                        <span>{IDEA_SOURCE_ICON[idea.source]}</span>
                        <span>{IDEA_SOURCE_LABEL[idea.source]}</span>
                        <span>·</span>
                        <span>{SOCIAL_CATEGORY_LABELS[idea.category as SocialCategory] || idea.category}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold truncate">{idea.title}</p>
                      <p className="mt-0.5 text-[11px] opacity-60 line-clamp-2">{idea.caption}</p>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {idea.platforms.map((p) => (
                          <span key={p} className="text-xs opacity-70" title={SOCIAL_PLATFORM_LABELS[p as SocialPlatform]}>
                            {PLATFORM_ICON[p] || p}
                          </span>
                        ))}
                        <span className="text-[9px] opacity-40">·</span>
                        <span className="text-[9px] opacity-50">{idea.reason}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => handleUseIdea(idea)}
                      type="button"
                      className="flex-1 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-medium text-cyan-200 hover:bg-cyan-500/20"
                    >
                      Usar aquesta idea
                    </button>
                    <button
                      onClick={() => handleDismissIdea(idea.id)}
                      type="button"
                      className="rounded border border-white/10 px-2 py-1 text-[10px] opacity-60 hover:bg-white/5"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-2">
          {filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-4xl">📱</p>
              <p className="mt-3 text-sm font-semibold opacity-80">Cap publicació {statusFilter !== 'all' ? `amb estat "${SOCIAL_POST_STATUS_LABELS[statusFilter as SocialPostStatus]}"` : ''}</p>
              <p className="mt-1 text-xs opacity-50">Crea la primera publicació per començar el calendari editorial.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="admin-stagger-item rounded-xl border border-white/10 admin-card-glass p-4 hover:bg-white/[0.04] transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_TONE[post.status]}`}>
                        {SOCIAL_POST_STATUS_LABELS[post.status as SocialPostStatus] || post.status}
                      </span>
                      {post.platforms.map((p) => (
                        <span key={p} className="text-xs opacity-70" title={SOCIAL_PLATFORM_LABELS[p as SocialPlatform]}>
                          {PLATFORM_ICON[p] || p}
                        </span>
                      ))}
                      {post.category && (
                        <span className="text-[10px] opacity-50">{SOCIAL_CATEGORY_LABELS[post.category as SocialCategory] || post.category}</span>
                      )}
                      <span className="text-[10px] opacity-40">{SOCIAL_CONTENT_TYPE_LABELS[post.contentType as SocialContentType]}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-sm truncate">{post.title}</p>
                    {post.caption && <p className="mt-0.5 text-xs opacity-60 line-clamp-2">{post.caption}</p>}
                    {post.hashtags.length > 0 && (
                      <p className="mt-1 text-[11px] text-cyan-400/60">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-left sm:max-w-none sm:shrink-0 sm:items-end sm:text-right max-w-full">
                    <span className="text-[11px] opacity-50">
                      {post.scheduledAt ? `Programat: ${formatDateTime(post.scheduledAt)}` : formatDate(post.createdAt)}
                    </span>
                    {post.publishedAt && <span className="text-[10px] text-emerald-400/60">Publicat: {formatDate(post.publishedAt)}</span>}
                    {!post.publishedAt && post.scheduledAt && ['DRAFT', 'SCHEDULED'].includes(post.status) && (
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">⏰ Alarma Calendar</span>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <select
                        value={post.status}
                        onChange={(e) => handleStatusChange(post.id, e.target.value)}
                        className="min-w-0 rounded border border-white/10 bg-transparent px-1.5 py-0.5 text-[10px]"
                      >
                        {Object.entries(SOCIAL_POST_STATUSES).map(([, val]) => (
                          <option key={val} value={val}>{SOCIAL_POST_STATUS_LABELS[val]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => { setEditingPost(post); setShowCreate(true); }}
                        type="button"
                        className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] hover:bg-white/10"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        type="button"
                        className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] hover:bg-rose-500/20"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setCalMonth((m) => {
                const d = new Date(m.year, m.month - 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              type="button"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              ◀
            </button>
            <h3 className="min-w-0 text-center text-sm font-semibold">
              {new Date(calMonth.year, calMonth.month).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCalMonth((m) => {
                const d = new Date(m.year, m.month + 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              type="button"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              ▶
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl">
            <div className="grid min-w-[720px] grid-cols-7 gap-px overflow-x-auto rounded-xl border border-white/10 overflow-hidden admin-card-glass">
            {['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map((d) => (
              <div key={d} className="bg-white/[0.05] p-2 text-center text-[10px] font-semibold uppercase tracking-wider opacity-50">
                {d}
              </div>
            ))}
            {calDays.map((day) => {
              const dayPosts = calendarData[day.date] || [];
              const isToday = day.date === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={day.date}
                  className={`min-h-[80px] border-t border-white/5 p-1.5 ${day.isCurrentMonth ? 'bg-white/[0.02]' : 'bg-transparent opacity-30'} ${isToday ? 'ring-1 ring-inset ring-cyan-500/40' : ''}`}
                >
                  <p className={`text-[11px] font-medium ${isToday ? 'text-cyan-300' : 'opacity-60'}`}>{day.day}</p>
                  <div className="mt-0.5 space-y-0.5">
                    {dayPosts.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setEditingPost(p); setShowCreate(true); }}
                        type="button"
                        className={`w-full rounded px-1 py-0.5 text-left text-[9px] font-medium truncate ${STATUS_TONE[p.status]}`}
                      >
                        {p.platforms.map((pl) => PLATFORM_ICON[pl] || '').join('')} {p.title}{!p.publishedAt && p.scheduledAt && ['DRAFT', 'SCHEDULED'].includes(p.status) ? ' ⏰' : ''}
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-[9px] opacity-40">+{dayPosts.length - 3} més</p>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <SocialPostModal
          post={editingPost}
          seed={postSeed}
          onClose={() => { setShowCreate(false); setEditingPost(null); setPostSeed(null); }}
          onSaved={(saved) => {
            if (editingPost) {
              setPosts((prev) => prev.map((p) => p.id === saved.id ? saved : p));
            } else {
              setPosts((prev) => [saved, ...prev]);
              // Si venia d'una idea, la treiem de la llista
              if (postSeed) {
                const matchingIdea = ideas.find((i) =>
                  i.title === postSeed.title ||
                  (postSeed.bookingId && i.sourceRef.id === postSeed.bookingId)
                );
                if (matchingIdea) handleDismissIdea(matchingIdea.id);
              }
            }
            setShowCreate(false);
            setEditingPost(null);
            setPostSeed(null);
            setFlash({ type: 'success', text: editingPost ? 'Publicació actualitzada' : 'Publicació creada' });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function SocialPostModal({
  post,
  seed,
  onClose,
  onSaved,
}: {
  post: SerializedPost | null;
  seed?: PostSeed | null;
  onClose: () => void;
  onSaved: (post: SerializedPost) => void;
}) {
  const [title, setTitle] = useState(post?.title ?? seed?.title ?? '');
  const [caption, setCaption] = useState(post?.caption ?? seed?.caption ?? '');
  const [hashtags, setHashtags] = useState(
    post?.hashtags.join(', ') ?? seed?.hashtags.join(', ') ?? ''
  );
  const [platforms, setPlatforms] = useState<string[]>(
    post?.platforms ?? seed?.platforms ?? ['INSTAGRAM']
  );
  const [status, setStatus] = useState(post?.status ?? 'DRAFT');
  const [contentType, setContentType] = useState(post?.contentType ?? seed?.contentType ?? 'IMAGE');
  const [category, setCategory] = useState(post?.category ?? seed?.category ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduledAt?.slice(0, 16) ?? seed?.scheduledAt?.slice(0, 16) ?? ''
  );
  const [notes, setNotes] = useState(post?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      title: title.trim(),
      caption: caption.trim() || null,
      hashtags: hashtags.split(',').map((h) => h.trim().replace(/^#/, '')).filter(Boolean),
      platforms,
      status,
      contentType,
      category: category || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      notes: notes.trim() || null,
    };
    if (!post && seed) {
      if (seed.bookingId) body.bookingId = seed.bookingId;
      if (seed.mediaUrl) body.mediaUrls = [seed.mediaUrl];
    }

    try {
      const url = post ? `/api/admin/social-posts/${post.id}` : '/api/admin/social-posts';
      const method = post ? 'PATCH' : 'POST';
      const res = await fetchWithCsrf(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Error desant');
        return;
      }
      const saved = data.post;
      onSaved({
        ...saved,
        createdAt: saved.createdAt ?? post?.createdAt ?? new Date().toISOString(),
        updatedAt: saved.updatedAt ?? new Date().toISOString(),
        scheduledAt: saved.scheduledAt ?? null,
        publishedAt: saved.publishedAt ?? null,
      });
    } catch {
      setError('Error de connexió');
    } finally {
      setSaving(false);
    }
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-semibold">{post ? 'Editar publicació' : 'Nova publicació'}</h2>

        {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Títol *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className="ap-input w-full" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Plataformes *</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SOCIAL_PLATFORMS).map(([, val]) => (
              <button
                key={val}
                type="button"
                onClick={() => togglePlatform(val)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${platforms.includes(val) ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'border-white/10 hover:bg-white/5'}`}
              >
                {PLATFORM_ICON[val]} {SOCIAL_PLATFORM_LABELS[val as SocialPlatform]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Estat</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="ap-input w-full">
              {Object.entries(SOCIAL_POST_STATUSES).map(([, val]) => (
                <option key={val} value={val}>{SOCIAL_POST_STATUS_LABELS[val]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Tipus</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="ap-input w-full">
              {Object.entries(SOCIAL_CONTENT_TYPES).map(([, val]) => (
                <option key={val} value={val}>{SOCIAL_CONTENT_TYPE_LABELS[val]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="ap-input w-full">
              <option value="">— Cap —</option>
              {Object.entries(SOCIAL_CATEGORIES).map(([, val]) => (
                <option key={val} value={val}>{SOCIAL_CATEGORY_LABELS[val]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Data programada</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="ap-input w-full" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Descripció / Caption</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="ap-input w-full" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Hashtags (separats per comes)</label>
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="events, wedding, dj" className="ap-input w-full" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Notes internes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="ap-input w-full" />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
            Cancel·lar
          </button>
          <button type="submit" disabled={saving || !title.trim() || platforms.length === 0} className="ap-btn ap-btn--primary px-6 py-2 disabled:opacity-50 sm:w-auto w-full">
            {saving ? 'Desant...' : post ? 'Desar canvis' : 'Crear publicació'}
          </button>
        </div>
      </form>
    </div>
  );
}




