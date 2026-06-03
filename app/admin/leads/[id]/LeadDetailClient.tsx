'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildLeadComposeHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import LeadNotesPanel from './LeadNotesPanel';
import BookingTotalEditor from '../../bookings/[id]/BookingTotalEditor';

function buildLeadWhatsAppHref(phone: string, name: string): string {
  const msg = `Hola ${name}! Et contactem des d'Òrbita Events per la teva sol·licitud.`;
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(msg)}`;
}
import { patchLeadStatus } from '../leadStatusClient';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { SOURCE_LABELS, formatCurrency, formatDateFull } from '@/lib/constants';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';
import { SERVICE_HOURLY_RATES, resolveServicePricingKey } from '@/lib/constants/pricing-intelligence';

type Stage = 'nou' | 'contactat' | 'guanyat' | 'perdut';
type PayState = 'none' | 'part' | 'full' | null;

const STAGE_LABEL: Record<Stage, string> = {
  nou: 'Nou', contactat: 'Contactat', guanyat: 'Guanyat', perdut: 'Perdut',
};
const PIPELINE_STAGES: Stage[] = ['nou', 'contactat', 'guanyat', 'perdut'];
const PAY_LABEL: Record<string, string> = {
  none: 'Pendent', part: 'Senyal pagat', full: 'Pagat',
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Mitjana', HIGH: 'Alta', URGENT: 'Urgent',
};

function fullDate(iso: string) {
  return formatDateFull(iso);
}

function durationLabel(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return '—';
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;
  const total = endMin - startMin;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function sourceLabel(source: string | null): string {
  if (!source) return '—';
  return SOURCE_LABELS[source] ?? source;
}

export type LeadDetailData = {
  id: string;
  name: string;
  stage: Stage;
  type: string;
  dateISO: string | null;
  time: string | null;
  endTime: string | null;
  location: string | null;
  value: number | null;
  pax: number | null;
  priority: string;
  phone: string | null;
  email: string | null;
  channel: string | null;
  owner: string | null;
  last: string | null;
  product: string | null;
  lostReason: string | null;
  wx: WxData | null;
  eventPhone: string | null;
  eventAddress: string | null;
  booking: {
    id: string;
    reference: string;
    depositPaid: boolean;
    remainingPaid: boolean;
    depositAmount: number;
    remainingAmount: number;
    paymentMethod: string;
    invoiceRequired: boolean;
    cashAmount: number | null;
    total: number;
    totalHours: number;
    collaboratorCost: { amount: number; name: string } | null;
    costFloor: number | null;
  } | null;
};

function paymentState(booking: LeadDetailData['booking']): PayState {
  if (!booking) return null;
  if (booking.depositPaid && booking.remainingPaid) return 'full';
  if (booking.depositPaid) return 'part';
  return 'none';
}

function leadSummary(lead: LeadDetailData): string {
  if (lead.stage === 'perdut') return 'Lead perdut. Considera reengagement si el motiu era timing.';
  if (lead.stage === 'guanyat' && lead.booking) return 'Reserva activa. Gestiona cobraments i preparació.';
  if (lead.stage === 'guanyat') return 'Crear reserva, contracte i pagament inicial.';
  if (lead.stage === 'contactat') return 'Enviar pressupost i fer seguiment en 48h.';
  return 'Contactar el client avui.';
}

function nextStageFor(stage: Stage): Stage | null {
  if (stage === 'nou') return 'contactat';
  if (stage === 'contactat') return 'guanyat';
  return null;
}

type EditableField = 'phone' | 'email' | 'eventPhone' | 'eventAddress' | 'eventDate' | 'eventStartTime' | 'eventEndTime' | 'eventLocation' | 'guestCount' | 'budget';

type NoteItem = { id: string; content: string; createdBy: string | null; createdAt: string };
type ProposalItem = { id: string; reference: string; status: string; createdAt: string };
type DossierItem = { id: string; nom: string; estat: string; createdAt: string };

export default function LeadDetailClient({ lead, notes, proposals, dossiers }: {
  lead: LeadDetailData;
  notes: NoteItem[];
  proposals: ProposalItem[];
  dossiers: DossierItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [stage, setStage] = useState<Stage>(lead.stage);
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [payPending, setPayPending] = useState(false);
  const [collaborators, setCollaborators] = useState<{ id: string; name: string }[]>([]);
  const [editField, setEditField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savePending, setSavePending] = useState(false);

  const [fields, setFields] = useState({
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    eventPhone: lead.eventPhone ?? '',
    eventAddress: lead.eventAddress ?? '',
    eventDate: lead.dateISO ? lead.dateISO.slice(0, 10) : '',
    eventStartTime: lead.time ?? '',
    eventEndTime: lead.endTime ?? '',
    eventLocation: lead.location ?? '',
    guestCount: lead.pax ? String(lead.pax) : '',
    budget: lead.value ? String(lead.value) : '',
  });

  useEffect(() => {
    fetch('/api/admin/collaborators')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCollaborators(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        else if (Array.isArray(data?.collaborators)) setCollaborators(data.collaborators.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      })
      .catch((error) => {
        console.error('[LeadDetailClient] Error loading collaborators', error);
      });
  }, []);

  async function saveAssignedTo(name: string) {
    try {
      await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: name || null }),
      });
      setFields((f) => ({ ...f }));
      toast.success('Assignat desat.');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('[LeadDetailClient] Error saving assignee', error);
      toast.error('Error desant l\'assignació.');
    }
  }

  function startEdit(field: EditableField) {
    setEditField(field);
    setEditValue(fields[field]);
  }

  async function saveEdit() {
    if (!editField || savePending) return;
    setSavePending(true);
    try {
      const value = editField === 'guestCount'
        ? (editValue ? parseInt(editValue, 10) : null)
        : editValue || null;
      await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editField]: value }),
      });
      setFields((f) => ({ ...f, [editField!]: editValue }));
      toast.success('Desat.');
      setEditField(null);
    } catch (error) {
      console.error('[LeadDetailClient] Error saving field', error);
      toast.error('Error desant el camp.');
    } finally {
      setSavePending(false);
    }
  }

  function cancelEdit() {
    setEditField(null);
    setEditValue('');
  }

  const pay = paymentState(lead.booking ? { ...lead.booking } : null);
  const nextStage = nextStageFor(stage);
  const editable = stage !== 'guanyat' || !lead.booking;

  async function moveLead(target: Stage) {
    if (pending || target === stage) return;
    if (target === 'perdut') {
      // Per ara redirigim a l'Agenda per usar el modal de motiu perdut
      router.push(`/admin/leads?lost=${lead.id}`);
      return;
    }
    setPending(true);
    const previous = stage;
    setStage(target);
    try {
      await patchLeadStatus({ leadId: lead.id, status: target === 'nou' ? 'NEW' : target === 'contactat' ? 'CONTACTED' : 'WON' });
      toast.success(`Mogut a ${STAGE_LABEL[target]}.`);
      if (target === 'guanyat' && !lead.booking) {
        startTransition(() => router.push(`/admin/bookings/new?leadId=${encodeURIComponent(lead.id)}`));
        return;
      }
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('[LeadDetailClient] Error moving lead', error);
      setStage(previous);
      toast.error("No s'ha pogut canviar l'estat.");
    } finally {
      setPending(false);
    }
  }

  const [bookingPayment, setBookingPayment] = useState({
    paymentMethod: lead.booking?.paymentMethod ?? 'INVOICE',
    invoiceRequired: lead.booking?.invoiceRequired ?? false,
    cashAmount: lead.booking?.cashAmount ? String(lead.booking.cashAmount) : '',
  });

  async function saveBookingPayment(field: string, value: unknown) {
    if (!lead.booking) return;
    try {
      await fetchWithCsrf(`/api/admin/bookings/${lead.booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      toast.success('Desat.');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('[LeadDetailClient] Error saving booking payment', error);
      toast.error('Error desant.');
    }
  }

  async function markDepositPaid() {
    if (!lead.booking || payPending) return;
    setPayPending(true);
    try {
      await fetchWithCsrf(`/api/admin/bookings/${lead.booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositPaid: true }),
      });
      toast.success('Senyal marcat com a pagat.');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('[LeadDetailClient] Error marking deposit paid', error);
      toast.error('Error marcant el pagament.');
    } finally {
      setPayPending(false);
    }
  }

  async function markRemainingPaid() {
    if (!lead.booking || payPending) return;
    setPayPending(true);
    try {
      await fetchWithCsrf(`/api/admin/bookings/${lead.booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remainingPaid: true }),
      });
      toast.success('Resta marcada com a pagada.');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('[LeadDetailClient] Error marking remaining paid', error);
      toast.error('Error marcant el pagament.');
    } finally {
      setPayPending(false);
    }
  }

  return (
    <div className="fxd__fullpage" data-stage={stage}>

      {/* Capçalera */}
      <header className="fxd__bar">
        <Link href="/admin/leads" className="fxd__back">← Temporada</Link>
      </header>

      {/* Hero */}
      <section className="fxd__hero">
        <span className="fxd__kicker">{STAGE_LABEL[stage]} · {lead.type}</span>
        <h2>{lead.name}</h2>
        {lead.lostReason && <span className="fxd__lost">{lead.lostReason}</span>}
        {lead.wx && (
          <span className="fxd__wxrow">
            <WxBadge wx={lead.wx} size="md" />
            {lead.dateISO && <span className="fxd__wxdate">{fullDate(lead.dateISO.slice(0, 10))}</span>}
          </span>
        )}
      </section>

      {/* Stats */}
      <div className="fxd__stats">
        <div>
          <span>Valor</span>
          {editField === 'budget' ? (
            <span className="fxd__editrow">
              <input className="fxd__editinput" type="number" min={0} value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                autoFocus style={{ width: 90 }} />
              <span className="text-[11px]">€</span>
              <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
              <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
            </span>
          ) : (
            <b className="cursor-pointer border-b border-dashed border-[var(--line2)]" onClick={() => startEdit('budget')}>
              {fields.budget ? formatCurrency(Number(fields.budget)) : <em className="text-[11px]" style={{ opacity: 0.5 }}>Afegir</em>}
            </b>
          )}
        </div>
        <div>
          <span>Durada</span><b>{durationLabel(fields.eventStartTime, fields.eventEndTime)}</b>
        </div>
        <div><span>Prioritat</span><b className={`fxd__pri--${lead.priority.toLowerCase()}`}>{PRIORITY_LABEL[lead.priority] || lead.priority}</b></div>
      </div>

      {/* Indicador de preu — just sota els stats */}
      {(() => {
        const val = fields.budget ? Number(fields.budget) : 0;
        const t = fields.eventStartTime; const e = fields.eventEndTime;
        if (!val || !t || !e) return null;
        const [sh, sm] = t.split(':').map(Number);
        const [eh, em] = e.split(':').map(Number);
        if (![sh, sm, eh, em].every(Number.isFinite)) return null;
        const startMin = sh * 60 + sm;
        let endMin = eh * 60 + em;
        if (endMin <= startMin) endMin += 24 * 60;
        const hours = (endMin - startMin) / 60;
        if (hours <= 0) return null;
        const key = resolveServicePricingKey({ eventType: lead.type });
        const rate = SERVICE_HOURLY_RATES[key];
        const perHour = Math.round((val / hours) * 10) / 10;
        const devPct = Math.round(((perHour - rate.recommended) / rate.recommended) * 100);
        const level = perHour < rate.min ? 'critical' : perHour < rate.recommended ? 'warn' : 'ok';
        const sign = devPct >= 0 ? '+' : '';
        return (
          <div className="fxd__pricehint" data-level={level}>
            <span className="fxd__ph-rate">{perHour}€/h</span>
            <span className="fxd__ph-dev">{sign}{devPct}% vs mercat</span>
            <span className="fxd__ph-rec">Recomanat: {rate.recommended}€/h</span>
          </div>
        );
      })()}

      {/* Grid de panells */}
      <div className="fxd__grid">

        {/* Col 1, Fila 1 — Fase + accions */}
        <section className="fxd__panel">
          <div className="fxd__panelhead"><span>Fase</span></div>
          <div className="fxd__stagepick">
            {PIPELINE_STAGES.map((s) => (
              <button key={s} type="button" data-stage={s}
                className={s === stage ? 'is-on' : ''}
                disabled={pending || s === stage || (s === 'guanyat' && !!lead.booking)}
                onClick={() => moveLead(s)}
              >
                <span className="fx__dot" data-stage={s} />{STAGE_LABEL[s]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
            <Link href={`/admin/presupuestos?leadId=${lead.id}`} className="fxd__btn" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>+ Pressupost</Link>
            <Link href={`/admin/dossiers?leadId=${lead.id}`} className="fxd__btn" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>+ Dossier</Link>
          </div>
          {stage === 'guanyat' && !lead.booking && (
            <Link href={`/admin/bookings/new?leadId=${encodeURIComponent(lead.id)}`} className="fxd__btn fxd__btn--primary" style={{ marginTop: 8 }}>Crear reserva</Link>
          )}
        </section>

        {/* Col 2, Fila 1 — Dades del bolo */}
        <section className="fxd__panel">
          <div className="fxd__panelhead"><span>Dades del bolo</span></div>
          <dl className="fxd__rows fxd__rows--event">
            <div><dt>Data</dt><dd>
              {editField === 'eventDate' ? (
                <span className="fxd__editrow">
                  <input className="fxd__editinput" type="date" value={editValue} autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button className="fxd__editval" onClick={() => startEdit('eventDate')}>
                  {fields.eventDate ? fullDate(fields.eventDate) : <em className="fxd__empty">Afegir →</em>}
                </button>
              )}
            </dd></div>
            <div><dt>Pax</dt><dd>
              {editField === 'guestCount' ? (
                <span className="fxd__editrow">
                  <input className="fxd__editinput" type="number" min={1} value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                    autoFocus />
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button className="fxd__editval" onClick={() => startEdit('guestCount')}>
                  {fields.guestCount || <em className="fxd__empty">Afegir →</em>}
                </button>
              )}
            </dd></div>
            <div><dt>Inici</dt><dd>
              {editField === 'eventStartTime' ? (
                <span className="fxd__editrow">
                  <input className="fxd__editinput" type="time" value={editValue} autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button className="fxd__editval" onClick={() => startEdit('eventStartTime')}>
                  {fields.eventStartTime || <em className="fxd__empty">Afegir →</em>}
                </button>
              )}
            </dd></div>
            <div><dt>Fi</dt><dd>
              {editField === 'eventEndTime' ? (
                <span className="fxd__editrow">
                  <input className="fxd__editinput" type="time" value={editValue} autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button className="fxd__editval" onClick={() => startEdit('eventEndTime')}>
                  {fields.eventEndTime || <em className="fxd__empty">Afegir →</em>}
                </button>
              )}
            </dd></div>
            <div className="fxd__row--long"><dt>Lloc</dt><dd>
              {editField === 'eventLocation' ? (
                <span className="fxd__editrow">
                  <input className="fxd__editinput" value={editValue} autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button className="fxd__editval" onClick={() => startEdit('eventLocation')}>
                  {fields.eventLocation || <em className="fxd__empty">Afegir →</em>}
                </button>
              )}
            </dd></div>
          </dl>
        </section>

        {/* Col 3, Fila 1 — Contacte */}
        <section className="fxd__panel">
          <div className="fxd__panelhead"><span>Contacte</span></div>
          <dl className="fxd__rows fxd__rows--contact">
            {(['phone', 'email'] as EditableField[]).map((f) => (
              <div key={f} className={f === 'email' ? 'fxd__row--long' : undefined}>
                <dt>{f === 'phone' ? 'Telèfon' : 'Email'}</dt>
                <dd>
                  {editField === f ? (
                    <span className="fxd__editrow">
                      <input
                        className="fxd__editinput"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        autoFocus
                        type={f === 'email' ? 'email' : 'tel'}
                      />
                      <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                      <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                    </span>
                  ) : (
                    <button className="fxd__editval" onClick={() => startEdit(f)}>
                      {fields[f] || <em className="fxd__empty">Afegir →</em>}
                    </button>
                  )}
                </dd>
              </div>
            ))}
            <div><dt>Canal</dt><dd>{sourceLabel(lead.channel)}</dd></div>
            <div><dt>Últim contacte</dt><dd>{lead.last || '—'}</dd></div>
          </dl>
          <div className="fxd__actions fxd__actions--contact">
            {fields.phone ? (
              <a href={buildLeadWhatsAppHref(fields.phone, lead.name)} target="_blank" rel="noopener noreferrer" className="fxd__btn fxd__btn--whatsapp">
                💬 WhatsApp
              </a>
            ) : (
              <button type="button" className="fxd__btn" disabled>Sense telèfon</button>
            )}
            <Link href={buildLeadComposeHref(lead.id, 'seguiment')} className="fxd__btn fxd__btn--mail">
              ✉️ Correu
            </Link>
          </div>
        </section>


        {/* Forma de cobrament */}
        {lead.booking && (
          <section className="fxd__panel">
            <div className="fxd__panelhead"><span>Forma de cobrament</span></div>
            <dl className="fxd__rows">
              <div>
                <dt>Mètode</dt>
                <dd>
                  <select
                    className="fxd__editinput"
                    value={bookingPayment.paymentMethod}
                    onChange={(e) => {
                      setBookingPayment((p) => ({ ...p, paymentMethod: e.target.value }));
                      saveBookingPayment('paymentMethod', e.target.value);
                    }}
                    aria-label="Mètode de pagament"
                  >
                    <option value="INVOICE">Factura</option>
                    <option value="CASH">Efectiu</option>
                    <option value="TRANSFER">Transferència</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt>Vol factura?</dt>
                <dd>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bookingPayment.invoiceRequired}
                      onChange={(e) => {
                        setBookingPayment((p) => ({ ...p, invoiceRequired: e.target.checked }));
                        saveBookingPayment('invoiceRequired', e.target.checked);
                      }}
                    />
                    <span className="text-xs">{bookingPayment.invoiceRequired ? 'Sí' : 'No — sense factura'}</span>
                  </label>
                </dd>
              </div>
              {bookingPayment.paymentMethod === 'CASH' && (
                <div>
                  <dt>Import efectiu</dt>
                  <dd>
                    {editField === ('cashAmount' as EditableField) ? (
                      <span className="fxd__editrow">
                        <input className="fxd__editinput" type="number" min={0} value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { saveBookingPayment('cashAmount', parseFloat(editValue) || null); setBookingPayment((p) => ({ ...p, cashAmount: editValue })); cancelEdit(); }
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus style={{ width: 100 }} />
                        <span className="text-xs text-[var(--t3)]">€</span>
                        <button className="fxd__savebtn" onClick={() => { saveBookingPayment('cashAmount', parseFloat(editValue) || null); setBookingPayment((p) => ({ ...p, cashAmount: editValue })); cancelEdit(); }} disabled={savePending}>✓</button>
                        <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                      </span>
                    ) : (
                      <button className="fxd__editval" onClick={() => { setEditField('cashAmount' as EditableField); setEditValue(bookingPayment.cashAmount); }}>
                        {bookingPayment.cashAmount ? `${bookingPayment.cashAmount}€` : <em className="fxd__empty">Afegir →</em>}
                      </button>
                    )}
                  </dd>
                </div>
              )}
            </dl>
            {bookingPayment.paymentMethod === 'CASH' && !bookingPayment.invoiceRequired && (
              <p className="mt-2 text-[11px] text-[var(--t3)]">
                Efectiu sense factura — no es genera a Holded. Queda registrat aquí.
              </p>
            )}
          </section>
        )}

        {/* Cobraments (si hi ha reserva) */}
        {lead.booking && (
          <section className="fxd__panel">
            <div className="fxd__panelhead"><span>Cobraments</span></div>
            <dl className="fxd__rows">
              <div>
                <dt>Senyal ({formatCurrency(lead.booking.depositAmount)})</dt>
                <dd className={lead.booking.depositPaid ? 'fxd__ok' : 'fxd__pend'}>
                  {lead.booking.depositPaid ? 'Pagat' : 'Pendent'}
                </dd>
              </div>
              <div>
                <dt>Resta ({formatCurrency(lead.booking.remainingAmount)})</dt>
                <dd className={lead.booking.remainingPaid ? 'fxd__ok' : 'fxd__pend'}>
                  {lead.booking.remainingPaid ? 'Pagada' : 'Pendent'}
                </dd>
              </div>
            </dl>
            <div className="fxd__actions">
              {!lead.booking.depositPaid && (
                <button type="button" className="fxd__btn fxd__btn--primary" disabled={payPending} onClick={markDepositPaid}>
                  Marcar senyal pagat
                </button>
              )}
              {lead.booking.depositPaid && !lead.booking.remainingPaid && (
                <button type="button" className="fxd__btn fxd__btn--primary" disabled={payPending} onClick={markRemainingPaid}>
                  Marcar resta pagada
                </button>
              )}
              <Link href={buildBookingHref(lead.booking.id)} className="fxd__btn">
                Reserva completa →
              </Link>
            </div>
          </section>
        )}

        {/* Col 3, Fila 2 — Rendibilitat */}
        <section className="fxd__panel">
          <div className="fxd__panelhead"><span>Rendibilitat</span></div>
          <dl className="fxd__rows">
            <div><dt>Pressupost</dt><dd>
              {editField === 'budget' ? (
                <span className="fxd__editrow">
                  <input className="fxd__editinput" type="number" min={0} value={editValue} autoFocus style={{ width: 90 }}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                  <span className="text-[11px] text-[var(--t3)]">€</span>
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button className="fxd__editval" onClick={() => startEdit('budget')}>
                  {fields.budget ? `${fields.budget}€` : <em className="fxd__empty">Afegir →</em>}
                </button>
              )}
            </dd></div>
            {lead.booking && (<>
              <div><dt>Total reserva</dt><dd className="fxd__val--gold">
                <BookingTotalEditor
                  bookingId={lead.booking.id}
                  total={lead.booking.total}
                  costFloor={lead.booking.costFloor ?? undefined}
                />
              </dd></div>
              {lead.booking.totalHours > 0 && (
                <div>
                  <dt>€/hora</dt>
                  <dd className="fxd__val--gold">
                    {formatCurrency(lead.booking.total / lead.booking.totalHours)}/h
                    <span className="fxd__val--muted"> ({lead.booking.totalHours}h)</span>
                  </dd>
                </div>
              )}
              {lead.booking.collaboratorCost && (
                <div>
                  <dt>Cost {lead.booking.collaboratorCost.name}</dt>
                  <dd className="fxd__val--danger">
                    -{formatCurrency(lead.booking.collaboratorCost.amount)}
                    <span className="fxd__val--muted">
                      {' '}(net {formatCurrency(lead.booking.total - lead.booking.collaboratorCost.amount)})
                    </span>
                  </dd>
                </div>
              )}
            </>)}
            {proposals.length > 0 && (
              <div className="col-span-full mt-1 border-t border-[var(--line)] pt-2">
                <dt style={{ marginBottom: 4 }}>Pressupostos</dt>
                {proposals.map((p) => (
                  <dd key={p.id} className="flex justify-between py-0.5 text-[11px] text-[var(--t2)]">
                    <span>{p.reference}</span>
                    <span className={p.status === 'SENT' ? 'fxd__status--sent' : p.status === 'ACCEPTED' ? 'fxd__status--accepted' : 'fxd__status--draft'}>
                      {p.status === 'SENT' ? 'Enviat' : p.status === 'ACCEPTED' ? 'Acceptat' : p.status === 'DRAFT' ? 'Esborrany' : p.status}
                    </span>
                  </dd>
                ))}
              </div>
            )}
            {dossiers.length > 0 && (
              <div className="col-span-full mt-1 border-t border-[var(--line)] pt-2">
                <dt style={{ marginBottom: 4 }}>Dossiers</dt>
                {dossiers.map((d) => (
                  <dd key={d.id} className="flex justify-between py-0.5 text-[11px] text-[var(--t2)]">
                    <span>{d.nom}</span>
                    <span className={d.estat === 'enviat' ? 'fxd__status--sent' : d.estat === 'acceptat' ? 'fxd__status--accepted' : 'fxd__status--draft'}>
                      {d.estat}
                    </span>
                  </dd>
                ))}
              </div>
            )}
            <div><dt>Assignat a</dt><dd>
              <select className="fxd__editinput" value={lead.owner ?? ''} onChange={(e) => saveAssignedTo(e.target.value)} aria-label="Assignat a">
                <option value="">— Sense assignar</option>
                {collaborators.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </dd></div>
          </dl>
        </section>

      </div>
    </div>
  );
}
