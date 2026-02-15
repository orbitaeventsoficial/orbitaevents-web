'use client';

import { useState } from 'react';

type LeadNoteItem = {
  id: string;
  content: string;
  createdBy: string | null;
  createdAt: string;
};

function formatNoteDate(value: string) {
  return new Date(value).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LeadNotesPanel({
  leadId,
  initialNotes,
}: {
  leadId: string;
  initialNotes: LeadNoteItem[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const deleteNote = async (noteId: string) => {
    const confirmed = window.confirm('Vols eliminar aquesta nota?');
    if (!confirmed) return;
    setDeletingId(noteId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No s’ha pogut eliminar la nota');
      }
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error eliminant nota');
    } finally {
      setDeletingId(null);
    }
  };

  const cleanDuplicates = async () => {
    if (cleaning) return;
    setCleaning(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}/notes`, {
        method: 'PUT',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No s’han pogut netejar duplicats');
      if ((data.deleted || 0) > 0) {
        setSuccess(`S'han eliminat ${data.deleted} notes duplicades.`);
        window.location.reload();
      } else {
        setSuccess('No hi havia notes duplicades.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error netejant duplicats');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-200">Notes ({notes.length})</h2>
        <button
          type="button"
          onClick={cleanDuplicates}
          disabled={cleaning}
          className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
        >
          {cleaning ? 'Netejant...' : 'Netejar duplicats'}
        </button>
      </div>
      {error && (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      {success && (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Encara no hi ha notes</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="p-3 rounded-lg bg-slate-50 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{formatNoteDate(note.createdAt)}</span>
                  {note.createdBy && <span className="text-xs text-slate-400">per {note.createdBy}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  disabled={deletingId === note.id}
                  className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  {deletingId === note.id ? 'Eliminant...' : 'Eliminar'}
                </button>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

