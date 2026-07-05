'use client';

import { useMemo, useState } from 'react';
import { formatDateTimeFull, formatNumber } from '@/lib/constants';
import type { RepoElectricAtlas } from '@/lib/services/repoElectricAtlasService';

type TabKey = 'manual' | 'flows' | 'touchpoints' | 'dictionary' | 'internal' | 'circuit' | 'organs' | 'files' | 'functions' | 'cables' | 'routes' | 'models';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'manual', label: 'Manual' },
  { key: 'flows', label: 'Fluxos' },
  { key: 'touchpoints', label: 'On tocar' },
  { key: 'dictionary', label: 'Glossari' },
  { key: 'internal', label: 'Cables interns' },
  { key: 'circuit', label: 'Circuit' },
  { key: 'organs', label: 'Òrgans' },
  { key: 'files', label: 'Fitxers' },
  { key: 'functions', label: 'Funcions' },
  { key: 'cables', label: 'Cables' },
  { key: 'routes', label: 'Rutes' },
  { key: 'models', label: 'BD' },
];

function includesQuery(values: Array<string | number | boolean | null | undefined>, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return values.some((v) => String(v ?? '').toLowerCase().includes(q));
}

function LimitNote({ shown, total }: { shown: number; total: number }) {
  if (shown >= total) return null;
  return (
    <p className="mt-3 text-xs text-[var(--t3)]">
      Mostrant {formatNumber(shown)} de {formatNumber(total)} resultats. Filtra per veure el cable exacte.
    </p>
  );
}

export default function ElectricAtlasClient({ atlas }: { atlas: RepoElectricAtlas }) {
  const [tab, setTab] = useState<TabKey>('manual');
  const [query, setQuery] = useState('');
  const limit = 350;

  const filteredFiles = useMemo(
    () => atlas.files.filter((f) => includesQuery([f.path, f.organ, f.ext, f.hash], query)),
    [atlas.files, query],
  );
  const filteredFunctions = useMemo(
    () => atlas.functions.filter((f) => includesQuery([f.file, f.name, f.kind, f.exported], query)),
    [atlas.functions, query],
  );
  const filteredCables = useMemo(
    () => atlas.cables.filter((c) => includesQuery([c.from, c.to, c.kind, c.label], query)),
    [atlas.cables, query],
  );
  const filteredRoutes = useMemo(
    () => atlas.routes.filter((r) => includesQuery([r.file, r.name, r.kind], query)),
    [atlas.routes, query],
  );
  const filteredModels = useMemo(
    () => atlas.models.filter((m) => includesQuery([m.file, m.name, m.kind], query)),
    [atlas.models, query],
  );
  const filteredFlows = useMemo(
    () => atlas.flows.filter((flow) => includesQuery([
      flow.title,
      flow.question,
      flow.filesCount,
      flow.missingStages,
      flow.stages.map((stage) => `${stage.label} ${stage.intent} ${stage.files.map((file) => file.path).join(' ')}`).join(' '),
    ], query)),
    [atlas.flows, query],
  );
  const filteredTouchpoints = useMemo(
    () => atlas.touchpoints.filter((touchpoint) => includesQuery([
      touchpoint.title,
      touchpoint.when,
      touchpoint.readFirst.join(' '),
      touchpoint.safeOrder.join(' '),
      touchpoint.doNotTouch.join(' '),
      touchpoint.files.map((file) => file.path).join(' '),
    ], query)),
    [atlas.touchpoints, query],
  );
  const filteredDictionary = useMemo(
    () => atlas.dictionary.filter((entry) => includesQuery([
      entry.term,
      entry.definition,
      entry.useWhen,
      entry.sourceOfTruth.join(' '),
      entry.files.map((file) => file.path).join(' '),
      entry.symbols.map((symbol) => symbol.name).join(' '),
    ], query)),
    [atlas.dictionary, query],
  );
  const filteredInternalCables = useMemo(
    () => atlas.internalCables.filter((cable) => includesQuery([cable.from, cable.to, cable.label], query)),
    [atlas.internalCables, query],
  );

  return (
    <div className="space-y-5">
      <div className="ap-card p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <label className="min-w-0">
            <span className="mb-1 block font-mono text-xs uppercase text-[var(--gold)]">Cercador de cables</span>
            <input
              className="adm-input w-full"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca flux, concepte, ruta, servei, funció, model, endpoint, hash..."
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`ap-btn ap-btn--xs ${tab === item.key ? 'ap-btn--primary' : 'ap-btn--secondary'}`}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'manual' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="ap-card p-4">
            <h2 className="mb-2 text-lg font-bold text-[var(--t)]">Síntesi mare</h2>
            <p className="text-sm leading-relaxed text-[var(--t2)]">{atlas.synthesis.verdict}</p>
            <h3 className="mt-4 font-mono text-xs uppercase text-[var(--gold)]">Regles d'or</h3>
            <BulletList items={atlas.synthesis.goldenRules} />
          </section>
          <section className="ap-card p-4">
            <h2 className="mb-2 text-lg font-bold text-[var(--t)]">Com s'ha d'usar</h2>
            <BulletList items={atlas.synthesis.useThisAtlasFor} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="ap-kpi"><span className="ap-kpi-label">Fluxos</span><span className="ap-kpi-value">{formatNumber(atlas.flows.length)}</span></div>
              <div className="ap-kpi"><span className="ap-kpi-label">On tocar</span><span className="ap-kpi-value">{formatNumber(atlas.touchpoints.length)}</span></div>
              <div className="ap-kpi"><span className="ap-kpi-label">Glossari</span><span className="ap-kpi-value">{formatNumber(atlas.dictionary.length)}</span></div>
              <div className="ap-kpi"><span className="ap-kpi-label">Cables interns</span><span className="ap-kpi-value">{formatNumber(atlas.internalCables.length)}</span></div>
            </div>
          </section>
        </div>
      )}

      {tab === 'flows' && (
        <div className="grid gap-4">
          {filteredFlows.map((flow) => (
            <section key={flow.id} className="ap-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--t)]">{flow.title}</h2>
                  <p className="mt-1 text-sm text-[var(--t2)]">{flow.question}</p>
                </div>
                <span className="ap-badge">{formatNumber(flow.filesCount)} fitxers · {flow.missingStages === 0 ? 'circuit trobat' : `${flow.missingStages} tram(s) prim(s)`}</span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {flow.stages.map((stage) => (
                  <article key={stage.label} className="ap-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-[var(--t)]">{stage.label}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--t3)]">{stage.intent}</p>
                      </div>
                      <span className={`ap-badge ${stage.status === 'missing' ? 'admin-tone-border-danger' : stage.status === 'thin' ? 'admin-tone-border-warning' : ''}`}>
                        {stage.status === 'wired' ? 'cablejat' : stage.status === 'thin' ? 'prim' : 'falta'}
                      </span>
                    </div>
                    <FileRefs files={stage.files} />
                    <SymbolRefs symbols={stage.symbols} />
                    <CableRefs cables={stage.internalCables} />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === 'touchpoints' && (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredTouchpoints.map((touchpoint) => (
            <section key={touchpoint.id} className="ap-card p-4">
              <h2 className="text-lg font-bold text-[var(--t)]">{touchpoint.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{touchpoint.when}</p>
              <h3 className="mt-4 font-mono text-xs uppercase text-[var(--gold)]">Llegeix primer</h3>
              <BulletList items={touchpoint.readFirst} mono />
              <h3 className="mt-4 font-mono text-xs uppercase text-[var(--gold)]">Ordre segur</h3>
              <BulletList items={touchpoint.safeOrder} />
              <h3 className="mt-4 font-mono text-xs uppercase text-[var(--gold)]">No tocar així</h3>
              <BulletList items={touchpoint.doNotTouch} />
              <h3 className="mt-4 font-mono text-xs uppercase text-[var(--gold)]">Validació</h3>
              <BulletList items={touchpoint.validations} mono />
              <FileRefs files={touchpoint.files} />
              <CableRefs cables={touchpoint.internalCables} />
            </section>
          ))}
        </div>
      )}

      {tab === 'dictionary' && (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredDictionary.map((entry) => (
            <section key={entry.id} className="ap-card p-4">
              <h2 className="text-lg font-bold text-[var(--t)]">{entry.term}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{entry.definition}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--t3)]">{entry.useWhen}</p>
              <h3 className="mt-4 font-mono text-xs uppercase text-[var(--gold)]">Fonts de veritat</h3>
              <BulletList items={entry.sourceOfTruth} mono />
              <h3 className="mt-4 font-mono text-xs uppercase text-[var(--gold)]">Validació</h3>
              <BulletList items={entry.validations} mono />
              <FileRefs files={entry.files} />
              <SymbolRefs symbols={entry.symbols} />
              <CableRefs cables={entry.internalCables} />
            </section>
          ))}
        </div>
      )}

      {tab === 'internal' && (
        <section className="ap-card overflow-hidden">
          <Table
            headers={['Des de', 'Cap a', 'Etiqueta', 'Línia']}
            rows={filteredInternalCables.slice(0, limit).map((c) => [c.from, c.to, c.label, c.line])}
          />
          <LimitNote shown={Math.min(filteredInternalCables.length, limit)} total={filteredInternalCables.length} />
        </section>
      )}

      {tab === 'circuit' && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="ap-card p-4">
            <h2 className="mb-2 text-lg font-bold text-[var(--t)]">Circuit viu</h2>
            <pre className="overflow-x-auto rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--raised)] p-4 text-xs leading-relaxed text-[var(--t2)]">
{`WEB PUBLICA
  | contacto / configurador / reservar / portal
  v
API FRONTISSA
  | /api/contact /api/booking /api/public/* /api/portal/*
  v
LEADS
  | leadAdminService / leadRouteService / leadServiceLineService
  v
DOCUMENTS
  | dossierService / dossierSnapshotService / dossierCompositePdfService
  v
RESERVES
  | bookingCreationService / bookingRouteService / bookingListService
  v
OPERACIO
  | calendar / capacity / checklist / inventory / crew / repartiment
  v
DINERS
  | costEngine / travelLaborCost / payout / cash / Stripe / Bizum
  v
POST-EVENT
  | postEventPlaybook / reviews / testimonials / referrals
  v
NOU LEAD`}
            </pre>
          </section>

          <section className="ap-card p-4">
            <h2 className="mb-3 text-lg font-bold text-[var(--t)]">Lectura de placa</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="ap-kpi"><dt className="ap-kpi-label">Fitxers</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.files)}</dd></div>
              <div className="ap-kpi"><dt className="ap-kpi-label">Línies</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.lines)}</dd></div>
              <div className="ap-kpi"><dt className="ap-kpi-label">Caràcters</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.chars)}</dd></div>
              <div className="ap-kpi"><dt className="ap-kpi-label">Funcions</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.functions)}</dd></div>
              <div className="ap-kpi"><dt className="ap-kpi-label">Cables</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.cables)}</dd></div>
              <div className="ap-kpi"><dt className="ap-kpi-label">Rutes</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.routes)}</dd></div>
              <div className="ap-kpi"><dt className="ap-kpi-label">Serveis</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.services)}</dd></div>
              <div className="ap-kpi"><dt className="ap-kpi-label">Models</dt><dd className="ap-kpi-value">{formatNumber(atlas.summary.models)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-[var(--t3)]">
              Generat de {atlas.rootName} a {formatDateTimeFull(atlas.generatedAt)}. Exclosos: {atlas.excludedDirs.join(', ')}.
            </p>
          </section>
        </div>
      )}

      {tab === 'organs' && (
        <section className="ap-card overflow-hidden">
          <Table
            headers={['Òrgan', 'Fitxers', 'Línies', 'Caràcters', 'Funcions', 'Cables']}
            rows={atlas.organs.map((o) => [o.label, o.files, o.lines, o.chars, o.functions, o.cables])}
          />
        </section>
      )}

      {tab === 'files' && (
        <section className="ap-card overflow-hidden">
          <Table
            headers={['Fitxer', 'Òrgan', 'Ext', 'Línies', 'Caràcters', 'Funcions', 'Cables', 'Hash']}
            rows={filteredFiles.slice(0, limit).map((f) => [f.path, f.organ, f.ext, f.lines, f.chars, f.functions, f.cables, f.hash])}
          />
          <LimitNote shown={Math.min(filteredFiles.length, limit)} total={filteredFiles.length} />
        </section>
      )}

      {tab === 'functions' && (
        <section className="ap-card overflow-hidden">
          <Table
            headers={['Funció', 'Tipus', 'Export', 'Fitxer', 'Línia']}
            rows={filteredFunctions.slice(0, limit).map((f) => [f.name, f.kind, f.exported ? 'sí' : 'no', f.file, f.line])}
          />
          <LimitNote shown={Math.min(filteredFunctions.length, limit)} total={filteredFunctions.length} />
        </section>
      )}

      {tab === 'cables' && (
        <section className="ap-card overflow-hidden">
          <Table
            headers={['Des de', 'Cap a', 'Tipus', 'Etiqueta', 'Línia']}
            rows={filteredCables.slice(0, limit).map((c) => [c.from, c.to, c.kind, c.label, c.line])}
          />
          <LimitNote shown={Math.min(filteredCables.length, limit)} total={filteredCables.length} />
        </section>
      )}

      {tab === 'routes' && (
        <section className="ap-card overflow-hidden">
          <Table
            headers={['Handler', 'Fitxer', 'Línia']}
            rows={filteredRoutes.slice(0, limit).map((r) => [r.name, r.file, r.line])}
          />
          <LimitNote shown={Math.min(filteredRoutes.length, limit)} total={filteredRoutes.length} />
        </section>
      )}

      {tab === 'models' && (
        <section className="ap-card overflow-hidden">
          <Table
            headers={['Nom', 'Tipus', 'Fitxer', 'Línia']}
            rows={filteredModels.slice(0, limit).map((m) => [m.name, m.kind, m.file, m.line])}
          />
          <LimitNote shown={Math.min(filteredModels.length, limit)} total={filteredModels.length} />
        </section>
      )}
    </div>
  );
}

function BulletList({ items, mono = false }: { items: string[]; mono?: boolean }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm text-[var(--t2)]">
      {items.map((item) => (
        <li key={item} className={mono ? 'font-mono text-xs' : ''}>{item}</li>
      ))}
    </ul>
  );
}

function FileRefs({ files }: { files: RepoElectricAtlas['flows'][number]['stages'][number]['files'] }) {
  if (files.length === 0) return <p className="mt-3 text-xs text-[var(--t3)]">Cap fitxer trobat amb aquest patró.</p>;
  return (
    <div className="mt-3">
      <h4 className="font-mono text-xs uppercase text-[var(--gold)]">Fitxers</h4>
      <div className="mt-1.5 space-y-1">
        {files.slice(0, 8).map((file) => (
          <p key={file.path} className="truncate font-mono text-xs text-[var(--t2)]">
            {file.path} · {formatNumber(file.lines)}L · {file.hash}
          </p>
        ))}
      </div>
    </div>
  );
}

function SymbolRefs({ symbols }: { symbols: RepoElectricAtlas['functions'] }) {
  if (symbols.length === 0) return null;
  return (
    <div className="mt-3">
      <h4 className="font-mono text-xs uppercase text-[var(--gold)]">Símbols</h4>
      <p className="mt-1.5 line-clamp-3 font-mono text-xs leading-relaxed text-[var(--t2)]">
        {symbols.slice(0, 10).map((symbol) => `${symbol.name} (${symbol.file}:${symbol.line})`).join(' · ')}
      </p>
    </div>
  );
}

function CableRefs({ cables }: { cables: RepoElectricAtlas['internalCables'] }) {
  if (cables.length === 0) return null;
  return (
    <div className="mt-3">
      <h4 className="font-mono text-xs uppercase text-[var(--gold)]">Cables interns</h4>
      <div className="mt-1.5 space-y-1">
        {cables.slice(0, 5).map((cable) => (
          <p key={`${cable.from}:${cable.line}:${cable.to}`} className="truncate font-mono text-xs text-[var(--t2)]">
            {cable.from}:{cable.line} {'->'} {cable.to}
          </p>
        ))}
      </div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="border-b border-[var(--line)] px-3 py-2 text-left font-mono text-xs uppercase text-[var(--gold)]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--line)] last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="max-w-[34rem] px-3 py-2 align-top text-[var(--t2)]">
                  <span className={cellIndex === 0 ? 'font-mono text-xs text-[var(--t)]' : ''}>{typeof cell === 'number' ? formatNumber(cell) : cell}</span>
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length} className="px-3 py-5 text-center text-sm text-[var(--t3)]">
                Cap resultat amb aquest filtre.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
