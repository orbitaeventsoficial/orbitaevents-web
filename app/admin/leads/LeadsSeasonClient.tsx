'use client';

// ─────────────────────────────────────────────────────────
// ✅ TANCAT CHARLIE — validat pel propietari (2026-06-08)
// Calendari de leads (Agenda). Patró de referència. A prop de
// final (no 100%). La resta de pàgines s'ha de construir fidel
// a aquest model. Poliment pendent: docs/calendar-polish-pending.md
// ─────────────────────────────────────────────────────────

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
import { formatCurrency, formatNumber, LEAD_SCORING_STATUS_PROBABILITY, OPEN_PIPELINE_STATUSES } from '@/lib/constants';
import { buildWazeUrl, buildEventLogistics } from '@/lib/admin/eventLogistics';
import LeadLostStatusPrompt from './LeadLostStatusPrompt';
import { patchLeadStatus, type LeadStatus } from './leadStatusClient';
import { buildLeadWhatsAppHref } from './leadWhatsApp';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';
import { getPaymentBand } from '@/lib/payment-status';
import { calculateClientTravelCharge, deriveTravelHeadcount } from '@/lib/services/travelLaborCost';

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
  distanceKm: number | null;
  serviceLines: {
    id: string;
    label: string;
    revenueAmount: number | null;
    costAmount: number | null;
    quantity: number | null;
    hours: number | null;
    notes: string | null;
  }[];
  booking: {
    id: string;
    reference: string;
    status: string;
    depositPaid: boolean;
    remainingPaid: boolean;
    distanceKm: number | null;
  } | null;
  wx: WxData;
};

type PayState = 'full' | 'part' | 'none';
function paymentState(booking: LeadData['booking']): PayState | null {
  if (!booking) return null;
  const band = getPaymentBand(booking.depositPaid, booking.remainingPaid);
  return band === 'paid' ? 'full' : band === 'partial' ? 'part' : 'none';
}
type Stage = LeadData['stage'];
type ViewMode = 'calendari' | 'pipeline' | 'llista';

// Valor ponderat d'un lead obert = estimatedValue × probabilitat canònica de l'estat
// (LEAD_SCORING_STATUS_PROBABILITY, la mateixa font que buildPipelineForecast al dashboard).
// Tancats (WON) i descartats (LOST) no compten al forecast d'oberts → 0.
function weightedLeadValue(lead: LeadData): number {
  const status = lead.realStatus;
  if (!status || !(OPEN_PIPELINE_STATUSES as readonly string[]).includes(status)) return 0;
  return Math.round(lead.value * (LEAD_SCORING_STATUS_PROBABILITY[status] ?? 0));
}

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
  part: 'Pagament parcial registrat',
  none: 'Reserva sense cap pagament',
};
const PAY_LABEL: Record<PayState, string> = {
  full: 'Pagada',
  part: 'Pagament parcial',
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
function minutesLabel(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}
function isTravelCostLine(line: { notes?: string | null }): boolean {
  return Boolean(line.notes?.includes('[travel-cost]'));
}
function contractedLines(lead: LeadData): LeadData['serviceLines'] {
  return lead.serviceLines.filter((line) => !isTravelCostLine(line));
}
function lineAmount(line: LeadData['serviceLines'][number]): number | null {
  const unit = typeof line.revenueAmount === 'number' ? line.revenueAmount : null;
  if (unit === null) return null;
  return unit * (line.quantity || 1);
}
function leadDisplayValue(lead: LeadData): number {
  if (lead.value > 0) return lead.value;
  return contractedLines(lead).reduce((sum, line) => sum + (lineAmount(line) ?? 0), 0);
}
function serviceLineMeta(line: LeadData['serviceLines'][number]): string {
  const bits: string[] = [];
  if (line.quantity && line.quantity > 1) bits.push(`x${line.quantity}`);
  if (line.hours && line.hours > 0) bits.push(`${formatNumber(line.hours, { maximumFractionDigits: 1 })} h`);
  const amount = lineAmount(line);
  if (amount !== null && amount > 0) bits.push(formatCurrency(amount));
  return bits.join(' · ');
}
function contractedSummary(lead: LeadData): string {
  const lines = contractedLines(lead);
  if (lines.length === 0) return lead.product || lead.type || 'Contractació pendent';
  const [first, second] = lines;
  if (!second) return first.label;
  return `${first.label} + ${lines.length - 1} més`;
}
function meaningfulLeadType(type: string): string | null {
  const value = type.trim();
  if (!value || value.toLowerCase() === 'altre') return null;
  return value;
}
function meaningfulLeadChannel(channel: string): string | null {
  const value = channel.trim();
  if (!value || value.toLowerCase() === 'altre') return null;
  return value;
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
function lostReasonLabel(reason: string | null): string | null {
  return isLeadLostReason(reason) ? LEAD_LOST_REASON_LABELS[reason] : null;
}

function leadCellFoot(lead: LeadData): ReactNode {
  if (lead.time) return <>{lead.time} · {lead.location || '—'}</>;
  return <><span className="ap-leads-nohour">sense hora</span>{lead.location ? ` · ${lead.location}` : ''}</>;
}

function LeadDayCell({
  dayLabel,
  leads,
  inMonth = true,
  focusId,
  onOpen,
  weekday,
}: {
  dayLabel: string;
  leads: LeadData[];
  inMonth?: boolean;
  focusId: string | null;
  onOpen: (id: string) => void;
  weekday?: boolean;
}) {
  const firstLead = leads[0];
  if (!firstLead) {
    return (
      <span className={`ap-leads-cell is-free${inMonth ? '' : ' is-out'}`}>
        <span className="ap-leads-day">{dayLabel}</span>
        <span className="ap-leads-freelabel">Lliure</span>
      </span>
    );
  }

  if (leads.length === 1) {
    const pay = paymentState(firstLead.booking);
    return (
      <button
        type="button"
        className={`ap-leads-cell${weekday ? ' ap-leads-cell--wd' : ''} is-lead${inMonth ? '' : ' is-out'}${firstLead.id === focusId ? ' is-active' : ''}${pay ? ' is-reserva' : ''}`}
        data-stage={firstLead.stage}
        onClick={() => onOpen(firstLead.id)}
      >
        <span className="ap-leads-celltop">
          <span className="ap-leads-day">{dayLabel}</span>
          {firstLead.value > 0 && <span className="ap-leads-cval">{formatCurrency(firstLead.value)}</span>}
          <span className="ap-leads-cellmeta">
            <WxBadge wx={firstLead.wx} size="sm" />
            {pay && <span className="ap-leads-pay" data-pay={pay} data-tip={PAY_TOOLTIP[pay]} />}
            <span className="ap-leads-dot" data-stage={firstLead.stage} data-tip={pay ? `Reserva · ${PAY_TOOLTIP[pay]}` : STAGE_TOOLTIP[firstLead.stage]} />
          </span>
        </span>
        <span className="ap-leads-celltype">{pay ? 'Reserva' : firstLead.type}</span>
        <span className="ap-leads-lname">{firstLead.name}</span>
        <span className="ap-leads-cellfoot">{leadCellFoot(firstLead)}</span>
      </button>
    );
  }

  const active = leads.some((lead) => lead.id === focusId);
  const hasReservation = leads.some((lead) => paymentState(lead.booking));

  return (
    <div
      className={`ap-leads-cell${weekday ? ' ap-leads-cell--wd' : ''} ap-leads-cell--multi is-lead${inMonth ? '' : ' is-out'}${active ? ' is-active' : ''}${hasReservation ? ' is-reserva' : ''}`}
      data-stage={firstLead.stage}
    >
      <span className="ap-leads-multiday">
        <span className="ap-leads-day">{dayLabel}</span>
        <span className="ap-leads-multicount">{leads.length} bolos</span>
      </span>
      <span className="ap-leads-multiparts">
        {leads.map((lead) => {
          const pay = paymentState(lead.booking);
          return (
            <button
              key={lead.id}
              type="button"
              className={`ap-leads-cellpart${lead.id === focusId ? ' is-active' : ''}`}
              data-stage={lead.stage}
              onClick={() => onOpen(lead.id)}
            >
              <span className="ap-leads-partmain">
                <span className="ap-leads-lname">{lead.name}</span>
                <span className="ap-leads-cellmeta">
                  <WxBadge wx={lead.wx} size="sm" />
                  {pay && <span className="ap-leads-pay" data-pay={pay} data-tip={PAY_TOOLTIP[pay]} />}
                  <span className="ap-leads-dot" data-stage={lead.stage} data-tip={pay ? `Reserva · ${PAY_TOOLTIP[pay]}` : STAGE_TOOLTIP[lead.stage]} />
                </span>
              </span>
              <span className="ap-leads-cellfoot">{leadCellFoot(lead)}</span>
            </button>
          );
        })}
      </span>
    </div>
  );
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

type WeekendSlot = { type: 'weekend'; friIso: string; days: { iso: string; d: number; inMonth: boolean; leads: LeadData[] }[] };
type WeekdaySlot = { type: 'weekday'; iso: string; d: number; dow: number; leads: LeadData[] };
type CalSlot = WeekendSlot | WeekdaySlot;
type MonthBlock = {
  m: number; label: string; isFuture: boolean;
  slots: CalSlot[];
};

function BookingInlineActions({ lead }: { lead: LeadData }) {
  const booking = lead.booking;
  if (!booking) return null;
  const pay = paymentState(booking);

  // Els cobraments NO es gestionen al lead: la reserva n'és la font de veritat
  // (doctrina canònica, vegeu docs/fitxes-tipus.md i docs/bolo-flux.md). El drawer
  // només mostra l'estat i obre la reserva.
  return (
    <section className="ap-ledger-panel ap-ledger-panel--booking">
      <div className="ap-ledger-panelhead">
        <span>Reserva</span>
        <strong>{booking.reference}</strong>
      </div>
      <div className="ap-ledger-bookingstate">
        {pay && <span className="ap-leads-pay" data-pay={pay} />}
        <span>{pay ? PAY_LABEL[pay] : 'Reserva vinculada'}</span>
      </div>
      <div className="ap-ledger-actions">
        <Link href={buildBookingHref(booking.id)} className="ap-btn--xs">Obrir reserva</Link>
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
  const lines = contractedLines(lead);
  const distanceKm = lead.booking?.distanceKm ?? lead.distanceKm;
  const displayValue = leadDisplayValue(lead);
  // Càrrec de transport al client (#1363): cost real dues potes (cotxe/km + gent/hores).
  const travelCharge = distanceKm ? calculateClientTravelCharge(distanceKm, deriveTravelHeadcount(lines)) : 0;
  const clientTotal = displayValue + travelCharge;
  const oneWayDistanceKm = distanceKm ? distanceKm / 2 : null;
  const logistics = buildEventLogistics({
    phone: lead.phone,
    address: lead.location,
    distanceKm: oneWayDistanceKm,
    eventStartTime: lead.time || null,
  });
  const roundTripTravelMinutes = logistics.travelMinutes > 0 ? logistics.travelMinutes * 2 : 0;
  const routeHours = roundTripTravelMinutes > 0
    ? formatNumber(roundTripTravelMinutes / 60, { maximumFractionDigits: 1 })
    : null;
  const typeLabel = meaningfulLeadType(lead.type);
  const channelLabel = meaningfulLeadChannel(lead.channel);

  return (
    <div className="fxd" data-stage={lead.stage} role="dialog" aria-modal="true" aria-label={`Fitxa de ${lead.name}`}>
      <div className="ap-ledger-shade" onClick={onClose} />
      <aside className="ap-ledger-sheet">
        <header className="ap-ledger-bar">
          <button type="button" className="ap-ledger-back" onClick={onClose}><span>{I.back}</span>Torna</button>
          <Link href={buildLeadWorkspaceHref(lead.id)} className="ap-ledger-full">Fitxa completa</Link>
          <button type="button" className="ap-ledger-close" aria-label="Tancar fitxa" onClick={onClose}>{I.close}</button>
        </header>

        <section className="ap-ledger-hero">
          <div className="ap-ledger-hero-main">
            <h2>{lead.name}</h2>
            <span className="ap-ledger-kicker ap-ledger-kicker--stage">
              {editable ? (
                <span className="ap-ledger-stage-selectwrap">
                  <select
                    className="ap-ledger-stage-select"
                    aria-label="Canviar fase del lead"
                    value={lead.stage}
                    disabled={pending}
                    onChange={(event) => onMoveLead(lead.id, event.target.value as Stage)}
                  >
                    {PIPELINE_STAGES.map((stage) => (
                      <option key={stage} value={stage}>{STAGE_LABEL[stage]}</option>
                    ))}
                  </select>
                </span>
              ) : (
                <span>{STAGE_LABEL[lead.stage]}</span>
              )}
            </span>
          </div>
          {typeLabel && <span className="ap-ledger-hero-meta">{typeLabel}</span>}
          {reason && <span className="ap-ledger-lost">{reason}</span>}
          {lead.wx.forecast && (
            <span className="ap-ledger-wxrow">
              <WxBadge wx={lead.wx} size="md" />
              {lead.dateISO && <span className="ap-ledger-wxdate">{fullDate(lead.dateISO)}</span>}
            </span>
          )}
        </section>

        <div className="ap-ledger-stats">
          <div><span>Total client</span><b>{clientTotal ? formatCurrency(clientTotal) : '—'}</b></div>
          <div><span>Contractat</span><b>{displayValue ? formatCurrency(displayValue) : '—'}</b></div>
          <div><span>Transport</span><b>{travelCharge ? formatCurrency(travelCharge) : 'Inclòs'}</b></div>
        </div>
        <div className="ap-ledger-ops" aria-label="Resum operatiu del lead">
          <div>
            <span>Horari</span>
            <strong>{lead.time ? `${lead.time}${lead.endTime ? `-${lead.endTime}` : ''}` : 'Pendent'}</strong>
            <em>{durationLabel(lead.time, lead.endTime)}</em>
          </div>
          <div>
            <span>Lloc</span>
            <strong>{lead.location || 'Pendent'}</strong>
            {buildWazeUrl(lead.location) && <em>Navegació preparada</em>}
          </div>
          <div>
            <span>Contractat</span>
            <strong>{contractedSummary(lead)}</strong>
            <em>{lines.length ? `${lines.length} ${lines.length === 1 ? 'línia' : 'línies'} de bolo` : 'pendent de tancar'}</em>
          </div>
          <div>
            <span>Ruta</span>
            <strong>{distanceKm ? `${formatNumber(distanceKm, { maximumFractionDigits: 0 })} km` : 'Sense km'}</strong>
            <em>{routeHours ? `${routeHours} h anada/tornada` : 'cal calcular distància'}</em>
          </div>
        </div>
        <div className="ap-ledger-grid ap-ledger-grid--drawer">
          <section className="ap-ledger-panel ap-ledger-panel--contracted">
            <div className="ap-ledger-panelhead"><span>Contractat</span></div>
            {lines.length > 0 ? (
              <div className="ap-ledger-contract-list">
                {lines.slice(0, 4).map((line) => (
                  <div key={line.id} className="ap-ledger-contract-row">
                    <span>{line.label}</span>
                    <strong>{serviceLineMeta(line) || 'Inclòs'}</strong>
                  </div>
                ))}
                {lines.length > 4 && <p className="ap-ledger-contract-more">+{lines.length - 4} línies més a la fitxa completa</p>}
              </div>
            ) : (
              <p className="ap-ledger-summary">Encara no hi ha línies de bolo desades. Obre la fitxa completa per configurar producte, tècnic i transport.</p>
            )}
          </section>

          <section className="ap-ledger-panel ap-ledger-panel--ops-detail">
            <div className="ap-ledger-panelhead"><span>Operativa</span></div>
            <dl className="ap-ledger-rows ap-ledger-rows--event">
              <div><dt>Data</dt><dd>{lead.dateISO ? fullDate(lead.dateISO) : '—'}</dd></div>
              <div><dt>Pax</dt><dd>{lead.pax || '—'}</dd></div>
              <div><dt>Muntatge</dt><dd>{minutesLabel(logistics.setupMinutes)}</dd></div>
              <div><dt>Navegació</dt><dd>{buildWazeUrl(lead.location) ? <a href={buildWazeUrl(lead.location)!} target="_blank" rel="noopener noreferrer" className="ap-ledger-navlink">Waze</a> : '—'}</dd></div>
              {(() => {
                if (!logistics.departureTime || logistics.travelMinutes === 0) return null;
                return (
                  <div className="ap-ledger-row--long">
                    <dt>Sortida</dt>
                    <dd>
                      <span className="ap-ledger-departtime">{logistics.departureTime}</span>
                      <span className="ap-ledger-departhint"> · {minutesLabel(logistics.travelMinutes)} anada + {minutesLabel(logistics.setupMinutes)} de muntatge</span>
                    </dd>
                  </div>
                );
              })()}
            </dl>
          </section>

          <section className="ap-ledger-panel ap-ledger-panel--contact">
            <div className="ap-ledger-panelhead"><span>Contacte</span></div>
            <dl className="ap-ledger-rows ap-ledger-rows--contact">
              <div><dt>Telèfon</dt><dd>{lead.phone || '—'}</dd></div>
              <div><dt>Email</dt><dd>{lead.email || '—'}</dd></div>
              {channelLabel && <div><dt>Canal</dt><dd>{channelLabel}</dd></div>}
              <div><dt>Últim contacte</dt><dd>{lead.last || '—'}</dd></div>
            </dl>
            <div className="ap-ledger-actions ap-ledger-actions--contact">
              {(() => {
                const waHref = buildLeadWhatsAppHref(lead.phone, lead.name);
                return waHref ? (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="ap-btn ap-ledger-btn--whatsapp">
                    <span>{I.phone}</span>WhatsApp
                  </a>
                ) : (
                  <button type="button" className="ap-btn" disabled><span>{I.phone}</span>Sense telèfon</button>
                );
              })()}
              {lead.kind === 'lead' && (
                <Link href={buildLeadComposeHref(lead.id, 'seguiment')} className="ap-btn ap-ledger-btn--mail">
                  <span>{I.mail}</span>Correu
                </Link>
              )}
            </div>
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
  const byDate = useMemo(() => {
    const m = new Map<string, LeadData[]>();
    for (const l of effectiveLeads) {
      if (!l.dateISO) continue;
      const dayLeads = m.get(l.dateISO) ?? [];
      dayLeads.push(l);
      m.set(l.dateISO, dayLeads);
    }
    for (const dayLeads of m.values()) {
      dayLeads.sort((a, b) => {
        const aTime = a.time || '99:99';
        const bTime = b.time || '99:99';
        if (aTime !== bTime) return aTime.localeCompare(bTime);
        return a.name.localeCompare(b.name);
      });
    }
    return m;
  }, [effectiveLeads]);
  const months = useMemo<MonthBlock[]>(() => visibleMonths.map((vm) => {
    const { y, m } = toCalMonth(year, vm);
    const weekendSlots: WeekendSlot[] = saturdaysInMonth(y, m).map((sat) => ({
      type: 'weekend',
      friIso: shiftIso(sat, -1),
      days: [shiftIso(sat, -1), sat, shiftIso(sat, 1)].map((iso) => {
        const p = parseISO(iso);
        return { iso, d: p.d, inMonth: p.m === m && p.y === y, leads: byDate.get(iso) ?? [] };
      }),
    }));
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const weekdaySlots: WeekdaySlot[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      if (dow >= 1 && dow <= 4) {
        const iso = isoDate(y, m, d);
        const leadsForDay = byDate.get(iso) ?? [];
        if (leadsForDay.length > 0) weekdaySlots.push({ type: 'weekday', iso, d, dow, leads: leadsForDay });
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
      <header className="ap-leads-pagehead">
        <div className="ap-leads-tt">
          <span className="ap-leads-eyebrow">Temporada {currentYear}</span>
          <h1 className="ap-leads-h1">Caps de setmana <span className="ap-leads-charlie" title="Validat pel propietari — patró de referència">✓ TANCAT CHARLIE</span></h1>
        </div>
        <div className="ap-leads-headright">
          <span className="ap-leads-sub">
            {MONTHS_SHORT[m0 - 1]} – {MONTHS_SHORT[mLast.m - 1]} {mLast.y} · caps de setmana
          </span>
          <Link href="/admin/intake" className="ap-leads-add"><span className="ap-leads-addic">{I.plus}</span>Nova entrada</Link>
          <div className="ap-tab" role="group" aria-label="Vista">
            <button type="button" className={viewMode === 'calendari' ? 'is-on' : ''} aria-pressed={viewMode === 'calendari'} onClick={() => setViewMode('calendari')}>Calendari</button>
            <button type="button" className={viewMode === 'pipeline'  ? 'is-on' : ''} aria-pressed={viewMode === 'pipeline'}  onClick={() => setViewMode('pipeline')}>Pipeline</button>
            <button type="button" className={viewMode === 'llista'    ? 'is-on' : ''} aria-pressed={viewMode === 'llista'}    onClick={() => setViewMode('llista')}>Llista</button>
          </div>
        </div>
      </header>

      {/* ── PEÇA 2: Zona Focus ── */}
      <div className="ap-leads-focus" data-stage={focus?.stage ?? 'nou'}>
        {focus ? (
          <button type="button" className="ap-leads-focusrow" onClick={() => setPageId(focus.id)}>
            <span className="ap-leads-dot" data-stage={focus.stage} aria-hidden="true" />
            <span className="ap-leads-focustext">
              <span className="ap-leads-focusaction">{focusActionLabel(focus)}</span>
              <span className="ap-leads-focusname">{focus.name}</span>
              <span className="ap-leads-focusmeta">
                {focus.type}{focus.dateISO ? ` · ${fullDate(focus.dateISO)}` : ''}{focus.location ? ` · ${focus.location}` : ''}{focus.pax ? ` · ${focus.pax} pax` : ''}
              </span>
            </span>
            <span className="ap-leads-focusval">{focus.value ? formatCurrency(focus.value) : '—'}</span>
          </button>
        ) : (
          <span className="ap-leads-focusrow ap-leads-focusrow--empty">
            <span className="ap-leads-focustext">
              <span className="ap-leads-focusname">Cap entrada activa</span>
              <span className="ap-leads-focusmeta">No hi ha leads oberts per a la temporada actual.</span>
            </span>
          </span>
        )}
        <div className="ap-leads-focuscycle">
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
        // Forecast ponderat: valor × probabilitat de tancament (constant canònica, la mateixa
        // que alimenta buildPipelineForecast al dashboard) dels leads encara oberts.
        const openForecast = effectiveLeads.reduce((s, l) => s + weightedLeadValue(l), 0);
        const activeCount = effectiveLeads.filter((l) => l.stage !== 'perdut').length;
        return (
          <div className="ap-leads-metrics" aria-label="Resum comercial">
            <div className="ap-leads-metric">
              <span>Entrades</span>
              <b>{effectiveLeads.length} ({activeCount} actives)</b>
            </div>
            <div className="ap-leads-metric">
              <span>Pipeline</span>
              <b>{formatCurrency(openValue)}</b>
            </div>
            <div className="ap-leads-metric" title="Suma del valor × probabilitat de tancament dels leads oberts">
              <span>Forecast ponderat</span>
              <b className="ap-leads-metric-forecast">{formatCurrency(openForecast)}</b>
            </div>
            <div className="ap-leads-metric">
              <span>Guanyat</span>
              <b>{formatCurrency(wonValue)}</b>
            </div>
            <div className="ap-leads-metric">
              <span>Temporada {currentYear}</span>
              <b>{formatCurrency(totalValue)}</b>
            </div>
          </div>
        );
      })()}
      {/* ── Safata: leads sense data — fora del scroll, sempre visible ── */}
      {viewMode === 'calendari' && (() => {
        const noDate = effectiveLeads.filter((l) => !l.dateISO && l.stage !== 'perdut');
        if (!noDate.length) return null;
        return (
          <div className="ap-leads-nodate">
            <div className="ap-leads-nodatehead">
              <span>Sense data assignada</span>
              <span className="ap-leads-nodatecount">{noDate.length}</span>
            </div>
            <div className="ap-leads-nodatelist">
              {noDate.map((l) => (
                <button key={l.id} type="button" className="ap-leads-nodaterow" data-stage={l.stage}
                  onClick={() => setPageId(l.id)}>
                  <span className="ap-leads-dot" data-stage={l.stage} aria-hidden="true" />
                  <span className="ap-leads-nodatename">{l.name}</span>
                  <span className="ap-leads-nodatemeta">{l.type}{l.pax ? ` · ${l.pax} pax` : ''}</span>
                  {l.value > 0 && <span className="ap-leads-cval">{formatCurrency(l.value)}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── PEÇA 4: Contingut (calendari / pipeline / llista) ── */}
      <div className="ap-leads-content">

        {/* ── Llegenda + barra de mesos (només calendari) ── */}
        {viewMode === 'calendari' && (
          <>
            <div className="ap-leads-calbar">
              <button type="button" className="ap-leads-calnav" onClick={() => setMonthStart((s) => Math.max(1, s - 1))} disabled={monthStart <= 1} aria-label="Mesos anteriors">{I.back}</button>
              <div className="ap-leads-calmonths" role="group" aria-label="Selector de mesos">
                {Array.from({ length: 12 }, (_, i) => Math.floor((monthStart - 1) / 12) * 12 + i + 1).map((vm) => {
                  const { m } = toCalMonth(year, vm);
                  const on = visibleMonths.includes(vm);
                  return (
                    <button key={vm} type="button" className={`ap-leads-calchip${on ? ' is-on' : ''}`} aria-pressed={on}
                      onClick={() => setMonthStart(Math.min(MONTH_MAX_START, Math.max(1, vm)))}>
                      {MONTHS_SHORT[m - 1]}
                    </button>
                  );
                })}
              </div>
              <button type="button" className="ap-leads-calnav" onClick={() => setMonthStart((s) => Math.min(MONTH_MAX_START, s + 1))} disabled={monthStart >= MONTH_MAX_START} aria-label="Mesos següents">{I.arrow}</button>
            </div>

            {/* ── Empty state global: cap lead a tota la temporada ── */}
            {effectiveLeads.length === 0 && (
              <div className="ap-leads-calempty" role="status">
                <span className="ap-leads-calempty-tx">Cap entrada aquesta temporada</span>
                <span className="ap-leads-calempty-sub">Quan entri un lead apareixerà al cap de setmana corresponent.</span>
                <Link href="/admin/intake" className="ap-leads-add"><span className="ap-leads-addic">{I.plus}</span>Nova entrada</Link>
              </div>
            )}

            {/* ── Grid de mesos ── */}
            <div className="ap-leads-cal">
              {months.map((month) => {
                const monthLeads = month.slots.reduce((n, slot) => {
                  if (slot.type === 'weekend') return n + slot.days.reduce((sum, d) => sum + (d.inMonth ? d.leads.length : 0), 0);
                  return n + slot.leads.length;
                }, 0);
                return (
                  <article className={`ap-leads-mon${month.isFuture ? ' is-future' : ''}`} key={month.m}>
                    <div className="ap-leads-monhead">
                      <h2>{month.label}</h2>
                      <span className="ap-leads-monmeta">
                        {month.isFuture && <span className="ap-leads-futurebadge">⚠ Any futur</span>}
                        <span className="ap-leads-moncount">{monthLeads} {monthLeads === 1 ? 'bolo' : 'bolos'}</span>
                      </span>
                    </div>
                    <div className="ap-leads-weekhead">
                      <span className="ap-leads-gh">Dv</span><span className="ap-leads-gh">Ds</span><span className="ap-leads-gh">Dg</span>
                    </div>
                    <div className="ap-leads-grid">
                      {month.slots.map((slot) => {
                        if (slot.type === 'weekday') {
                          const DOW_LABEL = ['Dg','Dl','Dt','Dc','Dj','Dv','Ds'];
                          return (
                            <LeadDayCell
                              key={slot.iso}
                              dayLabel={`${DOW_LABEL[slot.dow]} ${slot.d}`}
                              leads={slot.leads}
                              focusId={focusId}
                              onOpen={setPageId}
                              weekday
                            />
                          );
                        }
                        return slot.days.map((d) => {
                          return (
                            <LeadDayCell
                              key={d.iso}
                              dayLabel={String(d.d)}
                              leads={d.leads}
                              inMonth={d.inMonth}
                              focusId={focusId}
                              onOpen={setPageId}
                            />
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
          <div className="ap-leads-pipeline">
            {PIPELINE_STAGES.map((stage) => {
              const laneLeads = effectiveLeads.filter((l) => l.stage === stage);
              const laneValue = laneLeads.reduce((sum, l) => sum + l.value, 0);
              const laneForecast = laneLeads.reduce((sum, l) => sum + weightedLeadValue(l), 0);
              return (
                <section
                  key={stage}
                  className={`ap-leads-lane${dropStage === stage ? ' is-drop' : ''}`}
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
                  <div className="ap-leads-lanehead">
                    <div className="ap-leads-lanetitle">
                      <h2>{STAGE_LABEL[stage]}</h2>
                      <small>{laneValue ? formatCurrency(laneValue) : '—'}</small>
                      {laneForecast > 0 && (
                        <small className="ap-leads-lane-forecast" title="Valor ponderat per probabilitat de tancament">
                          ≈ {formatCurrency(laneForecast)}
                        </small>
                      )}
                    </div>
                    <span>{laneLeads.length}</span>
                  </div>
                  <div className="ap-leads-lanecards">
                    {laneLeads.length === 0 && (
                      stage === 'nou' ? (
                        <Link href="/admin/intake" className="ap-leads-laneempty ap-leads-laneempty--cta">
                          <span className="ap-leads-laneemptyic">{I.plus}</span>
                          <span className="ap-leads-laneemptytx">Cap lead nou</span>
                          <span className="ap-leads-laneemptysub">Afegeix una entrada</span>
                        </Link>
                      ) : (
                        <span className="ap-leads-laneempty">
                          <span className="ap-leads-laneemptytx">
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
                        className={`ap-leads-pipelead${l.id === focusId ? ' is-active' : ''}${dragLeadId === l.id ? ' is-dragging' : ''}${pendingId === l.id ? ' is-pending' : ''}`}
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
                        <span className="ap-leads-leadkicker">{l.type}{(l.priority === 'URGENT' || l.priority === 'HIGH') && <span className="ap-leads-pri" data-pri={l.priority}>{l.priority === 'URGENT' ? '⚡' : '↑'}</span>}</span>
                        <span className="ap-leads-leadtop">
                          <b>{pay && <span className="ap-leads-pay" data-pay={pay} data-tip={PAY_TOOLTIP[pay]} />}{l.name}</b>
                          <strong>{l.value ? formatCurrency(l.value) : '—'}</strong>
                        </span>
                        {pay && <span className="ap-leads-paylabel" data-pay={pay}>{PAY_LABEL[pay]}</span>}
                        <span className="ap-leads-leadwhen">{l.dateISO ? fullDate(l.dateISO) : '—'}{l.location ? ` · ${l.location}` : ''}</span>
                        <span className="ap-leads-leadmeta">
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
          if (!sorted.length) return <p className="ap-leads-placeholder">No hi ha entrades per a la temporada.</p>;
          return (
            <div className="ap-leads-list">
              <table className="ap-leads-listtbl">
                <thead><tr>
                  <th scope="col">Data</th>
                  <th scope="col">Bolo</th>
                  <th scope="col">Tipus</th>
                  <th scope="col">Lloc</th>
                  <th scope="col">Fase</th>
                  <th scope="col" className="ap-leads-listnum">Valor</th>
                </tr></thead>
                <tbody>
                  {sorted.map((l) => {
                    const pay = paymentState(l.booking);
                    const phase = pay ? (pay === 'full' ? 'Pagada' : pay === 'part' ? 'Senyal' : 'Pendent') : STAGE_LABEL[l.stage];
                    return (
                      <tr key={l.id} className="ap-leads-listrow" data-stage={l.stage}
                        onClick={() => setPageId(l.id)} tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPageId(l.id); } }}>
                        <td className="ap-leads-listdate">{l.dateISO ? fullDate(l.dateISO) : <em>sense data</em>}</td>
                        <td className="ap-leads-listname"><span className="ap-leads-dot" data-stage={l.stage} />{pay && <span className="ap-leads-pay" data-pay={pay} />}{l.name}</td>
                        <td>{l.type}</td>
                        <td>{l.location || '—'}</td>
                        <td className="ap-leads-listphase" data-pay={pay ?? undefined}>{pay && <span className="ap-leads-pay" data-pay={pay} />}{phase}</td>
                        <td className="ap-leads-listnum">{l.value ? formatCurrency(l.value) : '—'}</td>
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
        <div className="ap-leads-lostmodal" role="dialog" aria-modal="true" aria-label="Marcar lead com a perdut">
          <div className="ap-leads-lostmodal-card">
            <h2 className="ap-leads-lostmodal-h">Marcar com a perdut</h2>
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
