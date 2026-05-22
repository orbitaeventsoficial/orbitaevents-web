'use client';

/* ============================================================================
   ÒRBITA COMMAND — laboratori del nou admin (/studio-lab)
   ----------------------------------------------------------------------------
   Concepte: el sistema no organitza pantalles, organitza decisions. El cor és
   un pipeline viu de bolos, arrossegable entre estats, amb color sòlid per
   estat i un panell que diu què cal decidir ara.
   Prototip intern (noindex). Dades de mostra. Iterable lliurement.
============================================================================ */

import { useEffect, useMemo, useState } from 'react';
import './studio-lab.css';

type Stage = 'nou' | 'contactat' | 'pressupost' | 'guanyat' | 'perdut';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'nou', label: 'Nou' },
  { id: 'contactat', label: 'Contactat' },
  { id: 'pressupost', label: 'Pressupost enviat' },
  { id: 'guanyat', label: 'Guanyat' },
  { id: 'perdut', label: 'Perdut' },
];

const NEXT_ACTION: Record<Stage, string> = {
  nou: 'Fes el primer contacte avui — la velocitat de resposta marca la conversió.',
  contactat: 'Envia el pressupost mentre l\'interès és calent.',
  pressupost: 'Truca per tancar la senyal i bloquejar la data.',
  guanyat: 'Genera el contracte i reserva l\'equip crític.',
  perdut: 'Arxiva amb motiu o programa reactivació d\'aquí 3 mesos.',
};

const ACTIONS_BY_STAGE: Record<Stage, string[]> = {
  nou: ['Enviar WhatsApp de benvinguda', 'Assignar responsable', 'Marcar com a contactat'],
  contactat: ['Generar pressupost', 'Programar trucada', 'Adjuntar catàleg'],
  pressupost: ['Enviar recordatori de senyal', 'Trucar ara', 'Aplicar descompte'],
  guanyat: ['Generar contracte', 'Reservar equip crític', 'Crear checklist de producció'],
  perdut: ['Registrar motiu de pèrdua', 'Programar reactivació', 'Arxivar'],
};

type Lead = {
  id: string;
  date: string;
  client: string;
  type: string;
  value: number;
  risk: 'alt' | 'mitjà' | 'baix';
  stage: Stage;
};

const INITIAL_LEADS: Lead[] = [
  { id: 'l1', date: '14 JUN', client: 'Laia i Nil', type: 'Boda', value: 2490, risk: 'alt', stage: 'pressupost' },
  { id: 'l2', date: '21 JUN', client: 'Atlas Group', type: 'Empresa', value: 3200, risk: 'mitjà', stage: 'contactat' },
  { id: 'l3', date: '28 JUN', client: 'Festa privada BCN', type: 'Discomòbil', value: 700, risk: 'alt', stage: 'pressupost' },
  { id: 'l4', date: '05 JUL', client: 'Masia Soler', type: 'Boda', value: 1890, risk: 'baix', stage: 'guanyat' },
  { id: 'l5', date: '12 JUL', client: 'Júlia & Pau', type: 'Boda', value: 2750, risk: 'mitjà', stage: 'nou' },
  { id: 'l6', date: '19 JUL', client: 'Tech Nova SL', type: 'Empresa', value: 4100, risk: 'alt', stage: 'nou' },
  { id: 'l7', date: '02 AGO', client: 'Ajuntament Vic', type: 'Festa major', value: 5600, risk: 'mitjà', stage: 'contactat' },
  { id: 'l8', date: '09 AGO', client: 'Bodes del Mar', type: 'Boda', value: 3300, risk: 'baix', stage: 'guanyat' },
  { id: 'l9', date: '16 AGO', client: 'Lluís festes', type: 'Discomòbil', value: 850, risk: 'alt', stage: 'perdut' },
];

const LAYERS = [
  { id: 'time', label: 'Temps', detail: 'dates · finestres · conflictes' },
  { id: 'money', label: 'Diners', detail: 'senyals · factures · marge' },
  { id: 'people', label: 'Persones', detail: 'clients · leads · proveïdors' },
  { id: 'ops', label: 'Operació', detail: 'equip · tasques · documents' },
];

const SIGNALS: { id: string; label: string; value: string; tone: string }[] = [
  { id: 'resp', label: 'Resposta', value: '7 leads esperen primer contacte', tone: 'nou' },
  { id: 'cash', label: 'Caixa', value: '1.240€ pendents de cobrar', tone: 'pressupost' },
  { id: 'prod', label: 'Producció', value: '2 bolos sense checklist', tone: 'contactat' },
  { id: 'cap', label: 'Capacitat', value: '1 dissabte amb tensió d\'equip', tone: 'perdut' },
];

const DAYS = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];

function euro(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '€';
}

export default function StudioLabPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [selectedId, setSelectedId] = useState<string>('l1');
  const [activeLayer, setActiveLayer] = useState<string>('time');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const [clock, setClock] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setClock(`${DAYS[d.getDay()]} · ${hh}:${mm}`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? leads[0],
    [leads, selectedId],
  );

  const pipelineValue = useMemo(
    () => leads.filter((l) => l.stage !== 'perdut').reduce((a, l) => a + l.value, 0),
    [leads],
  );

  function moveLead(id: string, stage: Stage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
    setSelectedId(id);
  }

  function onDrop(stage: Stage) {
    if (draggingId) moveLead(draggingId, stage);
    setDraggingId(null);
    setDragOver(null);
  }

  return (
    <main className="sl-root">
      <div className="sl-shell">
        {/* Capçalera */}
        <header className="sl-header">
          <div className="sl-brand">
            <span className="sl-glyph">Ò</span>
            <div>
              <strong>Òrbita Command</strong>
              <em>sistema operatiu d&apos;esdeveniments</em>
            </div>
          </div>
          <nav className="sl-layers" aria-label="Capes del sistema">
            {LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                className={layer.id === activeLayer ? 'is-active' : ''}
                onClick={() => setActiveLayer(layer.id)}
              >
                <strong>{layer.label}</strong>
                <em>{layer.detail}</em>
              </button>
            ))}
          </nav>
          <div className="sl-clock">
            <span>Ara</span>
            <strong>{clock || '—'}</strong>
          </div>
        </header>

        {/* Barra de KPIs */}
        <section className="sl-kpis" aria-label="Indicadors">
          <button type="button" className="sl-kpi sl-kpi--accent">
            <span>Pipeline viu</span>
            <strong>{euro(pipelineValue)}</strong>
            <em>+18% vs setmana passada</em>
          </button>
          <button type="button" className="sl-kpi">
            <span>Bolos aquesta setmana</span>
            <strong>4</strong>
            <em>2 amb risc alt</em>
          </button>
          <button type="button" className="sl-kpi">
            <span>Decisions obertes</span>
            <strong>{leads.filter((l) => l.stage === 'nou' || l.stage === 'pressupost').length}</strong>
            <em>arrossega per moure-les</em>
          </button>
          <button type="button" className="sl-kpi sl-kpi--danger">
            <span>Alertes</span>
            <strong>3</strong>
            <em>senyal · checklist · capacitat</em>
          </button>
        </section>

        {/* Pipeline arrossegable */}
        <section className="sl-board" aria-label="Pipeline de bolos">
          {STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage.id);
            const total = items.reduce((a, l) => a + l.value, 0);
            return (
              <div
                key={stage.id}
                className={`sl-col${dragOver === stage.id ? ' is-over' : ''}`}
                data-stage={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(stage.id);
                }}
                onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
                onDrop={() => onDrop(stage.id)}
              >
                <header className="sl-col__head">
                  <strong>{stage.label}</strong>
                  <span className="sl-col__count">{items.length}</span>
                </header>
                <div className="sl-col__sum">{euro(total)}</div>
                <div className="sl-col__body">
                  {items.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      className={`sl-card sl-risk-${lead.risk}${lead.id === selectedId ? ' is-selected' : ''}${lead.id === draggingId ? ' is-dragging' : ''}`}
                      draggable
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <span className="sl-card__top">
                        <span className="sl-card__date">{lead.date}</span>
                        <span className="sl-card__risk" aria-label={`risc ${lead.risk}`} />
                      </span>
                      <strong className="sl-card__client">{lead.client}</strong>
                      <span className="sl-card__type">{lead.type}</span>
                      <b className="sl-card__value">{euro(lead.value)}</b>
                    </button>
                  ))}
                  {items.length === 0 && <p className="sl-col__empty">Deixa-hi anar un bolo</p>}
                </div>
              </div>
            );
          })}
        </section>

        {/* Decisió + senyals */}
        <section className="sl-bottom">
          <article className="sl-decision" data-stage={selected.stage}>
            <span className="sl-kicker">Decisió ara</span>
            <h2>{selected.client}</h2>
            <p className="sl-decision__meta">
              {selected.type} · {selected.date} · {euro(selected.value)} · risc {selected.risk}
            </p>
            <p className="sl-decision__action">{NEXT_ACTION[selected.stage]}</p>
            <div className="sl-command-stack">
              {ACTIONS_BY_STAGE[selected.stage].map((cmd, i) => (
                <button key={cmd} type="button" className={i === 0 ? 'is-primary' : ''}>
                  {cmd}
                </button>
              ))}
            </div>
          </article>

          <aside className="sl-signal-grid" aria-label="Senyals operatius">
            {SIGNALS.map((s) => (
              <button key={s.id} type="button" className="sl-signal" data-stage={s.tone}>
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </button>
            ))}
          </aside>
        </section>
      </div>
    </main>
  );
}
