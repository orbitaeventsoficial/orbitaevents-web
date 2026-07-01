'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

function divergencePct(publicPrice: number, recommendedPrice: number): number {
  if (!Number.isFinite(recommendedPrice) || recommendedPrice <= 0) return 0;
  return ((publicPrice - recommendedPrice) / recommendedPrice) * 100;
}

function badgeClass(value: number, threshold: number): string {
  const abs = Math.abs(value);
  if (abs >= threshold) return 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger';
  if (abs >= threshold * 0.5) return 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning';
  return 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success';
}

export default function PackPriceQuickEditor({
  packId,
  initialPrice,
  initialExtraHourPrice,
  recommendedPrice,
  recommendedExtraHourPrice,
  alertThreshold,
}: {
  packId: string;
  initialPrice: number;
  initialExtraHourPrice: number;
  recommendedPrice: number;
  recommendedExtraHourPrice: number;
  alertThreshold: number;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(initialPrice.toFixed(2));
  const [extraHourPrice, setExtraHourPrice] = useState(initialExtraHourPrice.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const priceNum = Number(price);
  const extraNum = Number(extraHourPrice);
  const packDiv = useMemo(() => divergencePct(priceNum, recommendedPrice), [priceNum, recommendedPrice]);
  const extraDiv = useMemo(() => divergencePct(extraNum, recommendedExtraHourPrice), [extraNum, recommendedExtraHourPrice]);

  const overallClass = useMemo(() => {
    const worst = Math.max(Math.abs(packDiv), Math.abs(extraDiv));
    return badgeClass(worst, alertThreshold);
  }, [packDiv, extraDiv, alertThreshold]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/packs/${packId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Number.isFinite(priceNum) ? priceNum : initialPrice,
          extraHourPrice: Number.isFinite(extraNum) ? extraNum : initialExtraHourPrice,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'No s\'ha pogut desar el PVP');
      setMsg('PVP desat');
      router.refresh();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error en desar');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'adm-input w-full text-sm';

  return (
    <>
      <div className="ap-card p-2">
        <p className="">Pack PVP (editable)</p>
        <input className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
      </div>
      <div className="ap-card p-2">
        <p className="">Hora extra PVP (editable)</p>
        <input className={inputClass} value={extraHourPrice} onChange={(e) => setExtraHourPrice(e.target.value)} inputMode="decimal" />
      </div>
      <div className={`col-span-2 ap-card p-2 ${overallClass}`}>
        <p className="font-semibold">Semàfor preu pack: {packDiv >= 0 ? '+' : ''}{packDiv.toFixed(1)}%</p>
        <p className="font-semibold">Semàfor hora extra: {extraDiv >= 0 ? '+' : ''}{extraDiv.toFixed(1)}%</p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md border border-[var(--line)] bg-[var(--raised)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--raised)] disabled:opacity-60"
          >
            {saving ? 'Desant...' : 'Desar PVP'}
          </button>
          {msg && <span className="text-xs">{msg}</span>}
        </div>
      </div>
    </>
  );
}

