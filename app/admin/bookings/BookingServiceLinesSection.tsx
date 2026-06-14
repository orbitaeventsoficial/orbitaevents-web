'use client';

import './nb-design.css';
import { useEffect, useState } from 'react';
import { ORBITA_SERVICES, SOUND_TECH_PRICE, SOUND_TECH_DURATION, productIncludesSoundTech } from '@/lib/constants/orbita-services';
import { CUSTOM_BOOKING_PACK_SLUG } from '@/lib/constants/pricing';
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
      label: `Tècnic de so · ${SOUND_TECH_DURATION}`,
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
        <p className="nb__hint">El lead havia mostrat interès en: {leadHints.join(', ')}</p>
      )}

      <div className="nb__cfg">
        {/* ESQUERRA — el bolo */}
        <div className="nb__cfg-bolo">
          {!embedded && (
            <div className="nb__cfg-bolohead">
              <span className="nb__cfg-bolotitle">El bolo</span>
              {boloTotal > 0 && <span className="nb__cfg-bolototal">{boloTotal}€</span>}
            </div>
          )}

          {/* Pack base (excloent) — només al flux de nova reserva */}
          {packsEnabled && (selectedPack ? (
            <div className="nb__sl-row nb__sl-row--pack">
              <span className="nb__sl-label nb__sl-packname">★ {packLabel(selectedPack)}</span>
              <input
                className="nb__input nb__sl-num" type="number" min={0}
                placeholder={String(selectedPack.price)}
                value={customPackPrice} onChange={(e) => onCustomPackPriceChange?.(e.target.value)}
                aria-label="Preu del pack"
              />
              <span className="nb__sl-packhint">preu del pack</span>
              <button type="button" className="nb__sl-del" onClick={() => onPackSelect?.('')} aria-label="Treure el pack">✕</button>
            </div>
          ) : (
            <p className="nb__cfg-empty">Sense pack base · muntar-lo personalitzat amb serveis</p>
          ))}

          {baseLines.length > 0 && (
            <div className="nb__sl-list nb__sl-list--base" aria-label="Base contractada">
              {baseLines.map((line, idx) => (
                <div key={`base-${idx}`} className="nb__sl-row nb__sl-row--base">
                  <span className="nb__sl-label nb__sl-packname">{line.label}</span>
                  <span className="nb__sl-num nb__sl-readonly">{line.revenueAmount ?? 0}€</span>
                  <span className="nb__sl-owncost">contractat</span>
                  <span className="nb__sl-qty">{line.quantity ?? 1}</span>
                  <span className="nb__sl-del nb__sl-del--ghost" aria-hidden="true">•</span>
                </div>
              ))}
            </div>
          )}

          {/* Línies de servei (sumables) */}
          {lines.length > 0 && (
            <div className="nb__sl-list">
              {lines.map((line, idx) => (
                <div key={idx} className="nb__sl-row">
                  <input
                    className="nb__input nb__sl-label" placeholder="Descripció"
                    value={line.label} onChange={(e) => update(idx, { label: e.target.value })}
                    aria-label="Descripció de la línia"
                  />
                  <input
                    className="nb__input nb__sl-num" type="number" min={0} placeholder="PVP"
                    value={line.revenueAmount ?? ''}
                    onChange={(e) => update(idx, { revenueAmount: e.target.value ? Number(e.target.value) : undefined })}
                    aria-label="Preu de venda"
                  />
                  {line.kind === 'SOUND_TECH' && (
                    <select
                      className="nb__input nb__sl-payer"
                      value={line.collaboratorId ?? ''}
                      onChange={(e) => update(idx, { collaboratorId: e.target.value || undefined })}
                      aria-label="Qui cobra el tècnic de so"
                      title="Qui posa (i cobra) el tècnic de so"
                    >
                      <option value="">Tècnic: Òrbita</option>
                      {soundTechPayers.map((p) => (
                        <option key={p.id} value={p.id}>Tècnic: {p.name}</option>
                      ))}
                    </select>
                  )}
                  {line.collaboratorId ? (
                    <span className="nb__sl-partnercost" title="El cost a pagar al partner es gestiona a la seva fitxa">cost</span>
                  ) : (line.kind === 'DJ' || line.kind === 'EQUIPMENT') ? (
                    <span className="nb__sl-owncost" title="Cost d'equip propi (DJ / material): ja inclòs al cost operatiu fix del bolo. No es compta per línia (es duplicaria).">a operatiu</span>
                  ) : (
                    <input
                      className="nb__input nb__sl-num" type="number" min={0} placeholder="Cost"
                      value={line.costAmount ?? ''}
                      onChange={(e) => update(idx, { costAmount: e.target.value ? Number(e.target.value) : undefined })}
                      aria-label="Cost intern"
                    />
                  )}
                  <input
                    className="nb__input nb__sl-qty" type="number" min={1} placeholder="Qt"
                    value={line.quantity ?? 1}
                    onChange={(e) => update(idx, { quantity: e.target.value ? Number(e.target.value) : 1 })}
                    aria-label="Quantitat"
                  />
                  <button type="button" className="nb__sl-del" onClick={() => remove(idx)} aria-label="Eliminar línia">✕</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="nb__btn-ghost nb__cfg-free" onClick={addFreeLine}>+ Línia lliure</button>
        </div>

        {/* DRETA — catàleg disponible */}
        <aside className="nb__cfg-cat">
          {/* 1. Packs (excloent) — només al flux de nova reserva */}
          {packsEnabled && (
          <details className="nb__cfg-grp" open>
            <summary>Packs d&apos;Òrbita Events</summary>
            <div className="nb__cfg-items">
              {catalogPacks.map((pack) => (
                <button
                  type="button" key={pack.id}
                  className={`nb__cfg-item${selectedPackId === pack.id ? ' is-on' : ''}`}
                  onClick={() => onPackSelect?.(selectedPackId === pack.id ? '' : pack.id)}
                >
                  <span className="nb__cfg-itemname">{packLabel(pack)}</span>
                  <span className="nb__cfg-itemprice">{pack.price}€</span>
                </button>
              ))}
              <button
                type="button"
                className={`nb__cfg-item${!selectedPackId ? ' is-on' : ''}`}
                onClick={() => onPackSelect?.('')}
              >
                <span className="nb__cfg-itemname">Pack personalitzat (munta&apos;l tu)</span>
                <span className="nb__cfg-itemprice">—</span>
              </button>
            </div>
          </details>
          )}

          {/* 2. Productes propis d'Òrbita (sumables) — tot junt */}
          <details className="nb__cfg-grp nb__cfg-grp--menu">
            <summary>Productes d&apos;Òrbita</summary>
            <div className="nb__cfg-items">
              {ORBITA_SERVICES.map((s) => (
                <button type="button" key={s.id} className="nb__cfg-item" onClick={() => addOrbitaService(s.id)}>
                  <span className="nb__cfg-itemname">{s.label}</span>
                  <span className="nb__cfg-itemprice">{s.defaultPrice}€{s.unit === 'hour' ? '/h' : ''}</span>
                </button>
              ))}
            </div>
          </details>

          {/* 3. Proveïdors externs — un desplegable per proveïdor, tancat per
              defecte (no surt fins que el cliques). El nom apareix un sol cop. */}
          {Object.keys(partnersByName).length > 0 && (
            <span className="nb__cfg-grouplbl">Proveïdors</span>
          )}
          {Object.entries(partnersByName).map(([name, prods]) => (
            <details className="nb__cfg-grp nb__cfg-grp--menu nb__cfg-grp--provider" key={name}>
              <summary>{name}</summary>
              <div className="nb__cfg-items">
                {prods.map((p) => (
                  <button type="button" key={p.id} className="nb__cfg-item" onClick={() => addPartnerProduct(p.id)}>
                    <span className="nb__cfg-itemname">{p.name}</span>
                    <span className="nb__cfg-itemprice">{p.sellPrice}€</span>
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
    <section className="nb__panel">
      <div className="nb__phead">
        <h2 className="nb__h2">El bolo</h2>
        <span className="nb__pintro">Tria un pack base i afegeix-hi serveis des del catàleg →</span>
      </div>
      {body}
    </section>
  );
}
