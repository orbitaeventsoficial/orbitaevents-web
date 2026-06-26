'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_COLLABORATOR_EMPTY_FORM, COLLABORATOR_ROLE_OPTIONS } from '@/lib/constants/admin';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import CollaboratorProductsPanel, { type CollaboratorProduct } from './CollaboratorProductsPanel';

interface Collaborator {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  roles: string[];
  commissionPct: number;
  pricingModel: 'NET_PLUS_COMMISSION' | 'DISCOUNT';
  costPerHour: number | null;
  notes: string | null;
  isActive: boolean;
  bookings: CollaboratorBooking[];
  products: CollaboratorProduct[];
  _count?: {
    sourcedLeads?: number;
    sourcedBookings?: number;
  };
}

interface CollaboratorBooking {
  id: string;
  commissionPct: number;
  commissionAmount: number;
  collaboratorPrice: number | null;
  isPaid: boolean;
  booking: {
    id: string;
    reference: string;
    clientName: string;
    total: number;
    eventDate: string;
    status: string;
  };
}

interface KPIs {
  total: number;
  active: number;
  totalBookings: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  totalProducts: number;
  catalogValue: number;
  totalSourcedLeads: number;
  totalSourcedBookings: number;
}

const KPI_ITEMS = (kpis: KPIs) => [
  { label: 'Total', value: kpis.total, tone: '' },
  { label: 'Actius', value: kpis.active, tone: 'ap-kpi--success' },
  { label: 'Reserves', value: kpis.totalBookings, tone: 'ap-kpi--info' },
  { label: 'Bolos passats', value: kpis.totalSourcedLeads + kpis.totalSourcedBookings, tone: 'ap-kpi--success' },
  { label: 'Productes', value: kpis.totalProducts, tone: '' },
  { label: 'Valor catàleg', value: `${kpis.catalogValue}€`, tone: 'ap-kpi--info' },
  {
    label: 'Comissions pendents',
    value: `${kpis.pendingCommissions}€`,
    tone: kpis.pendingCommissions > 0 ? 'ap-kpi--warning' : 'ap-kpi--success',
  },
];

function getPricingBadge(pricingModel: Collaborator['pricingModel']) {
  return pricingModel === 'DISCOUNT'
    ? 'ap-badge ap-badge--success'
    : 'ap-badge ap-badge--info';
}

function getPaymentBadge(isPaid: boolean) {
  return isPaid ? 'ap-badge ap-badge--success' : 'ap-badge ap-badge--warning';
}

export default function CollaboratorsClient() {
  const toast = useToast();
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(ADMIN_COLLABORATOR_EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/admin/collaborators');
      if (!res.ok) throw new Error("No s'han pogut carregar els col·laboradors");
      const data = await res.json();
      setCollaborators(data.collaborators || []);
      setKpis(data.kpis || null);
    } catch (error) {
      console.error('Error carregant col·laboradors', error);
      const message = error instanceof Error ? error.message : "No s'han pogut carregar els col·laboradors";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nom és obligatori');
      return;
    }

    try {
      const url = editingId ? `/api/admin/collaborators/${editingId}` : '/api/admin/collaborators';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetchWithCsrf(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? 'Col·laborador actualitzat' : 'Col·laborador creat');
      setShowForm(false);
      setEditingId(null);
      setForm(ADMIN_COLLABORATOR_EMPTY_FORM);
      load();
    } catch (err) {
      console.error('Error desant col·laborador', err);
      toast.error('Error desant');
    }
  };

  const handleEdit = (c: Collaborator) => {
    setForm({
      name: c.name,
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      specialty: c.specialty || '',
      roles: c.roles || [],
      commissionPct: c.commissionPct,
      pricingModel: c.pricingModel,
      costPerHour: c.costPerHour ?? '',
      notes: c.notes || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({ title: 'Eliminar col·laborador', message: 'Segur que vols eliminar aquest col·laborador?', variant: 'danger', confirmLabel: 'Eliminar' });
    if (!ok) return;
    try {
      const response = await fetchWithCsrf(`/api/admin/collaborators/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("No s'ha pogut eliminar el col·laborador");
      toast.success('Col·laborador eliminat');
      await load();
    } catch (error) {
      console.error('Error eliminant col·laborador', error);
      toast.error(error instanceof Error ? error.message : "No s'ha pogut eliminar el col·laborador");
    }
  };

  const handleToggleActive = async (c: Collaborator) => {
    try {
      const response = await fetchWithCsrf(`/api/admin/collaborators/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (!response.ok) throw new Error("No s'ha pogut actualitzar l'estat del col·laborador");
      toast.success(c.isActive ? 'Desactivat' : 'Activat');
      await load();
    } catch (error) {
      console.error("Error actualitzant estat col·laborador", error);
      toast.error(error instanceof Error ? error.message : "No s'ha pogut actualitzar l'estat del col·laborador");
    }
  };

  const toggleRole = (role: string) => {
    setForm((prev) => {
      const current = new Set(prev.roles || []);
      if (current.has(role)) current.delete(role);
      else current.add(role);
      return { ...prev, roles: Array.from(current) };
    });
  };

  if (loading) {
    return <div className="py-8 text-center admin-tone-text-neutral">Carregant...</div>;
  }


  return (
    <div className="space-y-6">
      {loadError && (
        <div className="ap-inline-alert ap-inline-alert--danger">
          {loadError}
        </div>
      )}
      {kpis && (
        <div className="ap-kpi-row lg:grid-cols-6">
          {KPI_ITEMS(kpis).map((kpi) => (
            <div key={kpi.label} className={`ap-kpi ${kpi.tone}`}>
              <div className="ap-kpi-label">{kpi.label}</div>
              <div className="ap-kpi-value">{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(ADMIN_COLLABORATOR_EMPTY_FORM);
          }}
          className="ap-btn ap-btn--primary"
        >
          {showForm ? 'Cancel·lar' : '+ Nou partner'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="ap-card space-y-4 rounded-xl p-6">
          <h3 className="ap-h2">{editingId ? 'Editar partner' : 'Nou partner'}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="collab-name" className="mb-1 block text-sm admin-tone-text-neutral">Nom *</label>
              <input
                id="collab-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="adm-input"
                required
              />
            </div>
            <div>
              <label htmlFor="collab-company" className="mb-1 block text-sm admin-tone-text-neutral">Empresa</label>
              <input
                id="collab-company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="adm-input"
              />
            </div>
            <div>
              <label htmlFor="collab-email" className="mb-1 block text-sm admin-tone-text-neutral">Email</label>
              <input
                id="collab-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="adm-input"
              />
            </div>
            <div>
              <label htmlFor="collab-phone" className="mb-1 block text-sm admin-tone-text-neutral">Telèfon</label>
              <input
                id="collab-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="adm-input"
              />
            </div>
            <div>
              <label htmlFor="collab-specialty" className="mb-1 block text-sm admin-tone-text-neutral">Especialitat</label>
              <input
                id="collab-specialty"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="DJ, Presentador, Tècnic de so..."
                className="adm-input"
              />
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 block text-sm admin-tone-text-neutral">Rols del partner</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {COLLABORATOR_ROLE_OPTIONS.map((role) => (
                  <label key={role.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={(form.roles || []).includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="collab-cost-hour" className="mb-1 block text-sm admin-tone-text-neutral">Cost/hora (€)</label>
              <input
                id="collab-cost-hour"
                type="number"
                min={0}
                step={0.01}
                value={form.costPerHour}
                onChange={(e) => setForm({ ...form, costPerHour: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Ex: 133.33"
                className="adm-input"
              />
              {form.costPerHour !== '' && Number(form.costPerHour) > 0 && (
                <p className="mt-1 text-xs text-white/40">
                  1,5h → {Math.round(Number(form.costPerHour) * 1.5)}€ · 2h → {Math.round(Number(form.costPerHour) * 2)}€ · 3h → {Math.round(Number(form.costPerHour) * 3)}€
                </p>
              )}
            </div>
            <div>
              <label htmlFor="collab-commission" className="mb-1 block text-sm admin-tone-text-neutral">Comissió % (si és revenedor)</label>
              <input
                id="collab-commission"
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={form.commissionPct}
                onChange={(e) => setForm({ ...form, commissionPct: Number(e.target.value) })}
                className="adm-input"
              />
            </div>
            <div>
              <label htmlFor="collab-model" className="mb-1 block text-sm admin-tone-text-neutral">Model de preus</label>
              <select
                id="collab-model"
                value={form.pricingModel}
                onChange={(e) => setForm({ ...form, pricingModel: e.target.value as 'NET_PLUS_COMMISSION' | 'DISCOUNT' })}
                className="adm-input"
              >
                <option value="DISCOUNT">Descompte (li fem X% menys)</option>
                <option value="NET_PLUS_COMMISSION">Preu net (ell afegeix comissió)</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="collab-notes" className="mb-1 block text-sm admin-tone-text-neutral">Notes</label>
            <textarea
              id="collab-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="adm-input adm-input--textarea"
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <p className="flex-1 text-xs admin-tone-text-slate">
              {form.pricingModel === 'DISCOUNT'
                ? `El col·laborador rep el teu PVP amb un ${form.commissionPct}% menys. Ell s'emporta el ${form.commissionPct}%.`
                : `Li dones el teu preu net. Ell hi afegeix la seva comissió (${form.commissionPct}% recomanat).`}
            </p>
            <button type="submit" className="ap-btn ap-btn--primary">
              {editingId ? 'Desar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {collaborators.length === 0 ? (
        <div className="ap-card ap-empty rounded-xl">
          <p className="ap-empty-title">Encara no tens col·laboradors</p>
          <p className="ap-empty-desc">Afegeix col·laboradors que revenen els teus serveis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className={`ap-card rounded-xl p-5 transition-colors ${
                c.isActive ? 'hover:admin-tone-bg-neutral' : 'opacity-60 admin-tone-idle'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="ap-h2">{c.name}</h3>
                    {c.company && <span className="text-sm admin-tone-text-neutral">{c.company}</span>}
                    <span className={getPricingBadge(c.pricingModel)}>
                      {c.pricingModel === 'DISCOUNT' ? `${c.commissionPct}% descompte` : `Net + ${c.commissionPct}%`}
                    </span>
                    {!c.isActive && <span className="ap-badge">Inactiu</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm admin-tone-text-neutral">
                    {c.specialty && <span className="font-medium text-[color:var(--ax-gold)]">{c.specialty}</span>}
                    {(c.roles || []).map((role) => (
                      <span key={role} className="ap-badge">{COLLABORATOR_ROLE_OPTIONS.find((option) => option.value === role)?.label || role}</span>
                    ))}
                    {c.costPerHour != null && <span className="text-white/60">{c.costPerHour}€/h</span>}
                    {((c._count?.sourcedLeads || 0) + (c._count?.sourcedBookings || 0)) > 0 && (
                      <span className="text-[color:var(--ax-success)]">
                        {(c._count?.sourcedLeads || 0) + (c._count?.sourcedBookings || 0)} bolos passats
                      </span>
                    )}
                    {c.email && <span>{c.email}</span>}
                    {c.phone && <span>{c.phone}</span>}
                    <span>{c.bookings.length} reserves</span>
                    {c.bookings.length > 0 && (
                      <span className="font-medium">{Math.round(c.bookings.reduce((s, b) => s + b.commissionAmount, 0))}€ comissions</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/collaborators/${c.id}`} className="ap-btn ap-btn--primary">
                    Obrir fitxa
                  </Link>
                  <button onClick={() => handleToggleActive(c)} className="ap-btn ap-btn--secondary">
                    {c.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleEdit(c)} className="ap-btn ap-btn--secondary">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="ap-btn ap-btn--danger">
                    Eliminar
                  </button>
                </div>
              </div>

              {c.bookings.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="ap-table-wrap rounded-xl border-0">
                    <table className="ap-table w-full text-sm" aria-label={`Reserves de ${c.name}`}>
                      <thead className="ap-table-head">
                        <tr>
                          <th scope="col" className="ap-table-th">Referència</th>
                          <th scope="col" className="ap-table-th">Client</th>
                          <th scope="col" className="ap-table-th text-right">Total</th>
                          <th scope="col" className="ap-table-th text-right">Comissió</th>
                          <th scope="col" className="ap-table-th text-right">Estat</th>
                        </tr>
                      </thead>
                      <tbody className="ap-table-body">
                        {c.bookings.slice(0, 5).map((cb) => (
                          <tr key={cb.id}>
                            <td className="py-1.5">{cb.booking.reference}</td>
                            <td>{cb.booking.clientName}</td>
                            <td className="text-right">{cb.booking.total}€</td>
                            <td className="text-right">{cb.commissionAmount}€</td>
                            <td className="text-right">
                              <span className={getPaymentBadge(cb.isPaid)}>{cb.isPaid ? 'Pagat' : 'Pendent'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <CollaboratorProductsPanel
                collaboratorId={c.id}
                products={c.products || []}
                onChanged={load}
              />
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
