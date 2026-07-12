'use client';

import { useMemo, useState } from 'react';
import { ADMIN_SCRIPT_CATEGORY_INFO } from '@/lib/constants/admin';
import { EditorControlStrip } from '../components/EditorControlStrip';

interface ScriptInfo {
  name: string;
  file: string;
  command: string;
  category: 'seed' | 'sync' | 'check' | 'report' | 'fix' | 'audit';
  description: string;
  args?: string;
  danger?: boolean;
  mutatesData?: boolean;
}

const SCRIPTS: ScriptInfo[] = [
  {
    name: 'Seed complet',
    file: 'prisma/seed.ts',
    command: 'npx tsx prisma/seed.ts',
    category: 'seed',
    description: 'Insereix totes les dades inicials: settings, inventari, packs, extras, FAQs, traduccions, leads de prova i reserves de prova.',
    mutatesData: true,
  },
  {
    name: 'Seed plantilles email',
    file: 'prisma/seed-email-templates.ts',
    command: 'npx tsx prisma/seed-email-templates.ts',
    category: 'seed',
    description: 'Insereix les 24 plantilles email (8 tipus × 3 idiomes) a la BD. Upsert: si ja existeix, actualitza.',
    mutatesData: true,
  },
  {
    name: 'Seed blog',
    file: 'prisma/seed-blog.ts',
    command: 'npx tsx prisma/seed-blog.ts',
    category: 'seed',
    description: 'Insereix articles de blog de prova amb traduccions.',
    mutatesData: true,
  },
  {
    name: 'Sync preu benzina MITECO',
    file: 'scripts/sync-fuel-price.ts',
    command: 'npx tsx scripts/sync-fuel-price.ts',
    category: 'sync',
    description: 'Consulta el preu real de la benzina via MITECO (mitjana Barcelona) i actualitza el cost per km del vehicle a la BD.',
    mutatesData: true,
  },
  {
    name: 'Sync packs → BD',
    file: 'scripts/sync-packs-to-db.ts',
    command: 'npx tsx scripts/sync-packs-to-db.ts',
    category: 'sync',
    description: 'Sincronitza la configuració de packs des del codi cap a la BD (Prisma).',
    mutatesData: true,
  },
  {
    name: 'Sync ressenyes Google',
    file: 'scripts/sync-reviews.mjs',
    command: 'node scripts/sync-reviews.mjs',
    category: 'sync',
    description: 'Obté les ressenyes de Google Business via SerpAPI i les desa a la BD.',
    mutatesData: true,
  },
  {
    name: 'Health check BD',
    file: 'scripts/health-check.ts',
    command: 'npx tsx scripts/health-check.ts',
    category: 'check',
    description: 'Verifica la integritat de la BD: connexió, comptadors, traduccions, settings crítiques, reserves sense pack, leads sense score.',
  },
  {
    name: 'Semàfor pagaments',
    file: 'scripts/check-payment-status.ts',
    command: 'npx tsx scripts/check-payment-status.ts',
    category: 'check',
    description: "Mostra l'estat de cobrament de totes les reserves actives amb semàfor: tot cobrat, falta resta o res cobrat.",
  },
  {
    name: 'Monitor endpoints',
    file: 'scripts/monitor.ts',
    command: 'npx tsx scripts/monitor.ts',
    category: 'check',
    description: 'Health check dels endpoints principals: homepage, API, admin. Mesura temps de resposta.',
  },
  {
    name: 'Guard i18n packs',
    file: 'scripts/check-packs-i18n.ts',
    command: 'npx tsx scripts/check-packs-i18n.ts',
    category: 'check',
    description: 'Verifica que els packs no retornin claus tècniques al i18n (e.g. slugs en lloc de noms).',
  },
  {
    name: 'Informe estadístiques',
    file: 'scripts/stats-report.ts',
    command: 'npx tsx scripts/stats-report.ts',
    category: 'report',
    description: 'Genera un resum del negoci: leads, reserves, finances, clients, distribució mensual i pròxims 7 dies.',
  },
  {
    name: 'Exportar backup JSON',
    file: 'scripts/export-backup.ts',
    command: 'npx tsx scripts/export-backup.ts',
    category: 'report',
    description: 'Exporta leads, reserves, clients, settings, plantilles, packs, extras i inventari a un JSON a la carpeta backup/.',
  },
  {
    name: 'Llistar preus packs',
    file: 'scripts/update-pack-prices.ts',
    command: 'npx tsx scripts/update-pack-prices.ts',
    category: 'report',
    description: 'Mostra els PVP actuals de tots els packs. Amb arguments, permet canviar el preu.',
    args: '<slug> <preu>',
    mutatesData: true,
  },
  {
    name: 'Recalcular scores leads',
    file: 'scripts/recalculate-scores.ts',
    command: 'npx tsx scripts/recalculate-scores.ts',
    category: 'fix',
    description: 'Recalcula el cachedScore de tots els leads actius basant-se en tipus event, data, convidats, pressupost i font.',
    mutatesData: true,
  },
  {
    name: 'Recalcular marges reserves',
    file: 'scripts/recalculate-margins.ts',
    command: 'npx tsx scripts/recalculate-margins.ts',
    category: 'fix',
    description: 'Recalcula IVA, total, dipòsit i import pendent de totes les reserves actives. Detecta anomalies financeres.',
    mutatesData: true,
  },
  {
    name: 'Netejar registres orfes',
    file: 'scripts/cleanup-orphans.ts',
    command: 'npx tsx scripts/cleanup-orphans.ts',
    category: 'fix',
    description: 'Detecta registres orfes. Dry-run per defecte, afegeix --fix per netejar.',
    args: '--fix',
    mutatesData: true,
  },
  {
    name: 'Reset plantilles email',
    file: 'scripts/reset-email-templates.ts',
    command: 'npx tsx scripts/reset-email-templates.ts',
    category: 'fix',
    description: 'Elimina les personalitzacions de plantilles email de la BD. Torna als defaults del codi.',
    args: '<slug>',
    danger: true,
    mutatesData: true,
  },
  {
    name: 'Actualitzar PVP pack',
    file: 'scripts/update-pack-prices.ts',
    command: 'npx tsx scripts/update-pack-prices.ts <slug> <preu>',
    category: 'fix',
    description: "Canvia el preu base d'un pack.",
    args: '<slug> <preu>',
    mutatesData: true,
  },
  {
    name: 'Leads estancats',
    file: 'scripts/check-stale-leads.ts',
    command: 'npx tsx scripts/check-stale-leads.ts',
    category: 'check',
    description: 'Detecta leads que necessiten atenció: sense contactar, sense seguiment, negociacions estancades o events propers sense confirmar.',
  },
  {
    name: 'Qualitat de dades',
    file: 'scripts/check-data-quality.ts',
    command: 'npx tsx scripts/check-data-quality.ts',
    category: 'check',
    description: 'Auditoria de qualitat: camps buits, emails duplicats, reserves amb data passada activa, inventari sobreutilitzat i settings buides.',
  },
  {
    name: 'Informe mensual',
    file: 'scripts/monthly-report.ts',
    command: 'npx tsx scripts/monthly-report.ts',
    category: 'report',
    description: 'Resum mes actual vs anterior: leads, reserves, ingressos, conversio i fonts.',
    args: '<YYYY-MM>',
  },
  {
    name: 'Autofix master',
    file: 'scripts/autofix-master.ts',
    command: 'npx tsx scripts/autofix-master.ts',
    category: 'audit',
    description: 'Orquestrador que executa 5 autofix: system health, finances, CSS, GA4 i health check general.',
    mutatesData: true,
  },
  {
    name: 'Autofix finances',
    file: 'scripts/autofix-finance-health.ts',
    command: 'npx tsx scripts/autofix-finance-health.ts',
    category: 'audit',
    description: 'Verifica i corregeix configuració econòmica: pricing model, profitabilitat i cost engine.',
    mutatesData: true,
  },
  {
    name: 'Autofix sistema',
    file: 'scripts/autofix-system-health.ts',
    command: 'npx tsx scripts/autofix-system-health.ts',
    category: 'audit',
    description: 'Valida CSS admin, costos horaris inventari, marges packs i salut econòmica general.',
    mutatesData: true,
  },
  {
    name: 'Scan hardcoded',
    file: 'scripts/scan-hardcoded.js',
    command: 'node scripts/scan-hardcoded.js',
    category: 'audit',
    description: 'Detecta valors hardcoded a les traduccions: preus, anys, telèfons, km i URLs.',
  },
  {
    name: 'Scan i18n leaks',
    file: 'scripts/scan-i18n-leaks.mjs',
    command: 'node scripts/scan-i18n-leaks.mjs',
    category: 'audit',
    description: 'Detecta claus de traducció no resoltes a pàgines públiques.',
  },
  {
    name: 'Smoke test i18n',
    file: 'scripts/smoke-i18n.mjs',
    command: 'node scripts/smoke-i18n.mjs',
    category: 'audit',
    description: 'Test ràpid i18n per verificar que les pàgines públiques no mostrin claus sense traduir.',
  },
  {
    name: 'Autofix theme CSS',
    file: 'scripts/admin-theme-autofix.mjs',
    command: 'node scripts/admin-theme-autofix.mjs',
    category: 'audit',
    description: "Auto-fix colors Tailwind de l'admin i opacitats inconsistents.",
    mutatesData: true,
  },
  {
    name: 'Auditoria visual',
    file: 'scripts/visual-audit.ts',
    command: 'npx tsx scripts/visual-audit.ts',
    category: 'audit',
    description: 'Captura screenshots de totes les pàgines públiques amb Playwright.',
  },
];


export default function ScriptsClient() {
  const [filter, setFilter] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<{ command: string; message: string } | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return SCRIPTS;
    return SCRIPTS.filter((s) => s.category === filter);
  }, [filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, ScriptInfo[]> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filtered]);
  const sensitiveCount = SCRIPTS.filter((script) => script.mutatesData || script.danger).length;
  const dangerousCount = SCRIPTS.filter((script) => script.danger).length;
  const activeCategoryInfo = filter ? ADMIN_SCRIPT_CATEGORY_INFO[filter as ScriptInfo['category']] : null;
  const actionTitle = !filter
    ? 'Entrar per categoria abans d’executar res'
    : dangerousCount > 0 && filter === 'fix'
      ? `Revisar ${activeCategoryInfo?.label || 'la categoria'} amb criteri abans de llançar scripts de correcció`
      : `Treballar ${activeCategoryInfo?.label || 'la categoria'} amb la comanda correcta`;
  const actionDescription = !filter
    ? 'El retorn aquí no és mirar 30 scripts a la vegada, sinó acotar per categoria i copiar només la comanda que toca.'
    : filter === 'fix'
      ? 'Aquesta categoria toca dades reals. Cal mirar primer el text, arguments i si hi ha dry-run abans de disparar res.'
      : 'Amb la categoria acotada, el següent pas bo és copiar la comanda correcta i executar-la al terminal amb el context adequat.';

  const copyCommand = async (cmd: string) => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCommand(cmd);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      console.error('[ScriptsClient] Error copiant comanda de script', { command: cmd, error });
      setCopiedCommand(null);
      setCopyError({
        command: cmd,
        message: "No s'ha pogut copiar la comanda.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura',
          title: 'Quin estat té ara mateix el catàleg de scripts',
          tone: filter ? 'info' : 'default',
          stats: [
            { label: 'Scripts', value: SCRIPTS.length, hint: 'catàleg total' },
            { label: 'Categories', value: Object.keys(ADMIN_SCRIPT_CATEGORY_INFO).length, hint: 'blocs operatius' },
            { label: 'Toca dades', value: sensitiveCount, tone: sensitiveCount > 0 ? 'warning' : 'success', hint: 'requereixen criteri' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans d’executar',
          tone: filter === 'fix' || filter === 'audit' ? 'warning' : filter ? 'info' : 'default',
          items: [
            filter
              ? `Filtre actiu sobre ${activeCategoryInfo?.label || filter}: ${filtered.length} scripts visibles.`
              : 'Sense filtre actiu: estàs veient el catàleg complet de scripts i eines.',
            sensitiveCount > 0
              ? `${sensitiveCount} scripts poden tocar dades/config; ${dangerousCount} està marcat com a destructiu.`
              : 'No hi ha scripts marcats com a sensibles.',
            copiedCommand
              ? `Última comanda copiada: ${copiedCommand}`
              : copyError
                ? `No s'ha pogut copiar: ${copyError.command}`
              : 'Encara no has copiat cap comanda en aquesta sessió.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: actionTitle,
          description: actionDescription,
          tone: filter === 'fix' || filter === 'audit' ? 'warning' : 'success',
          secondaryPills: [
            filter ? activeCategoryInfo?.label || filter : 'Sense filtre',
            copiedCommand ? 'Comanda copiada' : 'Sense còpia',
          ],
        }}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.entries(ADMIN_SCRIPT_CATEGORY_INFO) as Array<[ScriptInfo['category'], (typeof ADMIN_SCRIPT_CATEGORY_INFO)[ScriptInfo['category']]]>).map(([key, info]) => {
          const count = SCRIPTS.filter((s) => s.category === key).length;
          const isActive = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(isActive ? null : key)}
              className={`ap-kpi text-left transition-all ${isActive ? info.tone : 'admin-tone-idle'}`}
            >
              <div className="text-lg">{info.icon}</div>
              <div className="ap-kpi-label mt-1">{info.label}</div>
              <div className="ap-kpi-value">{count}</div>
            </button>
          );
        })}
      </div>

      {filter && (
        <button type="button" onClick={() => setFilter(null)} className="ap-btn ap-btn--secondary text-xs">
          Mostrar tots ({SCRIPTS.length})
        </button>
      )}

      {Object.entries(grouped).map(([cat, scripts]) => {
        const info = ADMIN_SCRIPT_CATEGORY_INFO[cat as ScriptInfo['category']];
        return (
          <div key={cat}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide admin-tone-text-neutral">
              <span>{info.icon}</span> {info.label}
            </h2>
            <div className="space-y-2">
              {scripts.map((s) => (
                <div key={s.file + s.name} className={`ap-card rounded-2xl p-4 transition-all hover:admin-tone-bg-neutral ${s.danger ? 'ap-card--danger' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{s.name}</span>
                        {s.danger && <span className="ap-badge ap-badge--danger">destructiu</span>}
                        {!s.danger && s.mutatesData && <span className="ap-badge ap-badge--warning">toca dades</span>}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed admin-tone-text-neutral">{s.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="ap-badge rounded-lg border px-2 py-1 font-mono text-xs">{s.command}</code>
                        <button
                          type="button"
                          onClick={() => copyCommand(s.command)}
                          aria-invalid={copyError?.command === s.command ? true : undefined}
                          aria-describedby={
                            copyError?.command === s.command
                              ? `script-copy-error-${s.file.replace(/[^a-zA-Z0-9_-]/g, '-')}-${s.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`
                              : undefined
                          }
                          className="ap-btn ap-btn--secondary px-2 py-1 text-xs"
                          title="Copiar comanda"
                        >
                          {copiedCommand === s.command ? 'Copiat' : 'Copiar'}
                        </button>
                      </div>
                      {copyError?.command === s.command && (
                        <p
                          id={`script-copy-error-${s.file.replace(/[^a-zA-Z0-9_-]/g, '-')}-${s.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
                          role="alert"
                          className="mt-2 text-xs admin-tone-text-danger"
                        >
                          {copyError.message}
                        </p>
                      )}
                      {s.args && (
                        <div className="mt-1 text-xs admin-tone-text-slate">
                          Arguments opcionals: <code className="font-mono">{s.args}</code>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 font-mono text-xs admin-tone-text-slate">{s.file}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="ap-card rounded-2xl p-5">
        <h3 className="mb-2 text-sm font-semibold">Com executar</h3>
        <ol className="list-inside list-decimal space-y-1 text-xs admin-tone-text-neutral">
          <li>Obre un terminal a la carpeta del projecte</li>
          <li>Copia la comanda clicant el botó `Copiar`</li>
          <li>Enganxa i executa al terminal</li>
          <li>Els scripts amb <code className="ap-badge rounded px-1 font-mono">--fix</code> modifiquen dades: primer executa sense per veure el report</li>
        </ol>
      </div>
    </div>
  );
}
