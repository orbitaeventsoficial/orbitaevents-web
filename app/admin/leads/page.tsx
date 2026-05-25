'use client';

/* ============================================================================
   ÒRBITA ADMIN — Leads · Temporada (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Pàgina de leads migrada al nou sistema visual. Canvi #782.
   Estat: MOSTRA · dades de mostra, funcions reals pendents d'inventari.
   Referència de disseny: /studio-lab/leads
   Inventari de funcions: docs/admin-leads-funcions-inventari.md
============================================================================ */

import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import './leads-design.css';

type Stage = 'nou' | 'contactat' | 'guanyat' | 'perdut';
type ViewMode = 'calendari' | 'pipeline';
type WxKind = 'sun' | 'partly' | 'cloud' | 'rain' | 'storm';
type Wx = { kind: WxKind; tmax: number; tmin: number };

type Lead = {
  id: string; name: string; type: string; dateISO: string; time: string; location: string; pax: number; product: string; value: number;
  stage: Stage; channel: string; owner: string; last: string; wx: Wx;
};

const STAGE_LABEL: Record<Stage, string> = {
  nou: 'Nou', contactat: 'Contactat', guanyat: 'Guanyat', perdut: 'Perdut',
};
const PIPELINE_STAGES: Stage[] = ['nou', 'contactat', 'guanyat', 'perdut'];
const PROB: Record<Stage, number> = { nou: 20, contactat: 55, guanyat: 100, perdut: 0 };
const WX_LABEL: Record<WxKind, string> = { sun: 'Sol', partly: 'Mig sol', cloud: 'Núvols', rain: 'Pluja', storm: 'Tempesta' };

const YEAR = 2026;
const MONTH_WINDOW = 3;
const MONTH_MAX_START = 12 - MONTH_WINDOW + 1;
const MONTHS_FULL = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
const MONTHS_SHORT = ['gen', 'feb', 'març', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'des'];

/* Dades de mostra — es substituiran per dades reals (veure inventari) */
const LEADS: Lead[] = [
  { id: 'l1', name: 'Laia i Nil', type: 'Boda', dateISO: '2026-06-13', time: '18:30', location: 'Vic', pax: 120, product: 'Boda Premium', value: 2490, stage: 'contactat', channel: 'WhatsApp', owner: 'Aina', last: 'fa 4 dies', wx: { kind: 'partly', tmax: 24, tmin: 15 } },
  { id: 'l2', name: 'Atlas Group', type: 'Empresa', dateISO: '2026-06-20', time: '20:00', location: 'Barcelona', pax: 85, product: 'DJ + so corporatiu', value: 3200, stage: 'contactat', channel: 'Web', owner: 'Marc', last: 'fa 2 dies', wx: { kind: 'sun', tmax: 27, tmin: 16 } },
  { id: 'l3', name: 'Aniversari Pol', type: 'Festa', dateISO: '2026-06-27', time: '17:00', location: 'Granollers', pax: 35, product: 'Pack Festa', value: 600, stage: 'guanyat', channel: 'Instagram', owner: 'Marc', last: 'avui', wx: { kind: 'sun', tmax: 29, tmin: 18 } },
  { id: 'l4', name: 'Tech Nova SL', type: 'Empresa', dateISO: '2026-07-04', time: '19:30', location: 'Girona', pax: 140, product: 'Esdeveniment empresa', value: 4100, stage: 'guanyat', channel: 'Referència', owner: 'Aina', last: 'fa 3 dies', wx: { kind: 'partly', tmax: 28, tmin: 19 } },
  { id: 'l5', name: 'Júlia & Pau', type: 'Boda', dateISO: '2026-07-11', time: '18:00', location: 'Sta. Coloma', pax: 110, product: 'Boda Essencial', value: 2750, stage: 'nou', channel: 'Web', owner: 'Marc', last: 'fa 1 dia', wx: { kind: 'sun', tmax: 31, tmin: 20 } },
  { id: 'l6', name: 'Gala Vermut', type: 'Empresa', dateISO: '2026-07-17', time: '13:00', location: 'Sabadell', pax: 70, product: 'Vermut musical', value: 1500, stage: 'nou', channel: 'Email', owner: 'Aina', last: 'fa 5 dies', wx: { kind: 'cloud', tmax: 26, tmin: 19 } },
  { id: 'l7', name: 'Ajuntament Vic', type: 'Festa major', dateISO: '2026-08-01', time: '22:30', location: 'Vic', pax: 450, product: 'Escenari + DJ', value: 5600, stage: 'contactat', channel: 'Email', owner: 'Aina', last: 'fa 8 dies', wx: { kind: 'sun', tmax: 33, tmin: 21 } },
  { id: 'l8', name: 'Bodes del Mar', type: 'Boda', dateISO: '2026-08-08', time: '19:00', location: 'Sitges', pax: 160, product: 'Boda Premium', value: 3300, stage: 'guanyat', channel: 'Web', owner: 'Marc', last: 'fa 1 dia', wx: { kind: 'rain', tmax: 23, tmin: 18 } },
  { id: 'l9', name: 'Festa privada BCN', type: 'Discomòbil', dateISO: '2026-08-16', time: '23:00', location: 'Barcelona', pax: 55, product: 'Discomòbil', value: 700, stage: 'perdut', channel: 'WhatsApp', owner: 'Marc', last: 'fa 20 dies', wx: { kind: 'storm', tmax: 25, tmin: 19 } },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function euro(n: number): string { return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`; }
function parseISO(iso: string) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; }
function isoDate(y: number, m: number, d: number) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function shiftIso(iso: string, days: number) { const { y, m, d } = parseISO(iso); const t = new Date(Date.UTC(y, m - 1, d + days)); return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); }
function saturdaysInMonth(y: number, m: number) { const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); const out: string[] = []; for (let d = 1; d <= last; d++) if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 6) out.push(isoDate(y, m, d)); return out; }
function fullDate(iso: string) { const { y, m, d } = parseISO(iso); return `${d} de ${MONTHS_FULL[m - 1].toLowerCase()} ${y}`; }
function leadSummary(lead: Lead) {
  if (lead.stage === 'nou') return `Entrat per ${lead.channel}. Cal primer contacte.`;
  if (lead.stage === 'contactat') return `Seguiment amb ${lead.owner}. Últim contacte: ${lead.last}.`;
  if (lead.stage === 'guanyat') return 'Crear reserva, contracte i pagament inicial.';
  return 'Arxivat com a perdut. Revisar motiu i possible reactivació.';
}

/* ── Icones ──────────────────────────────────────────────────────────────── */
const ic = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const I = {
  search: ic(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>),
  plus:   ic(<><path d="M12 5v14M5 12h14" /></>),
  arrow:  ic(<path d="M5 12h14M13 6l6 6-6 6" />),
  back:   ic(<path d="M19 12H5M11 6l-6 6 6 6" />),
  chevron: ic(<path d="M6 9l6 6 6-6" />),
  whats:  ic(<path d="M4 20l1.5-4A8 8 0 1 1 9 19z" />),
  mail:   ic(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  dots:   ic(<><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>),
};
const WX_ICON: Record<WxKind, ReactNode> = {
  sun:    ic(<><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>),
  partly: ic(<><circle cx="8" cy="8" r="3" /><path d="M8 1.5v2M1.5 8h2M3.6 3.6l1.4 1.4M12.4 3.6 11 5" /><path d="M7 18h9a3.5 3.5 0 0 0 .2-7 5 5 0 0 0-9.4 1.2A3.4 3.4 0 0 0 7 18z" /></>),
  cloud:  ic(<path d="M7 18h10a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5 1.4A3.7 3.7 0 0 0 7 18z" />),
  rain:   ic(<><path d="M7 14h10a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5 1.4A3.7 3.7 0 0 0 7 14z" /><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" /></>),
  storm:  ic(<><path d="M7 13h10a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5 1.4A3.7 3.7 0 0 0 7 13z" /><path d="M13 14l-3 4h3l-1 3.5" /></>),
};

/* ── Components visuals ──────────────────────────────────────────────────── */
function WxBlock({ wx, size }: { wx: Wx; size: 'card' | 'hero' }) {
  return (
    <div className={`wx wx--${size}`} title={`Previsió: ${WX_LABEL[wx.kind]}`}>
      <span className="wx__ic" data-wx={wx.kind}>{WX_ICON[wx.kind]}</span>
      <span className="wx__t"><b>{wx.tmax}°</b><i>{wx.tmin}°</i></span>
      <span className="wx__lab">{WX_LABEL[wx.kind]}</span>
    </div>
  );
}

/* ── Fitxa sencera d'un lead ─────────────────────────────────────────────── */
function LeadPage({ lead, onBack }: { lead: Lead; onBack: () => void }) {
  const prob = PROB[lead.stage];
  const margin = Math.round(lead.value * 0.42);
  const flowIdx = PIPELINE_STAGES.indexOf(lead.stage);
  const primaryLabel = lead.stage === 'nou'
    ? 'Passa a contactat'
    : lead.stage === 'contactat'
      ? 'Passa a guanyat'
      : lead.stage === 'guanyat'
        ? 'Crear reserva'
        : 'Reactiva a nou';

  return (
    <div className="lp2" data-stage={lead.stage}>
      <div className="lp2__bar">
        <button type="button" className="lp2__back" onClick={onBack}><span className="lp2__backic">{I.back}</span>Torna</button>
        <span className="lp2__crumb">Comercial <em>/</em> Temporada <em>/</em> {lead.name}</span>
      </div>

      <div className="lp2__layout">
        <section className="lp2__main">
          <div className="lp2__hero">
            <div className="lp2__id">
              <span className="lp2__kicker" data-stage={lead.stage}>{STAGE_LABEL[lead.stage]} · {lead.type}</span>
              <h1 className="lp2__name">{lead.name}</h1>
              <span className="lp2__meta">{fullDate(lead.dateISO)} · {lead.time} · {lead.location}</span>
            </div>
            <WxBlock wx={lead.wx} size="hero" />
          </div>

          <div className="lp2__stats" aria-label="Resum del lead">
            <div className="lp2__stat"><span>Valor estimat</span><b>{euro(lead.value)}</b></div>
            <div className="lp2__stat"><span>Probabilitat</span><b>{prob}%</b></div>
            <div className="lp2__stat"><span>Marge est.</span><b>{euro(margin)}</b></div>
            <div className="lp2__stat"><span>Pax</span><b>{lead.pax}</b></div>
          </div>

          <section className="lp2__panel lp2__panel--details">
            <h2 className="lp2__h">Dades clau</h2>
            <dl className="lp2__data">
              <div><dt>Contacte</dt><dd>{lead.name}</dd></div>
              <div><dt>Producte</dt><dd>{lead.product}</dd></div>
              <div><dt>Canal</dt><dd>{lead.channel}</dd></div>
              <div><dt>Propietari</dt><dd>{lead.owner}</dd></div>
              <div><dt>Data</dt><dd>{fullDate(lead.dateISO)}</dd></div>
              <div><dt>Hora</dt><dd>{lead.time}</dd></div>
              <div><dt>Lloc</dt><dd>{lead.location}</dd></div>
              <div><dt>Últim contacte</dt><dd>{lead.last}</dd></div>
            </dl>
          </section>

          <section className="lp2__panel lp2__panel--wide">
            <h2 className="lp2__h">Activitat</h2>
            <div className="lp2__time">
              <div className="lp2__ev"><span className="lp2__evdot" data-stage={lead.stage} /><div><b>Pressupost enviat</b><span>{lead.last} · {lead.owner}</span></div></div>
              <div className="lp2__ev"><span className="lp2__evdot" /><div><b>Trucada de seguiment</b><span>fa 5 dies · {lead.owner}</span></div></div>
              <div className="lp2__ev"><span className="lp2__evdot" /><div><b>Entrada des de {lead.channel}</b><span>fa 8 dies · automàtic</span></div></div>
            </div>
          </section>
        </section>

        <aside className="lp2__decision">
          <section className="lp2__panel lp2__panel--action">
            <span className="lp2__kicker">Accions</span>
            <h2 className="lp2__actiontitle">Què ha passat?</h2>
            <p>{leadSummary(lead)}</p>
            <div className="lp2__quickacts" aria-label="Registrar activitat">
              <button type="button"><span className="lp2__quickic">{I.whats}</span>Enviar WhatsApp</button>
              <button type="button"><span className="lp2__quickic">{I.mail}</span>Enviar correu</button>
              <button type="button"><span className="lp2__quickic">{I.whats}</span>Trucada feta</button>
              <button type="button"><span className="lp2__quickic">{I.mail}</span>Pressupost enviat</button>
              <button type="button"><span className="lp2__quickic">{I.dots}</span>Afegir nota</button>
            </div>
          </section>

          <section className="lp2__panel">
            <h2 className="lp2__h">Canviar estat</h2>
            <div className="lp2__stagepick" role="group" aria-label="Canviar estat del lead">
              {PIPELINE_STAGES.map((s, i) => (
                <button type="button" key={s} className={`lp2__stagebtn${lead.stage !== 'perdut' && s !== 'perdut' && i < flowIdx ? ' is-done' : ''}${i === flowIdx ? ' is-now' : ''}`} data-stage={s} aria-pressed={i === flowIdx}>
                  <span className="lp2__dot" />
                  <span className="lp2__steplabel">{STAGE_LABEL[s]}</span>
                </button>
              ))}
            </div>
            <button type="button" className="lp2__commit">{primaryLabel} <span className="lp2__goic">{I.arrow}</span></button>
          </section>

          <section className="lp2__panel">
            <h2 className="lp2__h">Previsió</h2>
            <WxBlock wx={lead.wx} size="card" />
            <dl className="lp2__rows lp2__rows--compact">
              <div><dt>Temps</dt><dd>{WX_LABEL[lead.wx.kind]}</dd></div>
              <div><dt>Màxima</dt><dd>{lead.wx.tmax}°</dd></div>
              <div><dt>Mínima</dt><dd>{lead.wx.tmin}°</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ── Pàgina de temporada (calendari / pipeline) ──────────────────────────── */
type MonthBlock = {
  m: number; label: string;
  weekends: { sat: string; days: { iso: string; d: number; inMonth: boolean; lead: Lead | null }[] }[];
};

function TemporadaPage({ viewMode, setViewMode, months, onOpen, monthStart, setMonthStart, visibleMonths }: {
  viewMode: ViewMode; setViewMode: (v: ViewMode) => void; months: MonthBlock[]; onOpen: (id: string) => void;
  monthStart: number; setMonthStart: (n: number) => void; visibleMonths: number[];
}) {
  const goPrev = () => setMonthStart(Math.max(1, monthStart - 1));
  const goNext = () => setMonthStart(Math.min(MONTH_MAX_START, monthStart + 1));
  const jump = (m: number) => setMonthStart(Math.min(MONTH_MAX_START, Math.max(1, m)));

  const focusQueue = useMemo(() => LEADS.filter((l) => l.stage !== 'perdut').slice().sort((a, b) => a.dateISO.localeCompare(b.dateISO)), []);
  const [focusId, setFocusId] = useState(focusQueue[0]?.id ?? LEADS[0].id);
  const focus = LEADS.find((l) => l.id === focusId) ?? focusQueue[0];
  const focusPos = focusQueue.findIndex((l) => l.id === focusId);
  const cycleFocus = (dir: number) => {
    if (focusQueue.length === 0) return;
    const base = focusPos < 0 ? 0 : focusPos;
    setFocusId(focusQueue[(base + dir + focusQueue.length) % focusQueue.length].id);
  };

  const totalValue = LEADS.reduce((sum, l) => sum + l.value, 0);
  const openValue = LEADS.filter((l) => l.stage === 'nou' || l.stage === 'contactat').reduce((sum, l) => sum + l.value, 0);
  const wonValue = LEADS.filter((l) => l.stage === 'guanyat').reduce((sum, l) => sum + l.value, 0);
  const bookedWeekends = LEADS.filter((l) => l.stage !== 'perdut').length;

  return (
    <>
      <div className="fx__pagehead">
        <div className="fx__tt">
          <span className="fx__eyebrow">Temporada {YEAR}</span>
          <h1 className="fx__h1">Caps de setmana</h1>
        </div>
        <div className="fx__headright">
          <span className="fx__sub">{MONTHS_SHORT[visibleMonths[0] - 1]} – {MONTHS_SHORT[visibleMonths[visibleMonths.length - 1] - 1]} {YEAR} · caps de setmana</span>
          <div className="fx__view" role="group" aria-label="Vista">
            <button type="button" className={viewMode === 'calendari' ? 'is-on' : ''} aria-pressed={viewMode === 'calendari'} onClick={() => setViewMode('calendari')}>Calendari</button>
            <button type="button" className={viewMode === 'pipeline' ? 'is-on' : ''} aria-pressed={viewMode === 'pipeline'} onClick={() => setViewMode('pipeline')}>Pipeline</button>
          </div>
        </div>
      </div>

      <div className="fx__focus" data-stage={focus.stage}>
        <div className="fx__focushead">
          <span className="fx__focuseyebrow"><span className="fx__hintdot" aria-hidden="true" />Focus · la decisió que toca ara</span>
          <div className="fx__focuscycle">
            <button type="button" aria-label="Decisió anterior" onClick={() => cycleFocus(-1)}>{I.back}</button>
            <span>{focusPos < 0 ? '–' : focusPos + 1} / {focusQueue.length}</span>
            <button type="button" aria-label="Decisió següent" onClick={() => cycleFocus(1)}>{I.arrow}</button>
          </div>
        </div>
        <div className="fx__focusbody">
          <button type="button" className="fx__focusmain" onClick={() => onOpen(focus.id)}>
            <span className="fx__focusmeta"><span className="fx__dot" data-stage={focus.stage} aria-hidden="true" />{focus.type} · {fullDate(focus.dateISO)} · {focus.location} · {focus.pax} pax</span>
            <span className="fx__focusname">{focus.name}</span>
            <span className="fx__focusnote">{leadSummary(focus)}</span>
          </button>
          <div className="fx__focusside">
            <div className="fx__focusval"><span>Valor</span><b>{euro(focus.value)}</b></div>
            <div className="fx__ring" style={{ '--p': PROB[focus.stage] } as CSSProperties} aria-label={`Probabilitat ${PROB[focus.stage]}%`}><span>{PROB[focus.stage]}%</span></div>
          </div>
        </div>
      </div>

      <div className="fx__metrics" aria-label="Resum comercial">
        <div className="fx__metric">
          <span>Entrades</span>
          <b>{LEADS.length}</b>
          <small>{bookedWeekends} caps de setmana actius</small>
        </div>
        <div className="fx__metric">
          <span>Pipeline obert</span>
          <b>{euro(openValue)}</b>
          <small>Nou + contactat</small>
        </div>
        <div className="fx__metric">
          <span>Guanyat</span>
          <b>{euro(wonValue)}</b>
          <small>{LEADS.filter((l) => l.stage === 'guanyat').length} reserves per activar</small>
        </div>
        <div className="fx__metric">
          <span>Valor temporada</span>
          <b>{euro(totalValue)}</b>
          <small>temporada {YEAR}</small>
        </div>
      </div>

      <div className="fx__content">
        {viewMode === 'calendari' ? (
          <>
            <div className="fx__calbar">
              <button type="button" className="fx__calnav" onClick={goPrev} disabled={monthStart <= 1} aria-label="Mesos anteriors">{I.back}</button>
              <div className="fx__calmonths" role="group" aria-label="Selector de mesos">
                {MONTHS_SHORT.map((ms, i) => {
                  const m = i + 1;
                  const on = visibleMonths.includes(m);
                  return <button key={ms} type="button" className={`fx__calchip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => jump(m)}>{ms}</button>;
                })}
              </div>
              <button type="button" className="fx__calnav" onClick={goNext} disabled={monthStart >= MONTH_MAX_START} aria-label="Mesos següents">{I.arrow}</button>
            </div>
            <div className="fx__cal">
              {months.map((month) => {
                const monthLeads = month.weekends.reduce((n, w) => n + w.days.filter((d) => d.lead && d.inMonth).length, 0);
                return (
                  <article className="fx__mon" key={month.m}>
                    <div className="fx__monhead">
                      <h2>{month.label}</h2>
                      <span className="fx__monmeta">
                        <span className="fx__moncount">{monthLeads} {monthLeads === 1 ? 'bolo' : 'bolos'}</span>
                      </span>
                    </div>
                    <div className="fx__weekhead">
                      <span className="fx__gh">Dv</span><span className="fx__gh">Ds</span><span className="fx__gh">Dg</span>
                    </div>
                    <div className="fx__grid">
                      {month.weekends.map((w) => w.days.map((d) => {
                        const l = d.lead;
                        if (!l) return (
                          <span key={d.iso} className={`fx__cell is-free${d.inMonth ? '' : ' is-out'}`}>
                            <span className="fx__day">{d.d}</span>
                            <span className="fx__freelabel">Lliure</span>
                          </span>
                        );
                        return (
                          <button key={d.iso} type="button" className={`fx__cell is-lead${d.inMonth ? '' : ' is-out'}${l.id === focusId ? ' is-active' : ''}`} data-stage={l.stage} onClick={() => onOpen(l.id)}>
                            <span className="fx__celltop">
                              <span className="fx__day">{d.d}</span>
                              <span className="fx__cellmeta"><span className="fx__wx" data-wx={l.wx.kind}>{WX_ICON[l.wx.kind]}</span><span className="fx__dot" data-stage={l.stage} aria-hidden="true" /></span>
                            </span>
                            <span className="fx__celltype">{l.type}</span>
                            <span className="fx__lname">{l.name}</span>
                            <span className="fx__cellfoot">{l.time} · {l.location}</span>
                          </button>
                        );
                      }))}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="fx__pipeline">
            {PIPELINE_STAGES.map((stage) => (
              <section className="fx__lane" key={stage} data-stage={stage}>
                <div className="fx__lanehead"><h2>{STAGE_LABEL[stage]}</h2><span>{LEADS.filter((l) => l.stage === stage).length}</span></div>
                <div className="fx__lanecards">
                  {LEADS.filter((l) => l.stage === stage).map((l) => (
                    <button key={l.id} type="button" className={`fx__pipelead${l.id === focusId ? ' is-active' : ''}`} data-stage={l.stage} onClick={() => onOpen(l.id)}>
                      <span className="fx__leadtop">
                        <b>{l.name}</b>
                        <strong>{euro(l.value)}</strong>
                      </span>
                      <span className="fx__leadwhen">{fullDate(l.dateISO)} · {l.time} · {l.location}</span>
                      <span className="fx__leaddetail">{l.pax} pax · {l.product}</span>
                      <span className="fx__prob" aria-hidden="true"><i /></span>
                      <small>{leadSummary(l)}</small>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Pàgina principal ────────────────────────────────────────────────────── */
export default function AdminLeadsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendari');
  const [monthStart, setMonthStart] = useState(6);
  const [pageId, setPageId] = useState<string | null>(null);

  const visibleMonths = useMemo(() => Array.from({ length: MONTH_WINDOW }, (_, i) => monthStart + i), [monthStart]);
  const byDate = useMemo(() => { const m = new Map<string, Lead>(); for (const l of LEADS) m.set(l.dateISO, l); return m; }, []);
  const months = useMemo(() => visibleMonths.map((m) => {
    const weekends = saturdaysInMonth(YEAR, m).map((sat) => ({
      sat,
      days: [shiftIso(sat, -1), sat, shiftIso(sat, 1)].map((iso) => ({ iso, d: parseISO(iso).d, inMonth: parseISO(iso).m === m, lead: byDate.get(iso) ?? null })),
    }));
    return { m, label: MONTHS_FULL[m - 1], weekends };
  }), [byDate, visibleMonths]);

  const pageLead = LEADS.find((l) => l.id === pageId) ?? null;

  return (
    <div className="fx-root is-contrast">
      {pageLead
        ? <LeadPage lead={pageLead} onBack={() => setPageId(null)} />
        : <TemporadaPage viewMode={viewMode} setViewMode={setViewMode} months={months} onOpen={setPageId} monthStart={monthStart} setMonthStart={setMonthStart} visibleMonths={visibleMonths} />}
    </div>
  );
}
