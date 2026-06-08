'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { formatCurrency, formatDate } from '@/lib/constants';
import { COLLABORATOR_ROLE_OPTIONS, COLLABORATOR_MEMBER_ROLE_OPTIONS, getCollaboratorMemberRoleLabel } from '@/lib/constants/admin';

interface SourcedLead {
  id: string;
  name: string;
  eventType: string | null;
  status: string;
  budget: string | null;
  eventDate: string | null;
}

interface SourcedBooking {
  id: string;
  reference: string;
  clientName: string;
  status: string;
  total: number;
  eventDate: string | null;
}

interface ContractedBooking {
  id: string;
  commissionAmount: number;
  collaboratorPrice: number | null;
  isPaid: boolean;
  reference: string;
  clientName: string;
  status: string;
  total: number;
  eventDate: string | null;
}

interface PartnerProduct {
  id: string;
  name: string;
  category: string | null;
  costPrice: number;
  sellPrice: number;
  isActive: boolean;
}

interface PartnerMember {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

interface PartnerHubData {
  members: PartnerMember[];
  partner: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    roles: string[];
    commissionPct: number;
    pricingModel: string;
    costPerHour: number | null;
    notes: string | null;
    isActive: boolean;
  };
  economics: {
    sourcedLeadsCount: number;
    sourcedBookingsCount: number;
    sourcedRevenue: number;
    contractedCount: number;
    contractedRevenue: number;
    totalCommissions: number;
    pendingCommissions: number;
    productsCount: number;
    catalogValue: number;
    catalogCost: number;
    serviceLinesPaid: number;
    serviceLinesCount: number;
    totalPaidToPartner: number;
  };
  sourcedLeads: SourcedLead[];
  sourcedBookings: SourcedBooking[];
  contractedBookings: ContractedBooking[];
  products: PartnerProduct[];
}

type TabKey = 'resum' | 'membres' | 'passa' | 'contractem' | 'cataleg' | 'economia' | 'notes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'resum', label: 'Resum' },
  { key: 'membres', label: 'Equip / membres' },
  { key: 'passa', label: 'Bolos que ens passa' },
  { key: 'contractem', label: 'Bolos on el contractem' },
  { key: 'cataleg', label: 'Material i catàleg' },
  { key: 'economia', label: 'Economia' },
  { key: 'notes', label: 'Notes i contacte' },
];

function roleLabel(role: string) {
  return COLLABORATOR_ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

function Empty({ text }: { text: string }) {
  return <p className="ap-muted text-sm py-4">{text}</p>;
}

export default function PartnerHubClient({ data }: { data: PartnerHubData }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>('resum');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('OTHER');
  const [adding, setAdding] = useState(false);
  const { partner, economics } = data;

  async function addMember() {
    if (!newName.trim()) { toast.error('El nom és obligatori'); return; }
    setAdding(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/collaborators/${partner.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), role: newRole }),
      });
      if (!res.ok) throw new Error('No s\'ha pogut afegir');
      setNewName(''); setNewRole('OTHER');
      toast.success('Membre afegit.');
      router.refresh();
    } catch (e) {
      console.error('[PartnerHub] addMember', e);
      toast.error('Error afegint el membre.');
    } finally {
      setAdding(false);
    }
  }

  async function removeMember(memberId: string) {
    try {
      const res = await fetchWithCsrf(`/api/admin/collaborators/${partner.id}/members/${memberId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No s\'ha pogut eliminar');
      toast.success('Membre eliminat.');
      router.refresh();
    } catch (e) {
      console.error('[PartnerHub] removeMember', e);
      toast.error('Error eliminant el membre.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Navegació de pestanyes */}
      <nav className="flex flex-wrap gap-2" aria-label="Seccions del partner">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-pressed={tab === item.key}
            className={`ap-btn px-3 py-2 text-sm ${tab === item.key ? 'ap-btn--primary' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'resum' && (
        <div className="flex flex-col gap-4">
          <div className="ap-kpi-row">
            <div className="ap-kpi"><span className="ap-kpi__label">Bolos que ens passa</span><span className="ap-kpi__value">{economics.sourcedLeadsCount + economics.sourcedBookingsCount}</span></div>
            <div className="ap-kpi ap-kpi--info"><span className="ap-kpi__label">On el contractem</span><span className="ap-kpi__value">{economics.contractedCount}</span></div>
            <div className="ap-kpi"><span className="ap-kpi__label">Productes</span><span className="ap-kpi__value">{economics.productsCount}</span></div>
            <div className={`ap-kpi ${economics.pendingCommissions > 0 ? 'ap-kpi--warning' : 'ap-kpi--success'}`}><span className="ap-kpi__label">Comissions pendents</span><span className="ap-kpi__value">{formatCurrency(economics.pendingCommissions)}</span></div>
          </div>
          <section className="ap-card p-5">
            <h2 className="text-lg font-semibold mb-3">Identitat</h2>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="ap-muted">Empresa</span><div>{partner.company || '—'}</div></div>
              <div><span className="ap-muted">Especialitat</span><div>{partner.specialty || '—'}</div></div>
              <div><span className="ap-muted">Estat</span><div>{partner.isActive ? 'Actiu' : 'Inactiu'}</div></div>
              <div><span className="ap-muted">Comissió</span><div>{partner.commissionPct}%</div></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {partner.roles.length > 0
                ? partner.roles.map((role) => <span key={role} className="ap-badge ap-badge--info">{roleLabel(role)}</span>)
                : <Empty text="Sense rols assignats." />}
            </div>
          </section>
        </div>
      )}

      {tab === 'membres' && (
        <section className="ap-card p-5">
          <h2 className="text-lg font-semibold mb-1">Equip / membres</h2>
          <p className="ap-muted text-sm mb-4">Persones dins d&apos;aquest proveïdor (p. ex. el cap, mags, animadors…).</p>

          <div className="flex flex-wrap items-end gap-2 mb-4">
            <input
              className="ap-input" placeholder="Nom de la persona"
              value={newName} onChange={(e) => setNewName(e.target.value)}
              aria-label="Nom del membre"
            />
            <select className="ap-input" value={newRole} onChange={(e) => setNewRole(e.target.value)} aria-label="Rol del membre">
              {COLLABORATOR_MEMBER_ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button type="button" className="ap-btn ap-btn--primary" onClick={addMember} disabled={adding}>
              {adding ? 'Afegint…' : '+ Afegir membre'}
            </button>
          </div>

          {data.members.length === 0 ? <Empty text="Encara no hi ha membres. Afegeix el cap i l'equip." /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left ap-muted"><th scope="col" className="py-2">Nom</th><th scope="col">Rol</th><th scope="col">Contacte</th><th scope="col">Estat</th><th scope="col"></th></tr></thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2">{m.name}</td>
                    <td><span className="ap-badge ap-badge--info">{getCollaboratorMemberRoleLabel(m.role)}</span></td>
                    <td>{m.phone || m.email || '—'}</td>
                    <td><span className={`ap-badge ${m.isActive ? 'ap-badge--success' : ''}`}>{m.isActive ? 'Actiu' : 'Inactiu'}</span></td>
                    <td className="text-right"><button type="button" className="ap-link" onClick={() => removeMember(m.id)} aria-label={`Eliminar ${m.name}`}>Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'passa' && (
        <section className="ap-card p-5">
          <h2 className="text-lg font-semibold mb-3">Bolos que ens passa</h2>
          <p className="ap-muted text-sm mb-4">Leads i reserves on aquest partner és l&apos;origen del bolo (<code>sourceCollaboratorId</code>).</p>
          <h3 className="text-sm font-semibold mb-2">Leads ({data.sourcedLeads.length})</h3>
          {data.sourcedLeads.length === 0 ? <Empty text="Cap lead passat per aquest partner." /> : (
            <table className="w-full text-sm mb-5">
              <thead><tr className="text-left ap-muted"><th scope="col" className="py-2">Nom</th><th scope="col">Tipus</th><th scope="col">Data</th><th scope="col">Estat</th></tr></thead>
              <tbody>
                {data.sourcedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="py-2"><Link href={buildLeadWorkspaceHref(lead.id)} className="ap-link">{lead.name}</Link></td>
                    <td>{lead.eventType || '—'}</td>
                    <td>{lead.eventDate ? formatDate(lead.eventDate) : '—'}</td>
                    <td><span className="ap-badge">{lead.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h3 className="text-sm font-semibold mb-2">Reserves ({data.sourcedBookings.length})</h3>
          {data.sourcedBookings.length === 0 ? <Empty text="Cap reserva passada per aquest partner." /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left ap-muted"><th scope="col" className="py-2">Ref</th><th scope="col">Client</th><th scope="col">Data</th><th scope="col">Total</th></tr></thead>
              <tbody>
                {data.sourcedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-2"><Link href={buildBookingHref(booking.id)} className="ap-link">{booking.reference}</Link></td>
                    <td>{booking.clientName}</td>
                    <td>{booking.eventDate ? formatDate(booking.eventDate) : '—'}</td>
                    <td>{formatCurrency(booking.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'contractem' && (
        <section className="ap-card p-5">
          <h2 className="text-lg font-semibold mb-3">Bolos on el contractem</h2>
          <p className="ap-muted text-sm mb-4">Reserves on Òrbita contracta aquest partner (<code>CollaboratorBooking</code>) — cost i comissió.</p>
          {data.contractedBookings.length === 0 ? <Empty text="Encara no l&apos;hem contractat en cap reserva." /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left ap-muted"><th scope="col" className="py-2">Ref</th><th scope="col">Client</th><th scope="col">Data</th><th scope="col">Comissió</th><th scope="col">Pagat</th></tr></thead>
              <tbody>
                {data.contractedBookings.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">{item.reference}</td>
                    <td>{item.clientName}</td>
                    <td>{item.eventDate ? formatDate(item.eventDate) : '—'}</td>
                    <td>{formatCurrency(item.commissionAmount)}</td>
                    <td><span className={`ap-badge ${item.isPaid ? 'ap-badge--success' : 'ap-badge--warning'}`}>{item.isPaid ? 'Pagat' : 'Pendent'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'cataleg' && (
        <section className="ap-card p-5">
          <h2 className="text-lg font-semibold mb-3">Material i catàleg</h2>
          {data.products.length === 0 ? <Empty text="Aquest partner no té productes al catàleg." /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left ap-muted"><th scope="col" className="py-2">Producte</th><th scope="col">Categoria</th><th scope="col">Cost</th><th scope="col">PVP</th><th scope="col">Estat</th></tr></thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product.id}>
                    <td className="py-2">{product.name}</td>
                    <td>{product.category || '—'}</td>
                    <td>{formatCurrency(product.costPrice)}</td>
                    <td>{formatCurrency(product.sellPrice)}</td>
                    <td><span className={`ap-badge ${product.isActive ? 'ap-badge--success' : ''}`}>{product.isActive ? 'Actiu' : 'Inactiu'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'economia' && (
        <section className="ap-card p-5">
          <h2 className="text-lg font-semibold mb-3">Economia</h2>
          <div className="ap-kpi-row mb-4">
            <div className="ap-kpi ap-kpi--success"><span className="ap-kpi__label">Quant li paguem (total)</span><span className="ap-kpi__value">{formatCurrency(economics.totalPaidToPartner)}</span></div>
            <div className="ap-kpi"><span className="ap-kpi__label">Ingrés que ens genera</span><span className="ap-kpi__value">{formatCurrency(economics.sourcedRevenue)}</span></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div><span className="ap-muted">Ingrés generat (bolos que ens passa)</span><div className="text-lg font-semibold">{formatCurrency(economics.sourcedRevenue)}</div></div>
            <div><span className="ap-muted">Volum on el contractem</span><div className="text-lg font-semibold">{formatCurrency(economics.contractedRevenue)}</div></div>
            <div><span className="ap-muted">Comissions que li paguem</span><div className="text-lg font-semibold">{formatCurrency(economics.totalCommissions)}</div></div>
            <div><span className="ap-muted">Comissions pendents de pagar</span><div className="text-lg font-semibold">{formatCurrency(economics.pendingCommissions)}</div></div>
            <div><span className="ap-muted">Pagat en serveis subcontractats ({economics.serviceLinesCount})</span><div className="text-lg font-semibold">{formatCurrency(economics.serviceLinesPaid)}</div></div>
            <div><span className="ap-muted">Valor del catàleg (PVP)</span><div className="text-lg font-semibold">{formatCurrency(economics.catalogValue)}</div></div>
          </div>
        </section>
      )}

      {tab === 'notes' && (
        <section className="ap-card p-5">
          <h2 className="text-lg font-semibold mb-3">Notes i contacte</h2>
          <div className="grid gap-3 md:grid-cols-2 text-sm mb-4">
            <div><span className="ap-muted">Email</span><div>{partner.email ? <Link href={`/admin/inbox/compose?to=${encodeURIComponent(partner.email)}`} className="ap-link">{partner.email}</Link> : '—'}</div></div>
            <div><span className="ap-muted">Telèfon</span><div>{partner.phone ? <a href={`tel:${partner.phone}`} className="ap-link">{partner.phone}</a> : '—'}</div></div>
          </div>
          <div><span className="ap-muted">Notes</span><p className="mt-1 whitespace-pre-wrap">{partner.notes || '—'}</p></div>
        </section>
      )}
    </div>
  );
}
