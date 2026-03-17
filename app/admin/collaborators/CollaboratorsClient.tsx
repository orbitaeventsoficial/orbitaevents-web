'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '../components/ToastProvider';

interface Collaborator {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  commissionPct: number;
  pricingModel: 'NET_PLUS_COMMISSION' | 'DISCOUNT';
  notes: string | null;
  isActive: boolean;
  bookings: CollaboratorBooking[];
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
}

const EMPTY_FORM = {
  name: '',
  company: '',
  email: '',
  phone: '',
  commissionPct: 10,
  pricingModel: 'DISCOUNT' as 'NET_PLUS_COMMISSION' | 'DISCOUNT',
  notes: '',
};

export default function CollaboratorsClient() {
  const toast = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/collaborators');
      const data = await res.json();
      setCollaborators(data.collaborators || []);
      setKpis(data.kpis || null);
    } catch {
      toast.error('Error carregant col·laboradors');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nom és obligatori'); return; }

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
      setForm(EMPTY_FORM);
      load();
    } catch {
      toast.error('Error desant');
    }
  };

  const handleEdit = (c: Collaborator) => {
    setForm({
      name: c.name,
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      commissionPct: c.commissionPct,
      pricingModel: c.pricingModel,
      notes: c.notes || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Segur que vols eliminar aquest col·laborador?')) return;
    try {
      await fetchWithCsrf(`/api/admin/collaborators/${id}`, { method: 'DELETE' });
      toast.success('Col·laborador eliminat');
      load();
    } catch {
      toast.error('Error eliminant');
    }
  };

  const handleToggleActive = async (c: Collaborator) => {
    try {
      await fetchWithCsrf(`/api/admin/collaborators/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      toast.success(c.isActive ? 'Desactivat' : 'Activat');
      load();
    } catch {
      toast.error('Error');
    }
  };

  if (loading) {
    return <div className="text-white/50 py-8 text-center">Carregant...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: kpis.total },
            { label: 'Actius', value: kpis.active },
            { label: 'Reserves', value: kpis.totalBookings },
            { label: 'Facturat via collab', value: `${kpis.totalRevenue}€` },
            { label: 'Comissions totals', value: `${kpis.totalCommissions}€` },
            { label: 'Comissions pendents', value: `${kpis.pendingCommissions}€`, highlight: kpis.pendingCommissions > 0 },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-xl border p-4 ${
                kpi.highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="text-xs text-white/50 mb-1">{kpi.label}</div>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Accions */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
          className="px-5 py-2.5 rounded-xl text-black font-bold transition-colors"
        >
          {showForm ? 'Cancel·lar' : '+ Nou col·laborador'}
        </button>
      </div>

      {/* Formulari */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Editar col·laborador' : 'Nou col·laborador'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="collab-name" className="block text-sm text-white/70 mb-1">Nom *</label>
              <input id="collab-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white " required />
            </div>
            <div>
              <label htmlFor="collab-company" className="block text-sm text-white/70 mb-1">Empresa</label>
              <input id="collab-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white " />
            </div>
            <div>
              <label htmlFor="collab-email" className="block text-sm text-white/70 mb-1">Email</label>
              <input id="collab-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white " />
            </div>
            <div>
              <label htmlFor="collab-phone" className="block text-sm text-white/70 mb-1">Telèfon</label>
              <input id="collab-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white " />
            </div>
            <div>
              <label htmlFor="collab-commission" className="block text-sm text-white/70 mb-1">Comissió %</label>
              <input id="collab-commission" type="number" min={0} max={50} step={0.5} value={form.commissionPct}
                onChange={(e) => setForm({ ...form, commissionPct: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white " />
            </div>
            <div>
              <label htmlFor="collab-model" className="block text-sm text-white/70 mb-1">Model de preus</label>
              <select id="collab-model" value={form.pricingModel}
                onChange={(e) => setForm({ ...form, pricingModel: e.target.value as 'NET_PLUS_COMMISSION' | 'DISCOUNT' })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white "
              >
                <option value="DISCOUNT">Descompte (li fem X% menys)</option>
                <option value="NET_PLUS_COMMISSION">Preu net (ell afegeix comissió)</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="collab-notes" className="block text-sm text-white/70 mb-1">Notes</label>
            <textarea id="collab-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white " />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <p className="text-xs text-white/40 flex-1">
              {form.pricingModel === 'DISCOUNT'
                ? `El col·laborador rep el teu PVP amb un ${form.commissionPct}% menys. Ell s'emporta el ${form.commissionPct}%.`
                : `Li dones el teu preu net. Ell hi afegeix la seva comissió (${form.commissionPct}% recomanat).`}
            </p>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-black font-bold transition-colors">
              {editingId ? 'Desar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Llistat */}
      {collaborators.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <p className="text-xl mb-2">Encara no tens col·laboradors</p>
          <p className="text-sm">Afegeix col·laboradors que revenen els teus serveis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborators.map((c) => (
            <div key={c.id} className={`rounded-xl border p-5 transition-colors ${
              c.isActive ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-white/5 bg-white/[0.01] opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">{c.name}</h3>
                    {c.company && <span className="text-sm text-white/50">{c.company}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.pricingModel === 'DISCOUNT'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {c.pricingModel === 'DISCOUNT' ? `${c.commissionPct}% descompte` : `Net + ${c.commissionPct}%`}
                    </span>
                    {!c.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full border">Inactiu</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    {c.email && <span>{c.email}</span>}
                    {c.phone && <span>{c.phone}</span>}
                    <span>{c.bookings.length} reserves</span>
                    {c.bookings.length > 0 && (
                      <span className="font-medium">
                        {Math.round(c.bookings.reduce((s, b) => s + b.commissionAmount, 0))}€ comissions
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(c)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors">
                    {c.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleEdit(c)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs border transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Reserves del col·laborador */}
              {c.bookings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <table className="w-full text-sm" aria-label={`Reserves de ${c.name}`}>
                    <thead>
                      <tr className="text-white/40 text-xs">
                        <th scope="col" className="text-left pb-2">Referència</th>
                        <th scope="col" className="text-left pb-2">Client</th>
                        <th scope="col" className="text-right pb-2">Total</th>
                        <th scope="col" className="text-right pb-2">Comissió</th>
                        <th scope="col" className="text-right pb-2">Estat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.bookings.slice(0, 5).map((cb) => (
                        <tr key={cb.id} className="text-white/70 hover:bg-white/[0.03] transition-colors">
                          <td className="py-1.5">{cb.booking.reference}</td>
                          <td>{cb.booking.clientName}</td>
                          <td className="text-right">{cb.booking.total}€</td>
                          <td className="text-right">{cb.commissionAmount}€</td>
                          <td className="text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              cb.isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {cb.isPaid ? 'Pagat' : 'Pendent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


