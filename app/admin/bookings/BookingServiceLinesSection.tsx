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

  return (
    <section className="nb__section">
      <h3 className="nb__section-title">Serveis i productes (fora de pack)</h3>
      {leadHints && leadHints.length > 0 && (
        <p className="nb__hint">El lead havia mostrat interès en: {leadHints.join(', ')}</p>
      )}

      <div className="nb__sl-adders">
        <label className="nb__field" style={{ maxWidth: 220 }}>
          <span className="nb__label">+ Servei d&apos;Òrbita</span>
          <select className="nb__input" value="" onChange={(e) => { addOrbitaService(e.target.value); e.target.value = ''; }} aria-label="Afegir servei d'Òrbita">
            <option value="">Tria…</option>
            {ORBITA_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.label} · {s.defaultPrice}€{s.unit === 'hour' ? '/h' : ''}</option>
            ))}
          </select>
        </label>
        <label className="nb__field" style={{ maxWidth: 260 }}>
          <span className="nb__label">+ Producte de partner</span>
          <select className="nb__input" value="" onChange={(e) => { addPartnerProduct(e.target.value); e.target.value = ''; }} aria-label="Afegir producte de partner">
            <option value="">{partnerProducts.length ? 'Tria…' : 'Cap producte actiu'}</option>
            {partnerProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.collaboratorName} · {p.name} · {p.sellPrice}€</option>
            ))}
          </select>
        </label>
        <button type="button" className="nb__btn-ghost" onClick={addFreeLine}>+ Línia lliure</button>
      </div>

      {lines.length === 0 ? (
        <p className="nb__hint">Cap servei addicional. Afegeix DJ extra, tècnic, animació o pintacares.</p>
      ) : (
        <div className="nb__sl-list">
          {lines.map((line, idx) => (
            <div key={idx} className="nb__sl-row">
              <input
                className="nb__input nb__sl-label"
                placeholder="Descripció"
                value={line.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                aria-label="Descripció de la línia"
              />
              <input
                className="nb__input nb__sl-num" type="number" min={0} placeholder="PVP"
                value={line.revenueAmount ?? ''}
                onChange={(e) => update(idx, { revenueAmount: e.target.value ? Number(e.target.value) : undefined })}
                aria-label="Preu de venda"
              />
              <input
                className="nb__input nb__sl-num" type="number" min={0} placeholder="Cost"
                value={line.costAmount ?? ''}
                onChange={(e) => update(idx, { costAmount: e.target.value ? Number(e.target.value) : undefined })}
                aria-label="Cost"
              />
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
    </section>
  );
}
