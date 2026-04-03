'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminPage } from '../../components/AdminPage';
import { fetchWithCsrf } from '@/lib/csrf';
import { useAsyncForm } from '../../components/useAsyncForm';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get('customerId') || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const { submitting, error, run } = useAsyncForm();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || submitting) return;

    try {
      await run(async () => {
        const res = await fetchWithCsrf('/api/admin/tasks', {
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
          router.push(`/admin/clientes/${customerId}?tab=tasks`);
        } else {
          router.push('/admin/tasks');
        }
        router.refresh();
      });
    } catch {
      // L'error queda centralitzat al hook.
    }
  };

  return (
    <AdminPage
      title="Nova tasca"
      subtitle="Crea una tasca operativa vinculada al client."
      back={{ href: '/admin/tasks', label: 'Tasques' }}
      className="max-w-3xl"
    >
      <form onSubmit={onSubmit} className="rounded-2xl border p-6 space-y-4">
        <label className="flex flex-col gap-1 text-sm">
          Títol
          <input
            className="rounded-xl border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Descripció
          <textarea
            className="rounded-xl border px-3 py-2"
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
              className="rounded-xl border px-3 py-2"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Prioritat
            <select
              className="rounded-xl border px-3 py-2"
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

        {error && <p className="rounded-xl border px-3 py-2 text-sm">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Creant...' : 'Crear tasca'}
          </button>
          <Link
            href={customerId ? `/admin/clientes/${customerId}?tab=tasks` : '/admin/tasks'}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Cancel·lar
          </Link>
        </div>
      </form>
    </AdminPage>
  );
}
