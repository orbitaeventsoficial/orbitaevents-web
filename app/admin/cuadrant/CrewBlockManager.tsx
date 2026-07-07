'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';

export interface BlockManagerPerson {
  key: string; // collaboratorId o 'OWNER'
  name: string;
  isOwner: boolean;
}
export interface BlockManagerBlock {
  id: string;
  personName: string;
  dateKey: string;
  startLabel: string | null;
  endLabel: string | null;
  allDay: boolean;
  reason: string | null;
}

type CrewBlockMutationError = {
  error?: string;
  message?: string;
};

async function readCrewBlockMutationError(res: Response, fallback: string): Promise<string> {
  const payload = (await res.json().catch(() => ({}))) as CrewBlockMutationError;
  return payload.error || payload.message || fallback;
}

export default function CrewBlockManager({
  people,
  blocks,
}: {
  people: BlockManagerPerson[];
  blocks: BlockManagerBlock[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState(people[0]?.key ?? 'OWNER');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!date) { toast.error('Posa una data.'); return; }
    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/cuadrant/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaboratorId: person === 'OWNER' ? null : person,
          date, startTime: startTime || null, endTime: endTime || null, reason: reason || null,
        }),
      });
      if (!res.ok) throw new Error(await readCrewBlockMutationError(res, "No s'ha pogut afegir el bloqueig."));
      toast.success('Bloqueig afegit.');
      setDate(''); setStartTime(''); setEndTime(''); setReason('');
      router.refresh();
    } catch (e) {
      console.error('[CrewBlock] add', e);
      toast.error(e instanceof Error && e.message ? e.message : "No s'ha pogut afegir el bloqueig.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/cuadrant/blocks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readCrewBlockMutationError(res, "No s'ha pogut treure el bloqueig."));
      toast.success('Bloqueig tret.');
      router.refresh();
    } catch (e) {
      console.error('[CrewBlock] remove', e);
      toast.error(e instanceof Error && e.message ? e.message : "No s'ha pogut treure el bloqueig.");
    }
  };

  return (
    <section className="mt-6 ap-card p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider opacity-70"
      >
        <span>Disponibilitat · bloquejos manuals ({blocks.length})</span>
        <span>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-3">
          {/* Formulari */}
          <div className="flex flex-wrap items-end gap-2 ap-card p-2.5">
            <label className="flex flex-col gap-0.5 text-xs opacity-60">
              Persona
              <select value={person} onChange={(e) => setPerson(e.target.value)} className="rounded adm-input text-xs" aria-label="Persona del bloqueig">
                {people.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 text-xs opacity-60">
              Dia
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded adm-input text-xs" />
            </label>
            <label className="flex flex-col gap-0.5 text-xs opacity-60">
              De (opc.)
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded adm-input text-xs" />
            </label>
            <label className="flex flex-col gap-0.5 text-xs opacity-60">
              A (opc.)
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded adm-input text-xs" />
            </label>
            <label className="flex flex-1 flex-col gap-0.5 text-xs opacity-60">
              Motiu (opc.)
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vacances, altre bolo…" className="rounded adm-input text-xs" />
            </label>
            <button type="button" onClick={add} disabled={saving} className="ap-btn ap-btn--primary ap-btn--xs">
              {saving ? 'Desant…' : 'Afegir'}
            </button>
          </div>

          {/* Llista de bloquejos */}
          {blocks.length > 0 && (
            <ul className="mt-2 space-y-1">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between ap-card px-2.5 py-1 text-xs">
                  <span className="opacity-80">
                    <span className="font-semibold">{b.personName}</span> · {b.dateKey.slice(8)}/{b.dateKey.slice(5, 7)} ·{' '}
                    {b.allDay ? 'tot el dia' : `${b.startLabel}–${b.endLabel ?? '?'}`}
                    {b.reason && <span className="opacity-60"> · {b.reason}</span>}
                  </span>
                  <button type="button" onClick={() => remove(b.id)} className="admin-tone-text-danger transition-opacity hover:opacity-70" aria-label="Treure bloqueig">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
