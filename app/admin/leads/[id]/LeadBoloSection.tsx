'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import BookingServiceLinesSection from '@/app/admin/bookings/BookingServiceLinesSection';
import type { BookingServiceLineFormInput, BookingPack } from '@/app/admin/bookings/booking-form.types';

/**
 * El BOLO dins la fitxa del lead (Fase 1.4 de docs/bolo-flux.md).
 * Reutilitza el configurador (catàleg dreta → bolo esquerra). Carrega/desa contra
 * `LeadServiceLine` via /api/admin/leads/[id]/service-lines. El pack base és una
 * línia més del bolo (kind especial gestionat al configurador).
 */
export default function LeadBoloSection({ leadId }: { leadId: string }) {
  const toast = useToast();
  const [lines, setLines] = useState<BookingServiceLineFormInput[]>([]);
  const [packs, setPacks] = useState<BookingPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [customPackPrice, setCustomPackPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [linesRes, packsRes] = await Promise.all([
          fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`),
          fetchWithCsrf('/api/admin/packs'),
        ]);
        if (!alive) return;
        if (linesRes.ok) {
          const d = await linesRes.json();
          const loaded = (d.lines || []).map((l: {
            collaboratorId?: string | null; kind: string; label: string;
            revenueAmount?: number | null; costAmount?: number | null; quantity?: number | null; notes?: string | null;
          }) => ({
            collaboratorId: l.collaboratorId ?? undefined,
            kind: l.kind as BookingServiceLineFormInput['kind'],
            label: l.label,
            revenueAmount: l.revenueAmount ?? undefined,
            costAmount: l.costAmount ?? undefined,
            quantity: l.quantity ?? 1,
            notes: l.notes ?? undefined,
          }));
          setLines(loaded);
        }
        if (packsRes.ok) {
          const p = await packsRes.json();
          const packList = (p.packs || p.data || []) as BookingPack[];
          setPacks(packList.filter((x) => x.translations?.length));
        }
      } catch (e) {
        console.error('[LeadBolo] càrrega', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [leadId]);

  const onLinesChange = useCallback((next: BookingServiceLineFormInput[]) => {
    setLines(next);
    setDirty(true);
  }, []);
  const onPackSelect = useCallback((packId: string) => {
    setSelectedPackId(packId);
    setCustomPackPrice('');
    setDirty(true);
  }, []);

  // El pack triat es desa com una línia més del bolo (kind OTHER, label del pack).
  const buildAllLines = useCallback((): BookingServiceLineFormInput[] => {
    const pack = packs.find((p) => p.id === selectedPackId);
    if (!pack) return lines;
    const packLine: BookingServiceLineFormInput = {
      kind: 'OTHER',
      label: `Pack: ${pack.translations?.[0]?.name || pack.slug}`,
      revenueAmount: customPackPrice ? Number(customPackPrice) : pack.price,
      quantity: 1,
    };
    return [packLine, ...lines];
  }, [packs, selectedPackId, customPackPrice, lines]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: buildAllLines() }),
      });
      if (!res.ok) throw new Error('No s\'ha pogut desar');
      toast.success('Bolo desat.');
      setDirty(false);
    } catch (e) {
      console.error('[LeadBolo] desar', e);
      toast.error('Error desant el bolo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="fxd__panel">
        <div className="fxd__panelhead"><span>El bolo</span></div>
        <p className="fxd__hint-inline">Carregant…</p>
      </section>
    );
  }

  return (
    <section className="fxd__panel">
      <div className="fxd__panelhead">
        <span>El bolo</span>
        <button type="button" className="fxd__btn fxd__btn--primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Desant…' : 'Desar bolo'}
        </button>
      </div>
      <BookingServiceLinesSection
        lines={lines}
        onChange={onLinesChange}
        packs={packs}
        selectedPackId={selectedPackId}
        onPackSelect={onPackSelect}
        customPackPrice={customPackPrice}
        onCustomPackPriceChange={(v) => { setCustomPackPrice(v); setDirty(true); }}
      />
    </section>
  );
}
