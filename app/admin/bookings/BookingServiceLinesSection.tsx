'use client';

import './nb-design.css';
import { useEffect, useState } from 'react';
import { ORBITA_SERVICES } from '@/lib/constants/orbita-services';
import { CUSTOM_BOOKING_PACK_SLUG } from '@/lib/constants/pricing';
import type { BookingServiceLineFormInput, BookingPack } from './booking-form.types';

interface PartnerProductOption {
  id: string;
  name: string;
  category: string | null;
  costPrice: number;
  sellPrice: number;
  collaboratorId: string;
  collaboratorName: string;
}

interface BookingServiceLinesSectionProps {
  lines: BookingServiceLineFormInput[];
  onChange: (lines: BookingServiceLineFormInput[]) => void;
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
    onChange([...lines, { kind: svc.kind, label: svc.label, revenueAmount: svc.defaultPrice, quantity: 1 }]);
  };

  const addPartnerProduct = (id: string) => {
    const p = partnerProducts.find((x) => x.id === id);
    if (!p) return;
    onChange([...lines, {
      collaboratorId: p.collaboratorId,
      kind: 'PROVIDER_SERVICE',
      label: `${p.name} (${p.collaboratorName})`,
      revenueAmount: p.sellPrice,
      costAmount: p.costPrice,
      quantity: 1,
    }]);
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
  const linesTotal = lines.reduce((s, l) => s + (l.revenueAmount || 0) * (l.quantity || 1), 0);
  const boloTotal = packPrice + linesTotal;

  const body = (
    <>
      {leadHints && leadHints.length > 0 && (
        <p className="nb__hint">El lead havia mostrat interès en: {leadHints.join(', ')}</p>
      )}

      <div className="nb__cfg">
        {/* ESQUERRA — el bolo */}
        <div className="nb__cfg-bolo">
          <div className="nb__cfg-bolohead">
            <span className="nb__cfg-bolotitle">El bolo</span>
            {boloTotal > 0 && <span className="nb__cfg-bolototal">{boloTotal}€</span>}
          </div>

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
                  {line.collaboratorId ? (
                    <span className="nb__sl-partnercost" title="El cost a pagar al partner es gestiona a la seva fitxa">cost</span>
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

          {/* 2. Complements d'Òrbita (sumables) */}
          <details className="nb__cfg-grp">
            <summary>Complements d&apos;Òrbita Events</summary>
            <div className="nb__cfg-items">
              {ORBITA_SERVICES.map((s) => (
                <button type="button" key={s.id} className="nb__cfg-item" onClick={() => addOrbitaService(s.id)}>
                  <span className="nb__cfg-itemname">{s.label}</span>
                  <span className="nb__cfg-itemprice">{s.defaultPrice}€{s.unit === 'hour' ? '/h' : ''}</span>
                </button>
              ))}
            </div>
          </details>

          {/* 3. Serveis de proveïdors (sumables) */}
          {Object.entries(partnersByName).map(([name, prods]) => (
            <details className="nb__cfg-grp" key={name}>
              <summary>Serveis de {name}</summary>
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
