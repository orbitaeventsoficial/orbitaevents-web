'use client';

import { useEffect, useState } from 'react';
import { ORBITA_SERVICES } from '@/lib/constants/orbita-services';
import type { BookingServiceLineFormInput } from './booking-form.types';

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
  /** Interessos del lead (interestedExtras) com a pista informativa. */
  leadHints?: string[];
}

export default function BookingServiceLinesSection({ lines, onChange, leadHints }: BookingServiceLinesSectionProps) {
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

  // Catàleg agrupat per font (dreta): Òrbita Events + cada proveïdor extern.
  const partnersByName = partnerProducts.reduce<Record<string, PartnerProductOption[]>>((acc, p) => {
    (acc[p.collaboratorName] ||= []).push(p);
    return acc;
  }, {});
  const linesTotal = lines.reduce((s, l) => s + (l.revenueAmount || 0) * (l.quantity || 1), 0);

  return (
    <section className="nb__panel">
      <div className="nb__phead">
        <h2 className="nb__h2">Serveis i productes</h2>
        <span className="nb__pintro">Munta el bolo des del catàleg de la dreta</span>
      </div>
      {leadHints && leadHints.length > 0 && (
        <p className="nb__hint">El lead havia mostrat interès en: {leadHints.join(', ')}</p>
      )}

      <div className="nb__cfg">
        {/* ESQUERRA — el bolo */}
        <div className="nb__cfg-bolo">
          <div className="nb__cfg-bolohead">
            <span className="nb__cfg-bolotitle">El bolo</span>
            {lines.length > 0 && <span className="nb__cfg-bolototal">{linesTotal}€</span>}
          </div>
          {lines.length === 0 ? (
            <p className="nb__cfg-empty">Encara buit. Afegeix serveis des del catàleg de la dreta →</p>
          ) : (
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
                    <span className="nb__sl-partnercost" title="El cost a pagar al partner es gestiona a la seva fitxa">cost a partner ↗</span>
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

        {/* DRETA — catàleg disponible, agrupat per font */}
        <aside className="nb__cfg-cat">
          <details className="nb__cfg-grp" open>
            <summary>Serveis d&apos;Òrbita Events</summary>
            <div className="nb__cfg-items">
              {ORBITA_SERVICES.map((s) => (
                <button type="button" key={s.id} className="nb__cfg-item" onClick={() => addOrbitaService(s.id)}>
                  <span className="nb__cfg-itemname">{s.label}</span>
                  <span className="nb__cfg-itemprice">{s.defaultPrice}€{s.unit === 'hour' ? '/h' : ''}</span>
                </button>
              ))}
            </div>
          </details>

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

          {Object.keys(partnersByName).length === 0 && (
            <p className="nb__hint">Cap proveïdor amb productes actius.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
