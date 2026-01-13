// app/admin/ressenyes/page.tsx
'use client';

import { useEffect, useState } from 'react';

type DiscountInfo = {
  code: string;
  discountPercent: number;
  validUntil: string;
  isActive: boolean;
};

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
] as const;

export default function CustomerTestimonialsAdminPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['id']>('pending');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
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
    loadTestimonials();
  }, [status]);

  async function loadTestimonials() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/customer-testimonials?status=${status}&stats=true`
      );
      const data = await response.json();
      setTestimonials(data.data || []);
      setStats(data.stats || null);
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
  ) {
    const res = await fetch('/api/admin/customer-testimonials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Error actualizando testimonio');
    }
    if (successMessage) alert(successMessage);
    await loadTestimonials();
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
    await runAction(
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
    setEditingId(null);
  }

  async function deleteTestimonial(id: string) {
    if (!confirm('¿Eliminar este testimonio? Esta acción no se puede deshacer.')) return;
    const res = await fetch(`/api/admin/customer-testimonials?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || 'Error eliminando testimonio');
      return;
    }
    await loadTestimonials();
  }

  async function assignDiscount(id: string) {
    const value = discountInputs[id];
    const percent = Number(value);
    if (!percent || percent <= 0) {
      alert('Introduce un porcentaje válido');
      return;
    }
    await runAction(id, { action: 'discount', discountPercent: percent }, 'Descuento asignado');
    setDiscountInputs((prev) => ({ ...prev, [id]: '' }));
  }

  async function createManualTestimonial() {
    if (!createForm.customerName || !createForm.text) {
      alert('Nombre y texto son obligatorios');
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
      alert(data?.error || 'Error creando testimonio');
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
    await loadTestimonials();
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
        <div className="flex gap-2">
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
        </div>
      </div>

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

      {loading ? (
        <div className="text-white/60">Cargando testimonios...</div>
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
