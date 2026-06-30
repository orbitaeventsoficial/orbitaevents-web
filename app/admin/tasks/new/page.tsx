'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { AdminPage, AdminSection } from '../../components/AdminPage';
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
        if (!res.ok || !data?.ok) throw new Error(data?.error || "No s'ha pogut crear la tasca");

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

  const subtitle = formOrigin === 'reactivation'
    ? "Deixa la reactivació registrada com a tasca explícita abans d'executar cap enviament."
    : "Crea una tasca operativa vinculada al client.";

  const labelClass = 'text-xs font-bold uppercase tracking-[0.06em] text-[var(--t2)]';

  return (
    <AdminPage
      title="Nova tasca"
      subtitle={subtitle}
      back={{ href: customerHubTasksHref, label: customerId ? 'Client' : 'Tasques' }}
    >
      <AdminSection>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-title" className={labelClass}>Títol</label>
            <input
              id="task-title"
              className="adm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-desc" className={labelClass}>Descripció</label>
            <textarea
              id="task-desc"
              className="adm-input adm-input--textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-due" className={labelClass}>Data límit</label>
              <input
                id="task-due"
                type="date"
                className="adm-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-priority" className={labelClass}>Prioritat</label>
              <select
                id="task-priority"
                className="adm-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                aria-label="Prioritat de la tasca"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Mitjana</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-[var(--o-r-md)] border admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger p-2.5 text-xs">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="ap-btn ap-btn--primary"
            >
              {submitting ? 'Creant...' : 'Crear tasca'}
            </button>
            <Link href={customerHubTasksHref} className="ap-btn">
              Cancel·lar
            </Link>
          </div>
        </form>
      </AdminSection>
    </AdminPage>
  );
}

function normalizeTaskPriority(value: string | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
    return value;
  }
  return 'MEDIUM';
}
