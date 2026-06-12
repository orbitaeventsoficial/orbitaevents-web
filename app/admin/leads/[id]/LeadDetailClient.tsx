'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildLeadComposeHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import LeadBoloSection, { type BoloEconomia } from './LeadBoloSection';
import BookingTotalEditor from '../../bookings/[id]/BookingTotalEditor';

function buildLeadWhatsAppHref(phone: string, name: string): string {
  const msg = `Hola ${name}! Et contactem des d'Òrbita Events per la teva sol·licitud.`;
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(msg)}`;
}
import { patchLeadStatus } from '../leadStatusClient';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import ConfirmDialog, { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { SOURCE_LABELS, formatCurrency, formatDateFull } from '@/lib/constants';
import { TEAM_MEMBERS } from '@/lib/constants/admin';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';

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
  sourceCollaboratorId: string | null;
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

type ProposalItem = { id: string; reference: string; status: string; total: number; createdAt: string };
type DossierItem = { id: string; nom: string; estat: string; createdAt: string };

export default function LeadDetailClient({ lead, proposals, dossiers }: {
  lead: LeadDetailData;
  proposals: ProposalItem[];
  dossiers: DossierItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [stage, setStage] = useState<Stage>(lead.stage);
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [payPending, setPayPending] = useState(false);
  // Només col·laboradors amb rol REFERRER (els que ens passen bolos).
  const [referrers, setReferrers] = useState<{ id: string; name: string }[]>([]);
  const [editField, setEditField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savePending, setSavePending] = useState(false);
  // Economia del bolo elevada des de LeadBoloSection per al rail financer compacte.
  const [boloEcon, setBoloEcon] = useState<BoloEconomia | null>(null);
  const handleEconomia = useCallback((e: BoloEconomia | null) => setBoloEcon(e), []);

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
        const list = Array.isArray(data) ? data : Array.isArray(data?.collaborators) ? data.collaborators : [];
        // Només els que poden derivar bolos (rol REFERRER).
        setReferrers(
          list
            .filter((c: { roles?: string[] }) => Array.isArray(c.roles) && c.roles.includes('REFERRER'))
            .map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
        );
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

  async function handleDeleteLead() {
    const ok = await confirm({
      title: 'Eliminar lead',
      message: `Segur que vols eliminar "${lead.name}"? S'eliminaran notes, activitats, tasques i documents associats. Acció irreversible.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No s\'ha pogut eliminar');
      }
      toast.success('Lead eliminat.');
      router.push('/admin/leads');
    } catch (error) {
      console.error('[LeadDetailClient] Error eliminant lead', error);
      toast.error(error instanceof Error ? error.message : 'Error eliminant el lead.');
    }
  }

  async function saveSourceCollaborator(id: string) {
    try {
      await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCollaboratorId: id || null }),
      });
      toast.success('Origen del bolo desat.');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('[LeadDetailClient] Error saving source collaborator', error);
      toast.error('Error desant l\'origen del bolo.');
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

      {/* Barra superior */}
      <header className="ap-detail-bar">
        <Link href="/admin/leads" className="ap-detail-bar-btn">← Temporada</Link>
      </header>

      {/* BAND 1 · Identitat refeta — nom protagonista sol + rail de fets horitzontal */}
      <section className="fxd__hd">
        <div className="fxd__hd-top">
          <div className="fxd__hd-ident">
            <p className="fxd__hd-eyebrow">{STAGE_LABEL[stage]} · {lead.type} · {sourceLabel(lead.channel)}</p>
            <h2 className="fxd__hd-name">{lead.name}</h2>
          </div>
          <div className="fxd__hd-reach" aria-label="Contacte ràpid">
            {(['phone', 'email'] as EditableField[]).map((f) => (
              editField === f ? (
                <span key={f} className="fxd__editrow fxd__hd-reachedit">
                  <input className="fxd__editinput" value={editValue} type={f === 'email' ? 'email' : 'tel'}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} autoFocus />
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button key={f} type="button" className="fxd__hd-reachitem" onClick={() => startEdit(f)}>
                  <span className="fxd__hd-reachlbl">{f === 'phone' ? 'Tel.' : 'Email'}</span>
                  <span className="fxd__hd-reachval">{fields[f] || <em className="fxd__empty">Afegir</em>}</span>
                </button>
              )
            ))}
            <span className="fxd__hd-reachbtns">
              {fields.phone && (
                <a href={buildLeadWhatsAppHref(fields.phone, lead.name)} target="_blank" rel="noopener noreferrer" className="fxd__btn fxd__btn--whatsapp fxd__btn--sm">WhatsApp</a>
              )}
              <Link href={buildLeadComposeHref(lead.id, 'seguiment')} className="fxd__btn fxd__btn--mail fxd__btn--sm">Correu</Link>
            </span>
          </div>
        </div>

        {/* Rail de fets — una sola línia ledger amb columnes separades per hairline */}
        <div className="fxd__hd-rail" aria-label="Dades del bolo">
          {([
            { f: 'eventDate' as EditableField, lbl: 'Data', type: 'date', show: (v: string) => v ? fullDate(v) : '' },
            { f: 'eventStartTime' as EditableField, lbl: 'Inici', type: 'time', show: (v: string) => v },
            { f: 'eventEndTime' as EditableField, lbl: 'Fi', type: 'time', show: (v: string) => v },
            { f: 'eventLocation' as EditableField, lbl: 'Lloc', type: 'text', show: (v: string) => v },
            { f: 'guestCount' as EditableField, lbl: 'Pax', type: 'number', show: (v: string) => v ? `${v}` : '' },
          ]).map(({ f, lbl, type, show }) => (
            <div key={f} className="fxd__fact">
              <span className="fxd__fact-lbl">{lbl}</span>
              {editField === f ? (
                <span className="fxd__editrow">
                  <input className="fxd__editinput" type={type} value={editValue} autoFocus min={type === 'number' ? 1 : undefined}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                  <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                  <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
                </span>
              ) : (
                <button type="button" className="fxd__fact-val" onClick={() => startEdit(f)}>
                  {show(String(fields[f] ?? '')) || <em className="fxd__empty">+</em>}
                </button>
              )}
            </div>
          ))}
          <div className="fxd__fact">
            <span className="fxd__fact-lbl">Durada</span>
            <span className="fxd__fact-val fxd__fact-val--ro">{durationLabel(fields.eventStartTime, fields.eventEndTime)}</span>
          </div>
          <div className="fxd__fact">
            <span className="fxd__fact-lbl">Prioritat</span>
            <span className={`fxd__fact-val fxd__fact-val--ro fxd__pri--${lead.priority.toLowerCase()}`}>{PRIORITY_LABEL[lead.priority] || lead.priority}</span>
          </div>
          {lead.wx && (
            <div className="fxd__fact">
              <span className="fxd__fact-lbl">Temps</span>
              <span className="fxd__fact-val fxd__fact-val--ro fxd__fact-wx">
                <WxBadge wx={lead.wx} size="sm" />
                {lead.dateISO && <span className="fxd__fact-wxdate">{fullDate(lead.dateISO.slice(0, 10))}</span>}
              </span>
            </div>
          )}
          <div className="fxd__fact fxd__fact--value">
            <span className="fxd__fact-lbl">Valor</span>
            {editField === 'budget' ? (
              <span className="fxd__editrow">
                <input className="fxd__editinput" type="number" min={0} value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus />
                <button className="fxd__savebtn" onClick={saveEdit} disabled={savePending}>✓</button>
                <button className="fxd__cancelbtn" onClick={cancelEdit}>✕</button>
              </span>
            ) : (
              <button type="button" className="fxd__fact-val fxd__fact-val--big" onClick={() => startEdit('budget')}>
                {boloEcon?.total
                  ? formatCurrency(boloEcon.total)
                  : fields.budget
                    ? formatCurrency(Number(fields.budget))
                    : (() => {
                        const prop = proposals.find((p) => Number.isFinite(p.total) && p.total > 0)?.total;
                        return prop ? formatCurrency(prop) : <em className="fxd__empty">Afegir</em>;
                      })()}
              </button>
            )}
          </div>
        </div>

        {lead.lostReason && <p className="fxd__hd-lost">{lead.lostReason}</p>}
      </section>

      {/* Àrea zenit: govern esquerra · bolo centre · economia dreta */}
      <div className="fxd__zenith">

      <aside className="fxd__rail fxd__rail--left" aria-label="Govern del lead">

        {/* Col 1, Fila 1 — Fase + accions */}
        <section className="fxd__panel">
          <div className="fxd__panelhead"><span>Fase</span></div>
          <div className="fxd__stageactions">
            <Link href={`/admin/presupuestos?leadId=${lead.id}`} className="fxd__btn">+ Pressupost</Link>
            <Link href={`/admin/dossiers?leadId=${lead.id}`} className="fxd__btn">+ Dossier</Link>
            {stage === 'perdut' && (
              <button type="button" className="fxd__btn fxd__btn--danger" onClick={handleDeleteLead}>Eliminar lead</button>
            )}
          </div>
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
          {stage === 'guanyat' && !lead.booking && (
            <Link href={`/admin/bookings/new?leadId=${encodeURIComponent(lead.id)}`} className="fxd__btn fxd__btn--primary fxd__stage-create">Crear reserva</Link>
          )}
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
                  <label className="fxd__checkrow">
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
                          autoFocus />
                        <span className="fxd__editunit">€</span>
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
              <p className="fxd__payment-note">
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

        {/* Rendibilitat — sota Fase, mateixa columna esquerra */}
        <section className="fxd__panel fxd__panel--wide">
          <div className="fxd__panelhead"><span>Rendibilitat</span></div>
          <dl className="fxd__rows">
            {/* El pressupost (budget) ja viu als stats «Valor» — no es duplica aquí. */}
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
              <div className="fxd__docgroup">
                <dt className="fxd__docgroup-title">Pressupostos</dt>
                {proposals.map((p) => (
                  <dd key={p.id} className="fxd__docitem">
                    <Link href={buildProposalHref(p.id)} className="fxd__doclink fxd__doclink--row">
                      <span className="min-w-0 truncate">{p.reference}</span>
                      <span className="flex flex-none items-center gap-2">
                        <span className="fxd__val--gold">{formatCurrency(p.total)}</span>
                        <span className={p.status === 'SENT' ? 'fxd__status--sent' : p.status === 'ACCEPTED' ? 'fxd__status--accepted' : 'fxd__status--draft'}>
                          {p.status === 'SENT' ? 'Enviat' : p.status === 'ACCEPTED' ? 'Acceptat' : p.status === 'DRAFT' ? 'Esborrany' : p.status}
                        </span>
                      </span>
                    </Link>
                  </dd>
                ))}
              </div>
            )}
            {dossiers.length > 0 && (
              <div className="fxd__docgroup">
                <dt className="fxd__docgroup-title">Dossiers</dt>
                {dossiers.map((d) => (
                  <dd key={d.id} className="fxd__docitem">
                    <a href={`/api/admin/dossiers/${d.id}/composite`} target="_blank" rel="noopener noreferrer" className="fxd__doclink fxd__doclink--row">
                      <span className="min-w-0 truncate">{d.nom}</span>
                      <span className={`flex-none ${d.estat === 'enviat' ? 'fxd__status--sent' : d.estat === 'acceptat' ? 'fxd__status--accepted' : 'fxd__status--draft'}`}>
                        {d.estat}
                      </span>
                    </a>
                  </dd>
                ))}
              </div>
            )}
            <div className="fxd__row--long"><dt>Responsable intern <small className="fxd__hint-inline">qui d&apos;Òrbita el porta</small></dt><dd>
              <select className="fxd__editinput" value={lead.owner ?? ''} onChange={(e) => saveAssignedTo(e.target.value)} aria-label="Responsable intern del lead">
                <option value="">— Sense assignar</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {lead.owner && !TEAM_MEMBERS.includes(lead.owner as typeof TEAM_MEMBERS[number]) && (
                  <option value={lead.owner}>{lead.owner}</option>
                )}
              </select>
            </dd></div>
            <div className="fxd__row--long"><dt>Bolo passat per <small className="fxd__hint-inline">col·laborador que ens deriva el client</small></dt><dd>
              <select className="fxd__editinput" value={lead.sourceCollaboratorId ?? ''} onChange={(e) => saveSourceCollaborator(e.target.value)} aria-label="Col·laborador que ha derivat el bolo">
                <option value="">— Ningú / client directe</option>
                {referrers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </dd></div>
          </dl>
        </section>

        {/* Marge del bolo — viu al peu de la columna de govern (omple el buit que
            abans quedava sota la Rendibilitat) i estira fins a baix de tot. */}
        <section className="fxd__panel fxd__panel--wide fxd__panel--margin" aria-label="Marge del bolo">
          <div className="fxd__panelhead">
            <span>Marge del bolo</span>
            <span className="fxd__econonote">net = ingrés − cost − origen</span>
          </div>
          {!boloEcon ? (
            <p className="fxd__econonote">Afegeix línies al bolo per veure el marge.</p>
          ) : (
            <div className="fxd__kpis">
              <div className="fxd__kpi" data-level="info">
                <div className="fxd__kpi-val">{formatCurrency(boloEcon.total)}</div>
                <div className="fxd__kpi-lbl">Ingrés</div>
                <div className="fxd__kpi-sub">suma de les línies</div>
              </div>
              <div className="fxd__kpi" data-level="info">
                <div className="fxd__kpi-val">{formatCurrency(boloEcon.directCost)}</div>
                <div className="fxd__kpi-lbl">Cost directe</div>
                <div className="fxd__kpi-sub">
                  {formatCurrency(boloEcon.serviceLinesCost)} serveis + {formatCurrency(boloEcon.fixedOperationalCost)} operativa
                </div>
              </div>
              <div className="fxd__kpi" data-level="info">
                <div className="fxd__kpi-val">{formatCurrency(boloEcon.acquisitionCost)}</div>
                <div className="fxd__kpi-lbl">Origen</div>
                <div className="fxd__kpi-sub">cost comercial imputat</div>
              </div>
              <div className="fxd__kpi" data-level={boloEcon.tone === 'rose' ? 'critical' : boloEcon.tone === 'orange' || boloEcon.tone === 'amber' ? 'warn' : 'ok'}>
                <div className="fxd__kpi-val">{formatCurrency(boloEcon.net)}</div>
                <div className="fxd__kpi-lbl">Net</div>
                <div className="fxd__kpi-sub">
                  {Math.round(boloEcon.marginPct)}% marge · {boloEcon.label}
                </div>
              </div>
            </div>
          )}
        </section>
      </aside>

      <main className="fxd__zenith-main" aria-label="Configuració del bolo">
        <LeadBoloSection leadId={lead.id} source={lead.channel} onEconomiaChange={handleEconomia} compactEconomia />
      </main>
      </div>{/* /fxd__zenith */}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
