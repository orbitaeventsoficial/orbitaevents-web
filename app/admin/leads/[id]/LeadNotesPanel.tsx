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
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">Notes ({notes.length})</h2>
      {error && (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Encara no hi ha notes</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="p-3 rounded-lg bg-slate-50 hover:bg-stone-100 transition-colors">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{formatNoteDate(note.createdAt)}</span>
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
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
