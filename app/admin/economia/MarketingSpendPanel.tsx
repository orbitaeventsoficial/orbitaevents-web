'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { SOURCE_LABELS, LEAD_SOURCE_VALUES, formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';

interface SpendEntry {
  id: string;
  channel: string;
  year: number;
  month: number;
  amount: number;
  notes: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function MarketingSpendPanel() {
  const router = useRouter();
  const toast = useToast();
  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [channel, setChannel] = useState<string>('GOOGLE');
  const [period, setPeriod] = useState<string>(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/marketing/spend');
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch (error) {
      console.error('[MarketingSpendPanel] load', error);
      toast.error('No s’ha pogut carregar la despesa.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value < 0) { toast.error('Import invàlid.'); return; }
    const [yStr, mStr] = period.split('-');
    const year = Number(yStr);
    const month = Number(mStr);
    if (!year || !month) { toast.error('Període invàlid.'); return; }

    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/marketing/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, year, month, amount: value, notes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error('save failed');
      toast.success('Despesa desada.');
      setAmount('');
      setNotes('');
      await load();
      router.refresh(); // recalcula el CAC real al servidor
    } catch (error) {
      console.error('[MarketingSpendPanel] save', error);
      toast.error('No s’ha pogut desar la despesa.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetchWithCsrf(`/api/admin/marketing/spend?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      toast.success('Despesa eliminada.');
      await load();
      router.refresh();
    } catch (error) {
      console.error('[MarketingSpendPanel] delete', error);
      toast.error('No s’ha pogut eliminar.');
    }
  }

  return (
    <section className="ap-card p-5">
      <h2 className="ap-h2 mb-1">Despesa de màrqueting</h2>
      <p className="text-xs mb-4">Carrega la inversió real per canal i mes. El CAC real es calcula dividint-la pels clients guanyats del mateix període.</p>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="flex flex-col gap-1 text-xs">
          <span>Canal</span>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="adm-input" aria-label="Canal">
            {LEAD_SOURCE_VALUES.map((v) => (
              <option key={v} value={v}>{SOURCE_LABELS[v] ?? v}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span>Mes</span>
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="adm-input" aria-label="Mes" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span>Import (€)</span>
          <input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="adm-input w-28" aria-label="Import" />
        </label>
        <label className="flex flex-col gap-1 text-xs flex-1 min-w-[10rem]">
          <span>Nota (opcional)</span>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: campanya estiu" className="adm-input" aria-label="Nota" />
        </label>
        <button type="button" onClick={save} disabled={saving} className="ap-btn ap-btn--primary">
          {saving ? 'Desant…' : 'Desar despesa'}
        </button>
      </div>

      {loading ? (
        <p className="text-xs">Carregant…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs">Encara no hi ha despesa carregada. El CAC real es mostrarà quan n’afegeixis.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[420px] w-full text-sm" aria-label="Despesa de màrqueting carregada">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider">
                <th scope="col" className="px-3 py-2">Canal</th>
                <th scope="col" className="px-3 py-2">Mes</th>
                <th scope="col" className="px-3 py-2 text-right">Import</th>
                <th scope="col" className="px-3 py-2">Nota</th>
                <th scope="col" className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {entries.map((e) => (
                <tr key={e.id} className="adm-row-hover">
                  <td className="px-3 py-2 font-medium">{SOURCE_LABELS[e.channel] ?? e.channel}</td>
                  <td className="px-3 py-2">{e.year}-{pad(e.month)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(e.amount)}</td>
                  <td className="px-3 py-2 text-xs">{e.notes ?? ''}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => remove(e.id)} className="ap-btn ap-btn--secondary ap-btn--xs" aria-label={`Eliminar despesa ${e.channel} ${e.year}-${pad(e.month)}`}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
