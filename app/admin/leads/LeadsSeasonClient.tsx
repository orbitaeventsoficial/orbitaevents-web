'use client';

/* ============================================================================
   ÒRBITA ADMIN — Leads · Agenda · Client (Brass & Obsidian)
   Canvas negre. Reconstruïm peça a peça.
============================================================================ */

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './leads-design.css';
import { useToast } from '@/app/admin/components/ToastProvider';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { LEAD_LOST_REASON_LABELS, isLeadLostReason } from '@/lib/constants/leadLoss';
import { fetchWithCsrf } from '@/lib/csrf';
import LeadLostStatusPrompt from './LeadLostStatusPrompt';
import { patchLeadStatus, type LeadStatus } from './leadStatusClient';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';
import { SERVICE_HOURLY_RATES, resolveServicePricingKey } from '@/lib/constants/pricing-intelligence';

/* ── Tipus ──────────────────────────────────────────────────────────────── */

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadData = {
  id: string; name: string; type: string; dateISO: string; time: string; endTime: string;
  location: string; pax: number; product: string; value: number;
  stage: 'nou' | 'contactat' | 'guanyat' | 'perdut';
  kind: 'lead' | 'booking';
  realStatus: LeadStatus | null;
  lostReason: string | null;
  phone: string | null;
  email: string | null;
  priority: LeadPriority;
  channel: string; owner: string; last: string;
  booking: { id: string; reference: string; status: string; depositPaid: boolean; remainingPaid: boolean } | null;
  wx: WxData;
};

type PayState = 'full' | 'part' | 'none';
function paymentState(booking: LeadData['booking']): PayState | null {
  if (!booking) return null;
  if (booking.depositPaid && booking.remainingPaid) return 'full';
  if (booking.depositPaid) return 'part';
  return 'none';
}
type Stage = LeadData['stage'];
type ViewMode = 'calendari' | 'pipeline' | 'llista';

/* ── Constants · v847 ───────────────────────────────────────────────────── */

const STAGE_LABEL: Record<Stage, string> = {
  nou: 'Nou', contactat: 'Contactat', guanyat: 'Guanyat', perdut: 'Perdut',
};
const STAGE_TOOLTIP: Record<Stage, string> = {
  nou:       'Nou lead — cal primer contacte',
  contactat: 'En seguiment — contacte fet, pendent de tancar',
  guanyat:   'Guanyat — pendent de crear reserva',
  perdut:    'Lead perdut',
};
const PAY_TOOLTIP: Record<PayState, string> = {
  full: 'Reserva pagada del tot',
  part: 'Senyal pagat · resta pendent',
  none: 'Reserva sense cap pagament',
};
const PAY_LABEL: Record<PayState, string> = {
  full: 'Pagada',
  part: 'Senyal pagat',
  none: 'Sense pagaments',
};
const PIPELINE_STAGES: Stage[] = ['nou', 'contactat', 'guanyat', 'perdut'];

const PRIORITY_LABEL: Record<LeadPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Mitjana',
  HIGH: 'Alta',
  URGENT: 'Urgent',
};

const STAGE_TO_STATUS: Record<Exclude<Stage, 'perdut'>, LeadStatus> = {
  nou: 'NEW', contactat: 'CONTACTED', guanyat: 'WON',
};

const MONTH_WINDOW = 3;
const MONTH_MAX_START = 36;
const MONTHS_FULL = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
const MONTHS_SHORT = ['gen','feb','març','abr','mai','jun','jul','ago','set','oct','nov','des'];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function euro(n: number): string { return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`; }
function parseISO(iso: string) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; }
function isoDate(y: number, m: number, d: number) { return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function shiftIso(iso: string, days: number) { const { y, m, d } = parseISO(iso); const t = new Date(Date.UTC(y, m - 1, d + days)); return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }
function saturdaysInMonth(y: number, m: number) { const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); const out: string[] = []; for (let d = 1; d <= last; d++) if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 6) out.push(isoDate(y, m, d)); return out; }
function toCalMonth(baseYear: number, virtualM: number) { return { y: baseYear + Math.floor((virtualM - 1) / 12), m: ((virtualM - 1) % 12) + 1 }; }
function fullDate(iso: string) { if (!iso) return '—'; const { y, m, d } = parseISO(iso); return `${d} de ${MONTHS_FULL[m - 1].toLowerCase()} ${y}`; }
function durationLabel(start: string, end: string): string {
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
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}
function leadSummary(lead: LeadData) {
  if (lead.stage === 'nou') return lead.channel ? `Entrat per ${lead.channel}. Cal primer contacte.` : 'Cal primer contacte.';
  if (lead.stage === 'contactat') return lead.owner ? `Seguiment amb ${lead.owner}${lead.last ? `. Últim contacte: ${lead.last}` : ''}.` : 'En seguiment. Cal avançar.';
  if (lead.stage === 'guanyat') return 'Crear reserva, contracte i pagament inicial.';
  return 'Arxivat com a perdut. Revisar motiu i possible reactivació.';
}
function focusActionLabel(lead: LeadData): string {
  if (lead.stage === 'nou')      return 'Cal contactar';
  if (lead.stage === 'guanyat')  return lead.booking ? 'Reserva activa' : 'Crear reserva';
  if (lead.stage === 'perdut')   return 'Lead perdut';
  // contactat — afina per prioritat si és urgent
  if (lead.priority === 'URGENT') return 'Seguiment urgent';
  if (lead.priority === 'HIGH')   return 'Seguiment prioritari';
  return 'En seguiment';
}
function buildLeadWhatsAppHref(phone: string, name: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const text = encodeURIComponent(`Hola ${name}! Soc d'Orbita Events, gracies per la vostra consulta.`);
  return `https://wa.me/${digits}?text=${text}`;
}
function lostReasonLabel(reason: string | null): string | null {
  return isLeadLostReason(reason) ? LEAD_LOST_REASON_LABELS[reason] : null;
}

/* ── Icones ─────────────────────────────────────────────────────────────── */

const ic = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const I = {
  plus:   ic(<><path d="M12 5v14M5 12h14" /></>),
  arrow:  ic(<path d="M5 12h14M13 6l6 6-6 6" />),
  back:   ic(<path d="M19 12H5M11 6l-6 6 6 6" />),
  close:  ic(<path d="M18 6 6 18M6 6l12 12" />),
  mail:   ic(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  phone:  ic(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.6a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6.28 6.28l1.29-1.29a2 2 0 0 1 2.11-.45c.83.3 1.7.51 2.6.63A2 2 0 0 1 22 16.92z" />),
};

type WeekendSlot = { type: 'weekend'; friIso: string; days: { iso: string; d: number; inMonth: boolean; lead: LeadData | null }[] };
type WeekdaySlot = { type: 'weekday'; iso: string; d: number; dow: number; lead: LeadData };
type CalSlot = WeekendSlot | WeekdaySlot;
type MonthBlock = {
  m: number; label: string; isFuture: boolean;
  slots: CalSlot[];
};

function parseBillableHours(time: string, endTime: string): number {
  const [sh, sm] = time.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return 0;
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;
  return (endMin - startMin) / 60;
}

function PriceHint({ value, time, endTime, type }: { value: number; time: string; endTime: string; type: string }) {
  if (!value || !time || !endTime) return null;
  const hours = parseBillableHours(time, endTime);
  if (hours <= 0) return null;
  const key = resolveServicePricingKey({ eventType: type });
  const rate = SERVICE_HOURLY_RATES[key];
  const perHour = Math.round((value / hours) * 10) / 10;
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
}

function BookingInlineActions({ lead }: { lead: LeadData }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<'deposit' | 'remaining' | null>(null);
  const booking = lead.booking;
  if (!booking) return null;
  const pay = paymentState(booking);

  async function patchPayment(kind: 'deposit' | 'remaining') {
    if (!booking || busy) return;
    setBusy(kind);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kind === 'deposit' ? { depositPaid: true } : { remainingPaid: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No s'ha pogut actualitzar el cobrament.");
      }
      toast.success(kind === 'deposit' ? 'Senyal marcat com a pagat.' : 'Resta marcada com a pagada.');
      router.refresh();
    } catch (err) {
      console.error('[admin/leads] booking payment patch', err);
      toast.error(err instanceof Error ? err.message : "No s'ha pogut actualitzar el cobrament.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="fxd__panel fxd__panel--booking">
      <div className="fxd__panelhead">
        <span>Reserva</span>
        <strong>{booking.reference}</strong>
      </div>
      <div className="fxd__bookingstate">
        {pay && <span className="fx__pay" data-pay={pay} />}
        <span>{pay ? PAY_LABEL[pay] : 'Reserva vinculada'}</span>
      </div>
      <div className="fxd__actions">
        {pay !== 'full' && !booking.depositPaid && (
          <button type="button" className="fxd__btn" disabled={busy !== null} onClick={() => { void patchPayment('deposit'); }}>
            {busy === 'deposit' ? 'Marcant...' : 'Marcar senyal'}
          </button>
        )}
        {pay !== 'full' && booking.depositPaid && !booking.remainingPaid && (
          <button type="button" className="fxd__btn" disabled={busy !== null} onClick={() => { void patchPayment('remaining'); }}>
            {busy === 'remaining' ? 'Marcant...' : 'Marcar resta'}
          </button>
        )}
        <Link href={buildBookingHref(booking.id)} className="fxd__btn fxd__btn--ghost">Obrir reserva</Link>
      </div>
    </section>
  );
}

function LeadDetailPanel({
  lead,
  onClose,
  onMoveLead,
  pending,
}: {
  lead: LeadData;
  onClose: () => void;
  onMoveLead: (leadId: string, target: Stage) => void;
  pending: boolean;
}) {
  const editable = lead.kind === 'lead' && lead.realStatus !== null;
  const pay = paymentState(lead.booking);
  const reason = lostReasonLabel(lead.lostReason);
  const nextStage: Stage | null = lead.stage === 'nou'
    ? 'contactat'
    : lead.stage === 'contactat'
      ? 'guanyat'
      : lead.stage === 'perdut'
        ? 'nou'
        : null;

  return (
    <div className="fxd" data-stage={lead.stage} role="dialog" aria-modal="true" aria-label={`Fitxa de ${lead.name}`}>
      <div className="fxd__shade" onClick={onClose} />
      <aside className="fxd__sheet">
        <header className="fxd__bar">
          <button type="button" className="fxd__back" onClick={onClose}><span>{I.back}</span>Torna</button>
          <Link href={buildLeadWorkspaceHref(lead.id)} className="fxd__full">Fitxa completa</Link>
          <button type="button" className="fxd__close" aria-label="Tancar fitxa" onClick={onClose}>{I.close}</button>
        </header>

        <section className="fxd__hero">
          <span className="fxd__kicker">{STAGE_LABEL[lead.stage]} · {lead.type}</span>
          <h2>{lead.name}</h2>
          {reason && <span className="fxd__lost">{reason}</span>}
          {lead.wx.forecast && (
            <span className="fxd__wxrow">
              <WxBadge wx={lead.wx} size="md" />
              {lead.dateISO && <span className="fxd__wxdate">{fullDate(lead.dateISO)}</span>}
            </span>
          )}
        </section>

        <div className="fxd__stats">
          <div><span>Valor</span><b>{lead.value ? euro(lead.value) : '—'}</b></div>
          <div><span>Durada</span><b>{durationLabel(lead.time, lead.endTime)}</b></div>
          <div><span>Prioritat</span><b>{PRIORITY_LABEL[lead.priority]}</b></div>
        </div>
        <PriceHint value={lead.value} time={lead.time} endTime={lead.endTime} type={lead.type} />
        <div className="fxd__grid">
          <section className="fxd__panel">
            <div className="fxd__panelhead"><span>Següent pas</span></div>
            <p className="fxd__summary">{leadSummary(lead)}</p>
            <div className="fxd__actions">
              {lead.stage === 'guanyat' && !lead.booking && (
                <Link href={`/admin/bookings/new?leadId=${encodeURIComponent(lead.id)}`} className="fxd__btn fxd__btn--primary">
                  Crear reserva
                </Link>
              )}
              {lead.booking && (
                <Link href={buildBookingHref(lead.booking.id)} className="fxd__btn fxd__btn--primary">
                  Veure reserva
                </Link>
              )}
              {nextStage && editable && (
                <button type="button" className="fxd__btn fxd__btn--primary" disabled={pending} onClick={() => onMoveLead(lead.id, nextStage)}>
                  {pending ? 'Guardant...' : `Passar a ${STAGE_LABEL[nextStage]}`}
                </button>
              )}
              {lead.stage !== 'perdut' && editable && (
                <button type="button" className="fxd__btn" disabled={pending} onClick={() => onMoveLead(lead.id, 'perdut')}>
                  Marcar perdut
                </button>
              )}
            </div>
          </section>

          <section className="fxd__panel">
            <div className="fxd__panelhead"><span>Canviar fase</span></div>
            <div className="fxd__stagepick">
              {PIPELINE_STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  data-stage={stage}
                  className={stage === lead.stage ? 'is-on' : ''}
                  disabled={!editable || pending || stage === lead.stage}
                  onClick={() => onMoveLead(lead.id, stage)}
                >
                  <span className="fx__dot" data-stage={stage} />
                  {STAGE_LABEL[stage]}
                </button>
              ))}
            </div>
          </section>

          <section className="fxd__panel">
            <div className="fxd__panelhead"><span>Contacte</span></div>
            <dl className="fxd__rows fxd__rows--contact">
              <div><dt>Telèfon</dt><dd>{lead.phone || '—'}</dd></div>
              <div><dt>Email</dt><dd>{lead.email || '—'}</dd></div>
              <div><dt>Canal</dt><dd>{lead.channel || '—'}</dd></div>
              <div><dt>Últim contacte</dt><dd>{lead.last || '—'}</dd></div>
            </dl>
            <div className="fxd__actions fxd__actions--contact">
              {lead.phone ? (
                <a href={buildLeadWhatsAppHref(lead.phone, lead.name)} target="_blank" rel="noopener noreferrer" className="fxd__btn fxd__btn--whatsapp">
                  <span>{I.phone}</span>WhatsApp
                </a>
              ) : (
                <button type="button" className="fxd__btn" disabled><span>{I.phone}</span>Sense telèfon</button>
              )}
              {lead.kind === 'lead' && (
                <Link href={buildLeadComposeHref(lead.id, 'seguiment')} className="fxd__btn fxd__btn--mail">
                  <span>{I.mail}</span>Correu
                </Link>
              )}
            </div>
          </section>

          <section className="fxd__panel">
            <div className="fxd__panelhead"><span>Dades del bolo</span></div>
            <dl className="fxd__rows fxd__rows--event">
              <div><dt>Data</dt><dd>{lead.dateISO ? fullDate(lead.dateISO) : '—'}</dd></div>
              <div><dt>Pax</dt><dd>{lead.pax || '—'}</dd></div>
              <div><dt>Inici</dt><dd>{lead.time || '—'}</dd></div>
              <div><dt>Fi</dt><dd>{lead.endTime || '—'}</dd></div>
              <div className="fxd__row--long"><dt>Lloc</dt><dd>{lead.location || '—'}</dd></div>
            </dl>
          </section>


          <BookingInlineActions lead={lead} />
        </div>

      </aside>
    </div>
  );
}

/* ── Component principal ────────────────────────────────────────────────── */

export default function AdminLeadsClient({ leads, initialMonth, year }: {
  leads: LeadData[];
  initialMonth: number;
  year: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('calendari');
  const [monthStart, setMonthStart] = useState(() => Math.min(initialMonth, MONTH_MAX_START));
  const [pageId, setPageId] = useState<string | null>(null);

  function openLead(l: { id: string; booking?: { id: string } | null }) {
    if (l.booking?.id) {
      router.push(buildBookingHref(l.booking.id));
    } else {
      router.push(buildLeadWorkspaceHref(l.id));
    }
  }
  const [optimisticStage, setOptimisticStage] = useState<Record<string, Stage>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [lostTarget, setLostTarget] = useState<{ leadId: string; previous: Stage } | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');
  const [lostSaving, setLostSaving] = useState(false);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<Stage | null>(null);

  const leadsSignature = leads.map((l) => `${l.id}:${l.stage}`).join('|');
  useEffect(() => { setOptimisticStage({}); setPendingId(null); }, [leadsSignature]);

  const effectiveLeads = useMemo<LeadData[]>(() => (
    leads.map((l) => optimisticStage[l.id] ? { ...l, stage: optimisticStage[l.id] } : l)
  ), [leads, optimisticStage]);
  const activeLead = pageId ? effectiveLeads.find((l) => l.id === pageId) ?? null : null;

  const visibleMonths = useMemo(() => Array.from({ length: MONTH_WINDOW }, (_, i) => monthStart + i), [monthStart]);
  const byDate = useMemo(() => { const m = new Map<string, LeadData>(); for (const l of effectiveLeads) if (l.dateISO) m.set(l.dateISO, l); return m; }, [effectiveLeads]);
  const months = useMemo<MonthBlock[]>(() => visibleMonths.map((vm) => {
    const { y, m } = toCalMonth(year, vm);
    const weekendSlots: WeekendSlot[] = saturdaysInMonth(y, m).map((sat) => ({
      type: 'weekend',
      friIso: shiftIso(sat, -1),
      days: [shiftIso(sat, -1), sat, shiftIso(sat, 1)].map((iso) => {
        const p = parseISO(iso);
        return { iso, d: p.d, inMonth: p.m === m && p.y === y, lead: byDate.get(iso) ?? null };
      }),
    }));
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const weekdaySlots: WeekdaySlot[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      if (dow >= 1 && dow <= 4) {
        const iso = isoDate(y, m, d);
        const lead = byDate.get(iso);
        if (lead) weekdaySlots.push({ type: 'weekday', iso, d, dow, lead });
      }
    }
    const slots: CalSlot[] = [...weekendSlots, ...weekdaySlots].sort((a, b) => {
      const aKey = a.type === 'weekend' ? a.friIso : a.iso;
      const bKey = b.type === 'weekend' ? b.friIso : b.iso;
      return aKey.localeCompare(bKey);
    });
    const displayY = toCalMonth(year, vm).y;
    return { m: vm, label: `${MONTHS_FULL[m - 1]} ${displayY}`, isFuture: displayY > year, slots };
  }), [byDate, visibleMonths, year]);

  async function commitMove(leadId: string, target: Stage, previous: Stage) {
    setPendingId(leadId);
    setOptimisticStage((s) => ({ ...s, [leadId]: target }));
    try {
      await patchLeadStatus({ leadId, status: STAGE_TO_STATUS[target as Exclude<Stage, 'perdut'>] });
      toast.success(`Mogut a ${STAGE_LABEL[target]}.`);
      if (target === 'guanyat') {
        const source = effectiveLeads.find((l) => l.id === leadId);
        if (!source?.booking) {
          router.push(`/admin/bookings/new?leadId=${encodeURIComponent(leadId)}`);
          return;
        }
      }
      router.refresh();
    } catch (err) {
      console.error('[admin/leads] drop move', err);
      toast.error(err instanceof Error ? err.message : "No s'ha pogut canviar l'estat.");
      setOptimisticStage((s) => { const next = { ...s }; next[leadId] = previous; return next; });
      setPendingId(null);
    }
  }

  function handleMoveLead(leadId: string, target: Stage) {
    const source = effectiveLeads.find((l) => l.id === leadId);
    if (!source) return;
    if (source.stage === target) return;
    if (source.kind !== 'lead' || source.realStatus === null) { toast.warning('Aquesta entrada no es pot canviar des del pipeline.'); return; }
    if (target === 'perdut') { setLostTarget({ leadId, previous: source.stage }); setLostReason(''); setLostNote(''); return; }
    void commitMove(leadId, target, source.stage);
  }

  async function confirmLost() {
    if (!lostTarget || !lostReason) return;
    setLostSaving(true);
    setOptimisticStage((s) => ({ ...s, [lostTarget.leadId]: 'perdut' }));
    setPendingId(lostTarget.leadId);
    try {
      await patchLeadStatus({ leadId: lostTarget.leadId, status: 'LOST', lostReason, note: lostNote || undefined });
      toast.success('Lead marcat com a perdut.');
      setLostTarget(null); setLostReason(''); setLostNote('');
      router.refresh();
    } catch (err) {
      console.error('[admin/leads] mark lost', err);
      toast.error(err instanceof Error ? err.message : "No s'ha pogut marcar com a perdut.");
      setOptimisticStage((s) => { const next = { ...s }; next[lostTarget.leadId] = lostTarget.previous; return next; });
      setPendingId(null);
    } finally {
      setLostSaving(false);
    }
  }

  const yearPage = Math.floor((monthStart - 1) / 12);
  const currentYear = year + yearPage;
  const m0 = toCalMonth(year, visibleMonths[0]).m;
  const mLast = toCalMonth(year, visibleMonths[visibleMonths.length - 1]);

  // Focus
  const focusQueue = useMemo(
    () => effectiveLeads
      .filter((l) => l.stage !== 'perdut')
      .slice()
      .sort((a, b) => {
        const priorityRank: Record<LeadPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const pa = priorityRank[a.priority] ?? 2;
        const pb = priorityRank[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        if (a.stage !== b.stage) {
          if (a.stage === 'nou') return -1;
          if (b.stage === 'nou') return 1;
        }
        return a.dateISO.localeCompare(b.dateISO);
      }),
    [effectiveLeads],
  );
  const [focusId, setFocusId] = useState(() => focusQueue[0]?.id ?? '');
  const focus = focusQueue.find((l) => l.id === focusId) ?? focusQueue[0] ?? null;
  const focusPos = focusQueue.findIndex((l) => l.id === focusId);
  function cycleFocus(dir: number) {
    if (!focusQueue.length) return;
    const base = focusPos < 0 ? 0 : focusPos;
    setFocusId(focusQueue[(base + dir + focusQueue.length) % focusQueue.length].id);
  }

  /* CANVAS — peces */
  return (
    <div className="fx-root is-contrast">

      {/* ── PEÇA 1: Capçalera ── */}
      <header className="fx__pagehead">
        <div className="fx__tt">
          <span className="fx__eyebrow">Temporada {currentYear}</span>
          <h1 className="fx__h1">Caps de setmana</h1>
        </div>
        <div className="fx__headright">
          <span className="fx__sub">
            {MONTHS_SHORT[m0 - 1]} – {MONTHS_SHORT[mLast.m - 1]} {mLast.y} · caps de setmana
          </span>
          <Link href="/admin/intake" className="fx__add"><span className="fx__addic">{I.plus}</span>Nova entrada</Link>
          <div className="fx__view" role="group" aria-label="Vista">
            <button type="button" className={viewMode === 'calendari' ? 'is-on' : ''} aria-pressed={viewMode === 'calendari'} onClick={() => setViewMode('calendari')}>Calendari</button>
            <button type="button" className={viewMode === 'pipeline'  ? 'is-on' : ''} aria-pressed={viewMode === 'pipeline'}  onClick={() => setViewMode('pipeline')}>Pipeline</button>
            <button type="button" className={viewMode === 'llista'    ? 'is-on' : ''} aria-pressed={viewMode === 'llista'}    onClick={() => setViewMode('llista')}>Llista</button>
          </div>
        </div>
      </header>

      {/* ── PEÇA 2: Zona Focus ── */}
      <div className="fx__focus" data-stage={focus?.stage ?? 'nou'}>
        {focus ? (
          <button type="button" className="fx__focusrow" onClick={() => setPageId(focus.id)}>
            <span className="fx__dot" data-stage={focus.stage} aria-hidden="true" />
            <span className="fx__focustext">
              <span className="fx__focusaction">{focusActionLabel(focus)}</span>
              <span className="fx__focusname">{focus.name}</span>
              <span className="fx__focusmeta">
                {focus.type}{focus.dateISO ? ` · ${fullDate(focus.dateISO)}` : ''}{focus.location ? ` · ${focus.location}` : ''}{focus.pax ? ` · ${focus.pax} pax` : ''}
              </span>
            </span>
            <span className="fx__focusval">{focus.value ? euro(focus.value) : '—'}</span>
          </button>
        ) : (
          <span className="fx__focusrow fx__focusrow--empty">
            <span className="fx__focustext">
              <span className="fx__focusname">Cap entrada activa</span>
              <span className="fx__focusmeta">No hi ha leads oberts per a la temporada actual.</span>
            </span>
          </span>
        )}
        <div className="fx__focuscycle">
          <button type="button" aria-label="Decisió anterior" onClick={() => cycleFocus(-1)}>{I.back}</button>
          <span>{focusPos < 0 ? '–' : focusPos + 1} / {focusQueue.length}</span>
          <button type="button" aria-label="Decisió següent" onClick={() => cycleFocus(1)}>{I.arrow}</button>
        </div>
      </div>

      {/* ── PEÇA 3: Mètriques ── */}
      {(() => {
        const totalValue  = effectiveLeads.reduce((s, l) => s + l.value, 0);
        const openValue   = effectiveLeads.filter((l) => l.stage === 'nou' || l.stage === 'contactat').reduce((s, l) => s + l.value, 0);
        const wonValue    = effectiveLeads.filter((l) => l.stage === 'guanyat').reduce((s, l) => s + l.value, 0);
        const activeCount = effectiveLeads.filter((l) => l.stage !== 'perdut').length;
        const wonCount    = effectiveLeads.filter((l) => l.stage === 'guanyat').length;
        return (
          <div className="fx__metrics" aria-label="Resum comercial">
            <div className="fx__metric">
              <span>Entrades</span>
              <b>{effectiveLeads.length} ({activeCount} actives)</b>
            </div>
            <div className="fx__metric">
              <span>Pipeline</span>
              <b>{euro(openValue)}</b>
            </div>
            <div className="fx__metric">
              <span>Guanyat</span>
              <b>{euro(wonValue)}</b>
            </div>
            <div className="fx__metric">
              <span>Temporada {currentYear}</span>
              <b>{euro(totalValue)}</b>
            </div>
          </div>
        );
      })()}
      {/* ── Safata: leads sense data — fora del scroll, sempre visible ── */}
      {viewMode === 'calendari' && (() => {
        const noDate = effectiveLeads.filter((l) => !l.dateISO && l.stage !== 'perdut');
        if (!noDate.length) return null;
        return (
          <div className="fx__nodate">
            <div className="fx__nodatehead">
              <span>Sense data assignada</span>
              <span className="fx__nodatecount">{noDate.length}</span>
            </div>
            <div className="fx__nodatelist">
              {noDate.map((l) => (
                <button key={l.id} type="button" className="fx__nodaterow" data-stage={l.stage}
                  onClick={() => setPageId(l.id)}>
                  <span className="fx__dot" data-stage={l.stage} aria-hidden="true" />
                  <span className="fx__nodatename">{l.name}</span>
                  <span className="fx__nodatemeta">{l.type}{l.pax ? ` · ${l.pax} pax` : ''}</span>
                  {l.value > 0 && <span className="fx__cval">{euro(l.value)}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── PEÇA 4: Contingut (calendari / pipeline / llista) ── */}
      <div className="fx__content">

        {/* ── Llegenda + barra de mesos (només calendari) ── */}
        {viewMode === 'calendari' && (
          <>
            <div className="fx__calbar">
              <button type="button" className="fx__calnav" onClick={() => setMonthStart((s) => Math.max(1, s - 1))} disabled={monthStart <= 1} aria-label="Mesos anteriors">{I.back}</button>
              <div className="fx__calmonths" role="group" aria-label="Selector de mesos">
                {Array.from({ length: 12 }, (_, i) => Math.floor((monthStart - 1) / 12) * 12 + i + 1).map((vm) => {
                  const { m } = toCalMonth(year, vm);
                  const on = visibleMonths.includes(vm);
                  return (
                    <button key={vm} type="button" className={`fx__calchip${on ? ' is-on' : ''}`} aria-pressed={on}
                      onClick={() => setMonthStart(Math.min(MONTH_MAX_START, Math.max(1, vm)))}>
                      {MONTHS_SHORT[m - 1]}
                    </button>
                  );
                })}
              </div>
              <button type="button" className="fx__calnav" onClick={() => setMonthStart((s) => Math.min(MONTH_MAX_START, s + 1))} disabled={monthStart >= MONTH_MAX_START} aria-label="Mesos següents">{I.arrow}</button>
            </div>

            {/* ── Grid de mesos ── */}
            <div className="fx__cal">
              {months.map((month) => {
                const monthLeads = month.slots.reduce((n, slot) => {
                  if (slot.type === 'weekend') return n + slot.days.filter((d) => d.lead && d.inMonth).length;
                  return n + 1;
                }, 0);
                return (
                  <article className={`fx__mon${month.isFuture ? ' is-future' : ''}`} key={month.m}>
                    <div className="fx__monhead">
                      <h2>{month.label}</h2>
                      <span className="fx__monmeta">
                        {month.isFuture && <span className="fx__futurebadge">⚠ Any futur</span>}
                        <span className="fx__moncount">{monthLeads} {monthLeads === 1 ? 'bolo' : 'bolos'}</span>
                      </span>
                    </div>
                    <div className="fx__weekhead">
                      <span className="fx__gh">Dv</span><span className="fx__gh">Ds</span><span className="fx__gh">Dg</span>
                    </div>
                    <div className="fx__grid">
                      {month.slots.map((slot) => {
                        if (slot.type === 'weekday') {
                          const l = slot.lead;
                          const pay = paymentState(l.booking);
                          const DOW_LABEL = ['Dg','Dl','Dt','Dc','Dj','Dv','Ds'];
                          return (
                            <button key={slot.iso} type="button"
                              className={`fx__cell fx__cell--wd is-lead${l.id === focusId ? ' is-active' : ''}${pay ? ' is-reserva' : ''}`}
                              data-stage={l.stage}
                              onClick={() => setPageId(l.id)}>
                              <span className="fx__celltop">
                                <span className="fx__day">{DOW_LABEL[slot.dow]} {slot.d}</span>
                                {l.value > 0 && <span className="fx__cval">{euro(l.value)}</span>}
                                <span className="fx__cellmeta">
                                  <WxBadge wx={l.wx} size="sm" />
                                  {pay && <span className="fx__pay" data-pay={pay} data-tip={PAY_TOOLTIP[pay]} />}
                                  <span className="fx__dot" data-stage={l.stage} data-tip={pay ? `Reserva · ${PAY_TOOLTIP[pay]}` : STAGE_TOOLTIP[l.stage]} />
                                </span>
                              </span>
                              <span className="fx__celltype">{pay ? 'Reserva' : l.type}</span>
                              <span className="fx__lname">{l.name}</span>
                              <span className="fx__cellfoot">
                                {l.time
                                  ? <>{l.time} · {l.location || '—'}</>
                                  : <><span className="fx__nohour">sense hora</span>{l.location ? ` · ${l.location}` : ''}</>
                                }
                              </span>
                            </button>
                          );
                        }
                        return slot.days.map((d) => {
                          const l = d.lead;
                          if (!l) return (
                            <span key={d.iso} className={`fx__cell is-free${d.inMonth ? '' : ' is-out'}`}>
                              <span className="fx__day">{d.d}</span>
                              <span className="fx__freelabel">Lliure</span>
                            </span>
                          );
                          const pay = paymentState(l.booking);
                          return (
                            <button key={d.iso} type="button"
                              className={`fx__cell is-lead${d.inMonth ? '' : ' is-out'}${l.id === focusId ? ' is-active' : ''}${pay ? ' is-reserva' : ''}`}
                              data-stage={l.stage}
                              onClick={() => setPageId(l.id)}>
                              <span className="fx__celltop">
                                <span className="fx__day">{d.d}</span>
                                {l.value > 0 && <span className="fx__cval">{euro(l.value)}</span>}
                                <span className="fx__cellmeta">
                                  <WxBadge wx={l.wx} size="sm" />
                                  {pay && <span className="fx__pay" data-pay={pay} data-tip={PAY_TOOLTIP[pay]} />}
                                  <span className="fx__dot" data-stage={l.stage} data-tip={pay ? `Reserva · ${PAY_TOOLTIP[pay]}` : STAGE_TOOLTIP[l.stage]} />
                                </span>
                              </span>
                              <span className="fx__celltype">{pay ? 'Reserva' : l.type}</span>
                              <span className="fx__lname">{l.name}</span>
                              <span className="fx__cellfoot">
                                {l.time
                                  ? <>{l.time} · {l.location || '—'}</>
                                  : <><span className="fx__nohour">sense hora</span>{l.location ? ` · ${l.location}` : ''}</>
                                }
                              </span>
                            </button>
                          );
                        });
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* ── PEÇA 5a: Pipeline ── */}
        {viewMode === 'pipeline' && (
          <div className="fx__pipeline">
            {PIPELINE_STAGES.map((stage) => {
              const laneLeads = effectiveLeads.filter((l) => l.stage === stage);
              const laneValue = laneLeads.reduce((sum, l) => sum + l.value, 0);
              return (
                <section
                  key={stage}
                  className={`fx__lane${dropStage === stage ? ' is-drop' : ''}`}
                  data-stage={stage}
                  onDragOver={(e) => { if (dragLeadId) { e.preventDefault(); if (dropStage !== stage) setDropStage(stage); } }}
                  onDragLeave={(e) => { if (e.currentTarget === e.target) setDropStage((c) => c === stage ? null : c); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = dragLeadId;
                    setDragLeadId(null); setDropStage(null);
                    if (id) handleMoveLead(id, stage);
                  }}
                >
                  <div className="fx__lanehead">
                    <div className="fx__lanetitle">
                      <h2>{STAGE_LABEL[stage]}</h2>
                      <small>{laneValue ? euro(laneValue) : '—'}</small>
                    </div>
                    <span>{laneLeads.length}</span>
                  </div>
                  <div className="fx__lanecards">
                    {laneLeads.length === 0 && (
                      stage === 'nou' ? (
                        <Link href="/admin/intake" className="fx__laneempty fx__laneempty--cta">
                          <span className="fx__laneemptyic">{I.plus}</span>
                          <span className="fx__laneemptytx">Cap lead nou</span>
                          <span className="fx__laneemptysub">Afegeix una entrada</span>
                        </Link>
                      ) : (
                        <span className="fx__laneempty">
                          <span className="fx__laneemptytx">
                            {stage === 'guanyat' ? 'Cap bolo tancat encara' : stage === 'perdut' ? 'Res perdut' : 'Res en seguiment'}
                          </span>
                        </span>
                      )
                    )}
                    {laneLeads.map((l) => {
                    const draggable = l.kind === 'lead' && l.realStatus !== null;
                    const pay = paymentState(l.booking);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        className={`fx__pipelead${l.id === focusId ? ' is-active' : ''}${dragLeadId === l.id ? ' is-dragging' : ''}${pendingId === l.id ? ' is-pending' : ''}`}
                        data-stage={l.stage}
                        data-priority={l.priority}
                        draggable={draggable && pendingId !== l.id}
                        onDragStart={(e) => {
                          if (!draggable) { e.preventDefault(); return; }
                          setDragLeadId(l.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => { setDragLeadId(null); setDropStage(null); }}
                        onClick={() => setPageId(l.id)}
                      >
                        <span className="fx__leadkicker">{l.type}{(l.priority === 'URGENT' || l.priority === 'HIGH') && <span className="fx__pri" data-pri={l.priority}>{l.priority === 'URGENT' ? '⚡' : '↑'}</span>}</span>
                        <span className="fx__leadtop">
                          <b>{pay && <span className="fx__pay" data-pay={pay} data-tip={PAY_TOOLTIP[pay]} />}{l.name}</b>
                          <strong>{l.value ? euro(l.value) : '—'}</strong>
                        </span>
                        {pay && <span className="fx__paylabel" data-pay={pay}>{PAY_LABEL[pay]}</span>}
                        <span className="fx__leadwhen">{l.dateISO ? fullDate(l.dateISO) : '—'}{l.location ? ` · ${l.location}` : ''}</span>
                        <span className="fx__leadmeta">
                          {l.pax ? `${l.pax} pax` : 'Pax pendent'}{l.product ? ` · ${l.product}` : ''}{l.last ? ` · ${l.last}` : ''}
                        </span>
                      </button>
                    );
                  })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ── PEÇA 5b: Llista ── */}
        {viewMode === 'llista' && (() => {
          const sorted = [...effectiveLeads.filter((l) => l.dateISO), ...effectiveLeads.filter((l) => !l.dateISO)].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
          if (!sorted.length) return <p className="fx__placeholder">No hi ha entrades per a la temporada.</p>;
          return (
            <div className="fx__list">
              <table className="fx__listtbl">
                <thead><tr>
                  <th scope="col">Data</th>
                  <th scope="col">Bolo</th>
                  <th scope="col">Tipus</th>
                  <th scope="col">Lloc</th>
                  <th scope="col">Fase</th>
                  <th scope="col" className="fx__listnum">Valor</th>
                </tr></thead>
                <tbody>
                  {sorted.map((l) => {
                    const pay = paymentState(l.booking);
                    const phase = pay ? (pay === 'full' ? 'Pagada' : pay === 'part' ? 'Senyal' : 'Pendent') : STAGE_LABEL[l.stage];
                    return (
                      <tr key={l.id} className="fx__listrow" data-stage={l.stage}
                        onClick={() => setPageId(l.id)} tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPageId(l.id); } }}>
                        <td className="fx__listdate">{l.dateISO ? fullDate(l.dateISO) : <em>sense data</em>}</td>
                        <td className="fx__listname"><span className="fx__dot" data-stage={l.stage} />{pay && <span className="fx__pay" data-pay={pay} />}{l.name}</td>
                        <td>{l.type}</td>
                        <td>{l.location || '—'}</td>
                        <td className="fx__listphase" data-pay={pay ?? undefined}>{pay && <span className="fx__pay" data-pay={pay} />}{phase}</td>
                        <td className="fx__listnum">{l.value ? euro(l.value) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

      </div>

      {activeLead && (
        <LeadDetailPanel
          lead={activeLead}
          pending={pendingId === activeLead.id}
          onClose={() => setPageId(null)}
          onMoveLead={handleMoveLead}
        />
      )}

      {lostTarget && (
        <div className="fx__lostmodal" role="dialog" aria-modal="true" aria-label="Marcar lead com a perdut">
          <div className="fx__lostmodal-card">
            <h2 className="fx__lostmodal-h">Marcar com a perdut</h2>
            <LeadLostStatusPrompt
              open={true}
              lostReason={lostReason}
              note={lostNote}
              saving={lostSaving}
              title="Selecciona el motiu canònic abans de marcar aquest lead com a perdut."
              onLostReasonChange={setLostReason}
              onNoteChange={setLostNote}
              onCancel={() => { if (!lostSaving) { setLostTarget(null); setLostReason(''); setLostNote(''); } }}
              onConfirm={() => { void confirmLost(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
