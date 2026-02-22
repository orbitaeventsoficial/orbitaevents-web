'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          priority,
          status: 'OPEN',
          createdBy: 'Admin',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'No s’ha pogut crear la tasca');

      if (customerId) {
        router.push(`/admin/contactes/${customerId}?tab=tasks`);
      } else {
        router.push('/admin/tasks');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creant tasca');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="rounded-2xl border p-6">
        <h1 className="text-xl font-semibold">Nova tasca</h1>
        <p className="mt-1 text-sm">Crea una tasca operativa vinculada al client.</p>
      </header>

      <form onSubmit={onSubmit} className="rounded-2xl border p-6 space-y-4">
        <label className="flex flex-col gap-1 text-sm">
          Títol
          <input
            className="rounded-lg border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Descripció
          <textarea
            className="rounded-lg border px-3 py-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Data límit
            <input
              type="date"
              className="rounded-lg border px-3 py-2"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Prioritat
            <select
              className="rounded-lg border px-3 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Mitjana</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>
        </div>

        {error && (
          <p className="rounded-lg border px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardant...' : 'Crear tasca'}
          </button>
          <Link
            href={customerId ? `/admin/contactes/${customerId}?tab=tasks` : '/admin/tasks'}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Cancel·lar
          </Link>
        </div>
      </form>
    </div>
  );
}

