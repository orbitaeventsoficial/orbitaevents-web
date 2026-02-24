'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/constants';

type LeadNoteItem = {
  id: string;
  content: string;
  createdBy: string | null;
  createdAt: string;
};

function formatNoteDate(value: string) {
  return formatDateTime(value);
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
      const res = await fetch(`/api/admin/leads/${leadId}/notes?noteId=${noteId}`, {
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
      const res = await fetch(`/api/admin/leads/${leadId}/notes`, {
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
    <section className="rounded-xl border border-white/10 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Notes ({notes.length})</h2>
        <button
          type="button"
          onClick={cleanDuplicates}
          disabled={cleaning}
          className="rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-60"
        >
          {cleaning ? 'Netejant...' : 'Netejar duplicats'}
        </button>
      </div>
      {error && (
        <p className="mb-3 rounded-lg border px-3 py-2 text-sm">{error}</p>
      )}
      {success && (
        <p className="mb-3 rounded-lg border px-3 py-2 text-sm">{success}</p>
      )}

      {notes.length === 0 ? (
        <p className="text-sm py-4 text-center">Encara no hi ha notes</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border p-3 transition-colors">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{formatNoteDate(note.createdAt)}</span>
                  {note.createdBy && <span className="text-xs">per {note.createdBy}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  disabled={deletingId === note.id}
                  className="rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-60"
                >
                  {deletingId === note.id ? 'Eliminant...' : 'Eliminar'}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

