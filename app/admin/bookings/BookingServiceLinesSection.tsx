'use client';

/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Configurador del bolo (línies de servei)
   ----------------------------------------------------------------------------
   Canònic: AdminSection + .adm-input + Tailwind/tokens (canonització 2026-06-30,
   sistema propi `nb-*` eradicat). Bolo (esquerra) + catàleg en cascada (dreta).
============================================================================ */

import { useEffect, useState } from 'react';
import { ORBITA_SERVICES, SOUND_TECH_PRICE, SOUND_TECH_DURATION, productIncludesSoundTech } from '@/lib/constants/orbita-services';
import { CUSTOM_BOOKING_PACK_SLUG } from '@/lib/constants/pricing';
import { AdminSection } from '../components/AdminPage';
import { NB_HINT, NB_NUM_BARE } from './booking-form-classes';
import type { BookingServiceLineFormInput, BookingPack } from './booking-form.types';

interface PartnerProductOption {
  id: string;
  name: string;
  category: string | null;
  crew: string | null;
  costPrice: number;
  sellPrice: number;
  collaboratorId: string;
  collaboratorName: string;
  roles: string[];
}

interface BookingServiceLinesSectionProps {
  lines: BookingServiceLineFormInput[];
  onChange: (lines: BookingServiceLineFormInput[]) => void;
  /** Productes que ja formen part de la reserva com a base canònica (pack/extres).
   *  Es mostren dins el bolo però no s'envien com a serviceLines per no duplicar imports. */
  baseLines?: BookingServiceLineFormInput[];
  /** Packs de catàleg (base excloent del bolo). Opcional: a la fitxa de reserva
   *  ja existents el pack es gestiona a part, així que el grup no es mostra. */
  packs?: BookingPack[];
  selectedPackId?: string;
  onPackSelect?: (packId: string) => void;
  customPackPrice?: string;
  onCustomPackPriceChange?: (value: string) => void;
  /** Interessos del lead (interestedExtras) com a pista informativa. */
  leadHints?: string[];
  /** Encastat dins un altre panell (ex. fitxa del lead): sense panell ni capçalera pròpia. */
  embedded?: boolean;
}

// ── Classes canòniques locals del configurador (tokens de /studio) ───────────
const SL_LIST = 'flex flex-col gap-2';
const SL_ROW = 'flex flex-wrap items-center gap-2';
const SL_ROW_BASE = 'flex flex-wrap items-center gap-2 rounded-[var(--o-r-sm)] border border-[color-mix(in_oklab,var(--gold)_24%,var(--line))] bg-[color-mix(in_oklab,var(--gold)_6%,transparent)] px-2.5 py-1.5';
const SL_ROW_PACK = 'flex flex-wrap items-center gap-2 rounded-[var(--o-r-sm)] border border-[color-mix(in_oklab,var(--gold)_30%,var(--line))] bg-[color-mix(in_oklab,var(--gold)_8%,transparent)] px-2.5 py-1.5';
const SL_LABEL = 'min-w-0 flex-1 basis-[12.5rem]';
const SL_NUM = `adm-input w-[5.75rem] shrink-0 grow-0 basis-[5.75rem] ${NB_NUM_BARE}`;
const SL_QTY = `adm-input w-16 shrink-0 grow-0 text-center ${NB_NUM_BARE}`;
const SL_PAYER = 'adm-input min-w-0 shrink-0 grow-0 basis-40';
const SL_NOTE = 'inline-flex w-[5.75rem] shrink-0 items-center justify-center text-xs italic text-[var(--t3)]';
const SL_READONLY = 'inline-flex w-[5.75rem] shrink-0 items-center justify-end text-sm font-semibold text-[var(--t)]';
const SL_DEL = 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--o-r-sm)] border border-[color-mix(in_oklab,var(--o-stage-lost)_40%,var(--line))] bg-transparent text-sm text-[var(--o-stage-lost)] transition-colors hover:bg-[color-mix(in_oklab,var(--o-stage-lost)_12%,transparent)]';
const GRP = 'overflow-hidden rounded-[var(--o-r-sm)] border border-[var(--line)]';
const GRP_MENU = 'relative overflow-visible rounded-[var(--o-r-sm)] border border-[var(--line)]';
const SUMMARY = 'flex cursor-pointer items-center gap-2 list-none bg-[color-mix(in_oklab,var(--raised)_70%,var(--panel))] px-3 py-2.5 text-xs font-semibold text-[var(--t2)] [&::-webkit-details-marker]:hidden [[open]>&]:text-[var(--gold)]';
const SUMMARY_PACKS = `${SUMMARY} [[open]>&]:border-b [[open]>&]:border-[var(--line)]`;
const CHEVRON = 'text-[0.6rem] opacity-60 transition-transform [[open]_&]:rotate-90';
const MENU_ITEMS = 'flex max-h-[min(22rem,58vh)] flex-col overflow-y-auto rounded-b-[var(--o-r-sm)] border-t border-[color-mix(in_oklab,var(--line)_55%,transparent)] bg-[color-mix(in_oklab,var(--panel)_96%,var(--canvas))]';
const ITEM = 'flex w-full items-center justify-between gap-2 border-t border-[color-mix(in_oklab,var(--line)_50%,transparent)] bg-transparent px-3 py-2 text-left text-sm text-[var(--t)] transition-colors first:border-t-0 hover:bg-[color-mix(in_oklab,var(--gold)_10%,transparent)]';
const ITEM_NAME = 'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap';
const ITEM_PRICE = 'shrink-0 font-semibold tabular-nums text-[var(--gold)]';
const GHOST_BTN = 'min-h-9 self-start rounded-[var(--o-r-sm)] border border-dashed border-[var(--line)] bg-transparent px-3.5 text-xs font-semibold text-[var(--t2)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]';

function packLabel(pack: BookingPack): string {
  return pack.translations?.[0]?.name || pack.slug;
}

export default function BookingServiceLinesSection({
  lines,
  onChange,
  baseLines = [],
  packs = [],
  selectedPackId = '',
  onPackSelect,
  customPackPrice = '',
  onCustomPackPriceChange,
  leadHints,
  embedded = false,
}: BookingServiceLinesSectionProps) {
  const packsEnabled = !!onPackSelect;
  const [partnerProducts, setPartnerProducts] = useState<PartnerProductOption[]>([]);

  useEffect(() => {
    fetch('/api/admin/collaborator-products', { headers: { 'x-admin': '1' } })
      .then((r) => r.json())
      .then((d) => { if (d?.ok && Array.isArray(d.products)) setPartnerProducts(d.products); })
      .catch((e) => console.error('[ServiceLines] Error carregant productes', e));
  }, []);

  const update = (idx: number, patch: Partial<BookingServiceLineFormInput>) => {
    onChange(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const remove = (idx: number) => onChange(lines.filter((_, i) => i !== idx));

  const addOrbitaService = (id: string) => {
    const svc = ORBITA_SERVICES.find((s) => s.id === id);
    if (!svc) return;
    const newLine = { kind: svc.kind, label: svc.label, revenueAmount: svc.defaultPrice, quantity: 1 };
    // Regla DJ: la 1a hora (150€) sempre és obligatòria abans d'una hora addicional (100€).
    // No es pot afegir una hora extra sola. Si encara no hi ha 1a hora, s'afegeixen les dues.
    const isDjExtra = svc.kind === 'DJ' && svc.unit === 'hour';
    if (isDjExtra) {
      const firstHour = ORBITA_SERVICES.find((s) => s.kind === 'DJ' && s.unit === 'unit');
      const hasFirstHour = firstHour && lines.some((l) => l.label === firstHour.label);
      if (firstHour && !hasFirstHour) {
        onChange([...lines,
          { kind: firstHour.kind, label: firstHour.label, revenueAmount: firstHour.defaultPrice, quantity: 1 },
          newLine,
        ]);
        return;
      }
    }
    onChange([...lines, newLine]);
  };

  const addPartnerProduct = (id: string) => {
    const p = partnerProducts.find((x) => x.id === id);
    if (!p) return;
    // Si el producte porta tècnic de so intrínsec, el separem com a línia pròpia
    // (cost SOUND_TECH_PRICE) perquè es pugui triar qui el cobra: el proveïdor
    // (per defecte) o Òrbita. El total no canvia: el producte baixa el cost del
    // tècnic i la línia de tècnic el recupera.
    const hasTech = productIncludesSoundTech(p.crew);
    const productCost = hasTech ? Math.max(0, p.costPrice - SOUND_TECH_PRICE) : p.costPrice;
    // Una línia de lloguer de material (col·laborador EQUIPMENT_RENTAL, p.ex. Tino)
    // és `EQUIPMENT`: això activa el transport d'anar a buscar-lo al càlcul del bolo.
    // La resta de proveïdors presencials (Masquerade) són `PROVIDER_SERVICE`.
    const isRental = Array.isArray(p.roles) && p.roles.includes('EQUIPMENT_RENTAL');
    const productLine: BookingServiceLineFormInput = {
      collaboratorId: p.collaboratorId,
      kind: isRental ? 'EQUIPMENT' : 'PROVIDER_SERVICE',
      label: `${p.name} (${p.collaboratorName})`,
      revenueAmount: p.sellPrice,
      costAmount: productCost,
      quantity: 1,
    };
    if (!hasTech) {
      onChange([...lines, productLine]);
      return;
    }
    const techLine: BookingServiceLineFormInput = {
      collaboratorId: p.collaboratorId, // per defecte el tècnic el posa el proveïdor
      kind: 'SOUND_TECH',
      label: `Tècnic de so inclòs · ${SOUND_TECH_DURATION}`,
      revenueAmount: 0, // ja inclòs al PVP del producte
      costAmount: SOUND_TECH_PRICE,
      quantity: 1,
    };
    onChange([...lines, productLine, techLine]);
  };

  const addFreeLine = () => onChange([...lines, { kind: 'OTHER', label: '', revenueAmount: 0, quantity: 1 }]);

  // Packs de catàleg (sense el tècnic "Personalitzat", que és la base buida).
  const catalogPacks = packs.filter((p) => p.slug !== CUSTOM_BOOKING_PACK_SLUG);
  const selectedPack = packs.find((p) => p.id === selectedPackId) || null;
  const packPrice = selectedPack
    ? (customPackPrice ? Number(customPackPrice) : selectedPack.price)
    : 0;

  // Catàleg agrupat per proveïdor extern.
  const partnersByName = partnerProducts.reduce<Record<string, PartnerProductOption[]>>((acc, p) => {
    (acc[p.collaboratorName] ||= []).push(p);
    return acc;
  }, {});
  // Qui pot cobrar un tècnic de so: Òrbita (sense id) o qualsevol proveïdor del catàleg.
  const soundTechPayers = Array.from(
    new Map(partnerProducts.map((p) => [p.collaboratorId, p.collaboratorName])).entries()
  ).map(([id, name]) => ({ id, name }));
  const linesTotal = lines.reduce((s, l) => s + (l.revenueAmount || 0) * (l.quantity || 1), 0);
  const baseLinesTotal = baseLines.reduce((s, l) => s + (l.revenueAmount || 0) * (l.quantity || 1), 0);
  const boloTotal = packPrice + baseLinesTotal + linesTotal;

  const body = (
    <>
      {leadHints && leadHints.length > 0 && (
        <p className={NB_HINT}>El lead havia mostrat interès en: {leadHints.join(', ')}</p>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_18.75rem]">
        {/* ESQUERRA — el bolo */}
        <div className="flex min-w-0 flex-col gap-2.5 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_60%,transparent)] p-3.5">
          {!embedded && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--t3)]">El bolo</span>
              {boloTotal > 0 && <span className="text-base font-bold tabular-nums text-[var(--gold)]">{boloTotal}€</span>}
            </div>
          )}

          {/* Pack base (excloent) — només al flux de nova reserva */}
          {packsEnabled && (selectedPack ? (
            <div className={SL_ROW_PACK}>
              <span className={`${SL_LABEL} font-semibold text-[var(--t)]`}>★ {packLabel(selectedPack)}</span>
              <input
                className={SL_NUM} type="number" min={0}
                placeholder={String(selectedPack.price)}
                value={customPackPrice} onChange={(e) => onCustomPackPriceChange?.(e.target.value)}
                aria-label="Preu del pack"
              />
              <span className="inline-flex w-[5.75rem] shrink-0 items-center justify-center text-xs italic text-[var(--t3)]">preu del pack</span>
              <button type="button" className={SL_DEL} onClick={() => onPackSelect?.('')} aria-label="Treure el pack">✕</button>
            </div>
          ) : (
            <p className="px-1.5 py-4 text-center text-sm text-[var(--t3)]">Sense pack base · muntar-lo personalitzat amb serveis</p>
          ))}

          {baseLines.length > 0 && (
            <div className="mb-1 flex flex-col gap-1.5" aria-label="Base contractada">
              {baseLines.map((line, idx) => (
                <div key={`base-${idx}`} className={SL_ROW_BASE}>
                  <span className={`${SL_LABEL} font-semibold text-[var(--t)]`}>{line.label}</span>
                  <span className={SL_READONLY}>{line.revenueAmount ?? 0}€</span>
                  <span className={SL_NOTE}>contractat</span>
                  <span className="inline-flex w-16 shrink-0 items-center justify-center text-sm text-[var(--t)]">{line.quantity ?? 1}</span>
                  <span className="inline-flex h-9 w-9 shrink-0 cursor-default items-center justify-center text-[var(--t3)] opacity-45" aria-hidden="true">•</span>
                </div>
              ))}
            </div>
          )}

          {/* Línies de servei (sumables) */}
          {lines.length > 0 && (
            <div className={SL_LIST}>
              {lines.map((line, idx) => (
                <div key={idx} className={SL_ROW}>
                  <input
                    className={`adm-input ${SL_LABEL}`} placeholder="Descripció"
                    value={line.label} onChange={(e) => update(idx, { label: e.target.value })}
                    aria-label="Descripció de la línia"
                  />
                  <input
                    className={SL_NUM} type="number" min={0} placeholder="PVP"
                    value={line.revenueAmount ?? ''}
                    onChange={(e) => update(idx, { revenueAmount: e.target.value ? Number(e.target.value) : undefined })}
                    aria-label="Preu de venda"
                  />
                  {line.kind === 'SOUND_TECH' && (
                    <select
                      className={SL_PAYER}
                      value={line.collaboratorId ?? ''}
                      onChange={(e) => update(idx, { collaboratorId: e.target.value || undefined })}
                      aria-label="Qui cobra el tècnic de so"
                      title="Qui posa (i cobra) el tècnic de so"
                    >
                      <option value="">Tècnic: Òrbita (jo)</option>
                      {soundTechPayers.map((p) => (
                        <option key={p.id} value={p.id}>Tècnic: {p.name}</option>
                      ))}
                    </select>
                  )}
                  {line.kind === 'SOUND_TECH' && line.costAmount != null ? (
                    <span className={SL_READONLY} title={line.collaboratorId ? 'Cost del tècnic inclòs al producte; es paga al proveïdor seleccionat.' : 'Cost intern del tècnic inclòs al producte; queda assignat a Òrbita.'}>{line.costAmount}€</span>
                  ) : line.collaboratorId ? (
                    <span className={SL_NOTE} title="El cost a pagar al partner es gestiona a la seva fitxa">cost</span>
                  ) : (line.kind === 'DJ' || line.kind === 'EQUIPMENT') ? (
                    <span className={SL_NOTE} title="Cost d'equip propi (DJ / material): ja inclòs al cost operatiu fix del bolo. No es compta per línia (es duplicaria).">a operatiu</span>
                  ) : (
                    <input
                      className={SL_NUM} type="number" min={0} placeholder="Cost"
                      value={line.costAmount ?? ''}
                      onChange={(e) => update(idx, { costAmount: e.target.value ? Number(e.target.value) : undefined })}
                      aria-label="Cost intern"
                    />
                  )}
                  <input
                    className={SL_QTY} type="number" min={1} placeholder="Qt"
                    value={line.quantity ?? 1}
                    onChange={(e) => update(idx, { quantity: e.target.value ? Number(e.target.value) : 1 })}
                    aria-label="Quantitat"
                  />
                  <button type="button" className={SL_DEL} onClick={() => remove(idx)} aria-label="Eliminar línia">✕</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className={GHOST_BTN} onClick={addFreeLine}>+ Línia lliure</button>
        </div>

        {/* DRETA — catàleg disponible */}
        <aside className="flex flex-col gap-2">
          {/* 1. Packs (excloent) — només al flux de nova reserva */}
          {packsEnabled && (
          <details className={GRP} open>
            <summary className={SUMMARY_PACKS}>Packs d&apos;Òrbita Events</summary>
            <div className="flex flex-col">
              {catalogPacks.map((pack) => (
                <button
                  type="button" key={pack.id}
                  className={`${ITEM}${selectedPackId === pack.id ? ' bg-[var(--ax-gold-tint-1)] text-[var(--gold-bright)]' : ''}`}
                  onClick={() => onPackSelect?.(selectedPackId === pack.id ? '' : pack.id)}
                >
                  <span className={ITEM_NAME}>{packLabel(pack)}</span>
                  <span className={ITEM_PRICE}>{pack.price}€</span>
                </button>
              ))}
              <button
                type="button"
                className={`${ITEM}${!selectedPackId ? ' bg-[var(--ax-gold-tint-1)] text-[var(--gold-bright)]' : ''}`}
                onClick={() => onPackSelect?.('')}
              >
                <span className={ITEM_NAME}>Pack personalitzat (munta&apos;l tu)</span>
                <span className={ITEM_PRICE}>—</span>
              </button>
            </div>
          </details>
          )}

          {/* 2. Productes propis d'Òrbita (sumables) — tot junt */}
          <details className={GRP_MENU}>
            <summary className={SUMMARY}><span className={CHEVRON} aria-hidden="true">▸</span>Productes d&apos;Òrbita</summary>
            <div className={MENU_ITEMS}>
              {ORBITA_SERVICES.map((s) => (
                <button type="button" key={s.id} className={ITEM} onClick={() => addOrbitaService(s.id)}>
                  <span className={ITEM_NAME}>{s.label}</span>
                  <span className={ITEM_PRICE}>{s.defaultPrice}€{s.unit === 'hour' ? '/h' : ''}</span>
                </button>
              ))}
            </div>
          </details>

          {/* 3. Proveïdors externs — un desplegable per proveïdor, tancat per
              defecte (no surt fins que el cliques). El nom apareix un sol cop. */}
          {Object.keys(partnersByName).length > 0 && (
            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t3)]">Proveïdors</span>
          )}
          {Object.entries(partnersByName).map(([name, prods]) => (
            <details className={GRP_MENU} key={name}>
              <summary className={SUMMARY}><span className={CHEVRON} aria-hidden="true">▸</span>{name}</summary>
              <div className={MENU_ITEMS}>
                {prods.map((p) => (
                  <button type="button" key={p.id} className={ITEM} onClick={() => addPartnerProduct(p.id)}>
                    <span className={ITEM_NAME}>{p.name}</span>
                    <span className={ITEM_PRICE}>{p.sellPrice}€</span>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </aside>
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <AdminSection title="El bolo" description="Tria un pack base i afegeix-hi serveis des del catàleg →">
      {body}
    </AdminSection>
  );
}
