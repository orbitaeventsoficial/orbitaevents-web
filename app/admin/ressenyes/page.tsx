// app/admin/ressenyes/page.tsx
'use client';

import { useEffect, useState } from 'react';

type DiscountInfo = {
  code: string;
  discountPercent: number;
  validUntil: string;
  isActive: boolean;
};

type GoogleReview = {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
};

type GoogleReviewsData = {
  lastUpdated?: string;
  rating: number;
  user_ratings_total?: number;
  reviews: GoogleReview[];
};

function csvEscape(value: unknown): string {
  const str = String(value ?? '');
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type Testimonial = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  eventType: string | null;
  eventDate: string | null;
  createdAt: string;
  isApproved: boolean;
  showName: boolean;
  showPhoto: boolean;
  photoUrl: string | null;
  customer: {
    email: string;
    phone: string | null;
    instagram: string | null;
  };
  discount?: DiscountInfo | null;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  avgRating: number;
};

const EVENT_TYPES = [
  'WEDDING',
  'BIRTHDAY',
  'CORPORATE',
  'COMMUNION',
  'BAPTISM',
  'GRADUATION',
  'ANNIVERSARY',
  'PRIVATE_PARTY',
  'OTHER',
] as const;

const STATUS_TABS = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Publicados' },
  { id: 'all', label: 'Todos' },
  { id: 'google', label: 'Google Reviews' },
] as const;

export default function CustomerTestimonialsAdminPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['id']>('pending');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [googleData, setGoogleData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleRatingFilter, setGoogleRatingFilter] = useState('all');
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Testimonial>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    text: '',
    eventType: 'OTHER',
    eventDate: '',
    discountPercent: '',
  });

  useEffect(() => {
    loadData();
  }, [status]);

  async function loadData() {
    setLoading(true);
    try {
      if (status === 'google') {
        const response = await fetch('/api/google-reviews');
        const data = await response.json();
        setGoogleData(data);
      } else {
        const response = await fetch(
          `/api/admin/customer-testimonials?status=${status}&stats=true`
        );
        const data = await response.json();
        setTestimonials(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    id: string,
    payload: Record<string, unknown>,
    successMessage?: string
  ): Promise<boolean> {
    const res = await fetch('/api/admin/customer-testimonials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFlashMessage({
        type: 'error',
        text: data?.error || 'Error actualizando testimonio',
      });
      return false;
    }
    if (successMessage) {
      setFlashMessage({ type: 'success', text: successMessage });
    }
    await loadData();
    return true;
  }

  function startEdit(testimonial: Testimonial) {
    setEditingId(testimonial.id);
    setEditForm({
      comment: testimonial.comment,
      rating: testimonial.rating,
      showName: testimonial.showName,
      showPhoto: testimonial.showPhoto,
      eventType: testimonial.eventType,
      eventDate: testimonial.eventDate,
    });
  }

  async function saveEdit(id: string) {
    const ok = await runAction(
      id,
      {
        action: 'update',
        text: editForm.comment,
        rating: editForm.rating,
        showName: editForm.showName,
        showPhoto: editForm.showPhoto,
        eventType: editForm.eventType,
        eventDate: editForm.eventDate || null,
      },
      'Testimonio actualizado'
    );
    if (ok) setEditingId(null);
  }

  async function deleteTestimonial(id: string) {
    if (!confirm('¿Eliminar este testimonio? Esta acción no se puede deshacer.')) return;
    const res = await fetch(`/api/admin/customer-testimonials?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFlashMessage({
        type: 'error',
        text: data?.error || 'Error eliminando testimonio',
      });
      return;
    }
    setFlashMessage({ type: 'success', text: 'Testimonio eliminado' });
    await loadData();
  }

  async function assignDiscount(id: string) {
    const value = discountInputs[id];
    const percent = Number(value);
    if (!percent || percent <= 0) {
      setFlashMessage({ type: 'error', text: 'Introduce un porcentaje válido' });
      return;
    }
    const ok = await runAction(
      id,
      { action: 'discount', discountPercent: percent },
      'Descuento asignado'
    );
    if (ok) {
      setDiscountInputs((prev) => ({ ...prev, [id]: '' }));
    }
  }

  async function createManualTestimonial() {
    if (!createForm.customerName || !createForm.text) {
      setFlashMessage({ type: 'error', text: 'Nombre y texto son obligatorios' });
      return;
    }
    const res = await fetch('/api/admin/customer-testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: createForm.customerName,
        customerEmail: createForm.customerEmail || undefined,
        rating: createForm.rating,
        text: createForm.text,
        eventType: createForm.eventType,
        eventDate: createForm.eventDate || undefined,
        discountPercent: createForm.discountPercent
          ? Number(createForm.discountPercent)
          : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFlashMessage({
        type: 'error',
        text: data?.error || 'Error creando testimonio',
      });
      return;
    }
    setCreateForm({
      customerName: '',
      customerEmail: '',
      rating: 5,
      text: '',
      eventType: 'OTHER',
      eventDate: '',
      discountPercent: '',
    });
    setCreating(false);
    setFlashMessage({ type: 'success', text: 'Testimonio creado' });
    await loadData();
  }

  async function syncGoogleReviews() {
    setSyncingGoogle(true);
    try {
      const response = await fetch('/api/google-reviews');
      const data = await response.json();
      setGoogleData(data);
    } catch (error) {
      console.error('Error loading Google reviews:', error);
      setFlashMessage({ type: 'error', text: 'Error cargando reseñas de Google' });
    } finally {
      setSyncingGoogle(false);
    }
  }

  const filteredGoogleReviews =
    googleData?.reviews
      ?.filter((review) => {
        if (googleRatingFilter === 'all') return true;
        return String(review.rating) === googleRatingFilter;
      })
      .filter((review) => {
        const query = googleQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          review.author_name.toLowerCase().includes(query) ||
          review.text.toLowerCase().includes(query)
        );
      }) ?? [];

  function exportTestimonials() {
    const rows = [
      [
        'id',
        'nombre',
        'email',
        'rating',
        'comentario',
        'evento',
        'fecha_evento',
        'aprobado',
        'descuento_codigo',
        'descuento_percent',
        'creado',
      ],
      ...testimonials.map((t) => [
        t.id,
        t.name,
        t.customer.email,
        t.rating,
        t.comment,
        t.eventType || '',
        t.eventDate || '',
        t.isApproved ? 'true' : 'false',
        t.discount?.code || '',
        t.discount?.discountPercent || '',
        t.createdAt,
      ]),
    ];
    downloadCsv(`testimonios-${status}.csv`, rows);
  }

  function exportGoogleReviews() {
    const rows = [
      ['autor', 'rating', 'texto', 'fecha_relativa', 'timestamp'],
      ...filteredGoogleReviews.map((review) => [
        review.author_name,
        review.rating,
        review.text,
        review.relative_time_description,
        review.time,
      ]),
    ];
    downloadCsv('google-reviews.csv', rows);
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Testimonios de clientes</h1>
          <p className="text-white/60">
            Aprueba, edita y publica testimonios reales en la web
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatus(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                status === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={status === 'google' ? exportGoogleReviews : exportTestimonials}
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20"
          >
            Exportar CSV
          </button>
        </div>
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

      {status !== 'google' ? (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5">
          <div className="text-sm text-white/60">Pendientes</div>
          <div className="text-2xl font-bold text-orange-300">{stats?.pending ?? '-'}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="text-sm text-white/60">Publicados</div>
          <div className="text-2xl font-bold text-emerald-300">{stats?.approved ?? '-'}</div>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="text-sm text-white/60">Total</div>
          <div className="text-2xl font-bold text-blue-300">{stats?.total ?? '-'}</div>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
          <div className="text-sm text-white/60">Media</div>
          <div className="text-2xl font-bold text-purple-300">{stats?.avgRating ?? '-'}</div>
        </div>
        </div>
      ) : null}

      {status !== 'google' ? (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Añadir testimonio manual</h2>
          <button
            onClick={() => setCreating((prev) => !prev)}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white"
          >
            {creating ? 'Cerrar' : 'Crear'}
          </button>
        </div>
        {creating && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              value={createForm.customerName}
              onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
              placeholder="Nombre"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
            <input
              value={createForm.customerEmail}
              onChange={(e) => setCreateForm({ ...createForm, customerEmail: e.target.value })}
              placeholder="Email (opcional)"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
            <textarea
              value={createForm.text}
              onChange={(e) => setCreateForm({ ...createForm, text: e.target.value })}
              placeholder="Texto del testimonio"
              className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white md:col-span-2"
            />
            <select
              value={createForm.eventType}
              onChange={(e) => setCreateForm({ ...createForm, eventType: e.target.value })}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="date"
              value={createForm.eventDate}
              onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
            <input
              type="number"
              min={1}
              max={5}
              value={createForm.rating}
              onChange={(e) => setCreateForm({ ...createForm, rating: Number(e.target.value) })}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
            <input
              type="number"
              min={1}
              value={createForm.discountPercent}
              onChange={(e) => setCreateForm({ ...createForm, discountPercent: e.target.value })}
              placeholder="Descuento % (opcional)"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
            <div className="md:col-span-2">
              <button
                onClick={createManualTestimonial}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white"
              >
                Crear testimonio
              </button>
            </div>
          </div>
        )}
        </div>
      ) : null}

      {loading ? (
        <div className="text-white/60">Cargando testimonios...</div>
      ) : status === 'google' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="text-sm text-white/60">Rating promedio</div>
              <div className="text-2xl font-bold text-amber-300">
                {googleData?.rating?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
              <div className="text-sm text-white/60">Total reseñas</div>
              <div className="text-2xl font-bold text-blue-300">
                {googleData?.user_ratings_total || googleData?.reviews?.length || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <div className="text-sm text-white/60">5 estrellas</div>
              <div className="text-2xl font-bold text-emerald-300">
                {googleData?.reviews?.filter((r) => r.rating === 5).length || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
              <div className="text-sm text-white/60">Última sync</div>
              <div className="text-sm font-semibold text-purple-300">
                {googleData?.lastUpdated
                  ? new Date(googleData.lastUpdated).toLocaleString('es-ES')
                  : 'Nunca'}
              </div>
              <button
                onClick={syncGoogleReviews}
                disabled={syncingGoogle}
                className="mt-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-200"
              >
                {syncingGoogle ? 'Actualizando...' : 'Refrescar'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Reseñas de Google</h2>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={googleQuery}
                onChange={(e) => setGoogleQuery(e.target.value)}
                placeholder="Buscar por autor o texto"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white md:max-w-sm"
              />
              <select
                value={googleRatingFilter}
                onChange={(e) => setGoogleRatingFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas las estrellas</option>
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="2">2 estrellas</option>
                <option value="1">1 estrella</option>
              </select>
              <div className="text-xs text-white/60">
                {filteredGoogleReviews.length} resultados
              </div>
            </div>

            {filteredGoogleReviews.length ? (
              <div className="space-y-3">
                {filteredGoogleReviews.map((review, index) => (
                  <div key={`${review.author_name}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-white">{review.author_name}</div>
                        <div className="text-xs text-white/50">{review.relative_time_description}</div>
                      </div>
                      <div className="text-xs text-amber-300">⭐ {review.rating}/5</div>
                    </div>
                    <p className="mt-2 text-sm text-white/80">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/60">No hay reseñas todavía.</div>
            )}
          </div>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/60">
          No hay testimonios en este estado.
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-white/60">{t.customer.email}</div>
                  {t.customer.phone && (
                    <div className="text-sm text-white/60">{t.customer.phone}</div>
                  )}
                </div>
                <div className="text-right text-sm text-white/60">
                  <div>{new Date(t.createdAt).toLocaleDateString('es-ES')}</div>
                  <div>{t.eventType || 'Sin tipo'}</div>
                </div>
              </div>

              {editingId === t.id ? (
                <div className="space-y-3">
                  <textarea
                    value={(editForm.comment as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                    className="min-h-[120px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  />
                  <div className="grid gap-3 md:grid-cols-4">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={Number(editForm.rating || 5)}
                      onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    />
                    <select
                      value={String(editForm.eventType || 'OTHER')}
                      onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={(editForm.eventDate as string) || ''}
                      onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    />
                    <div className="flex items-center gap-3 text-sm text-white/70">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(editForm.showName)}
                          onChange={(e) => setEditForm({ ...editForm, showName: e.target.checked })}
                        />
                        Mostrar nombre
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(editForm.showPhoto)}
                          onChange={(e) => setEditForm({ ...editForm, showPhoto: e.target.checked })}
                        />
                        Mostrar foto
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white/80">{t.comment}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  ⭐ {t.rating}/5
                </span>
                {t.eventDate && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                    {new Date(t.eventDate).toLocaleDateString('es-ES')}
                  </span>
                )}
                {t.discount ? (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                    {t.discount.code} · {t.discount.discountPercent}%
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                      placeholder="% desc."
                      value={discountInputs[t.id] || ''}
                      onChange={(e) =>
                        setDiscountInputs((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => assignDiscount(t.id)}
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white"
                    >
                      Asignar
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {t.isApproved ? (
                  <button
                    onClick={() => runAction(t.id, { action: 'unpublish' })}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                  >
                    Despublicar
                  </button>
                ) : (
                  <button
                    onClick={() => runAction(t.id, { action: 'approve' }, 'Testimonio aprobado')}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
                  >
                    Aprobar
                  </button>
                )}

                {editingId === t.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(t.id)}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(t)}
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70"
                  >
                    Editar
                  </button>
                )}

                <button
                  onClick={() => deleteTestimonial(t.id)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
