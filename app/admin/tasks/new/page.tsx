'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminPage } from '../../components/AdminPage';
import { fetchWithCsrf } from '@/lib/csrf';
import { useAsyncForm } from '../../components/useAsyncForm';
import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { buildCustomerHubTaskHref } from '@/lib/customer-hub/taskResultNotice';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get('customerId') || '';
  const formOrigin = searchParams?.get('source') || '';
  const taskSource = searchParams?.get('taskSource') || '';
  const dedupeKey = searchParams?.get('dedupeKey') || '';
  const customerHubTasksHref = customerId ? buildCustomerWorkspaceTabHref(customerId, 'tasks') : '/admin/tasks';
  const [title, setTitle] = useState(searchParams?.get('title') || '');
  const [description, setDescription] = useState(searchParams?.get('description') || '');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>(
    normalizeTaskPriority(searchParams?.get('priority') ?? null)
  );
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
            source: taskSource || undefined,
            dedupeKey: dedupeKey || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'No s’ha pogut crear la tasca');

        if (customerId) {
          const taskResult = data?.reopened ? 'reopened' : data?.deduped ? 'deduped' : 'created';
          router.push(buildCustomerHubTaskHref(customerId, formOrigin || null, taskResult));
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
      subtitle={formOrigin === 'reactivation'
        ? 'Deixa la reactivació registrada com a tasca explícita abans d’executar cap enviament.'
        : 'Crea una tasca operativa vinculada al client.'}
      back={{ href: customerHubTasksHref, label: customerId ? 'Client' : 'Tasques' }}
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
            href={customerHubTasksHref}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Cancel·lar
          </Link>
        </div>
      </form>
    </AdminPage>
  );
}

function normalizeTaskPriority(value: string | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
    return value;
  }
  return 'MEDIUM';
}
