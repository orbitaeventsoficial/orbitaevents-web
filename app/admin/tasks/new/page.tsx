'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import '../tasks.css';
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

  return (
    <div className="tk__form-shell">
      <header className="tk__form-header">
        <Link href={customerHubTasksHref} className="tk__form-back">
          ← {customerId ? 'Client' : 'Tasques'}
        </Link>
        <div className="tk__form-head-text">
          <h1 className="tk__form-title">Nova tasca</h1>
          <p className="tk__form-sub">{subtitle}</p>
        </div>
      </header>

      <div className="tk__form-body">
        <form onSubmit={onSubmit} className="tk__form-card">
          <div className="tk__form-field">
            <label htmlFor="task-title" className="tk__form-label">Títol</label>
            <input
              id="task-title"
              className="tk__form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="tk__form-field">
            <label htmlFor="task-desc" className="tk__form-label">Descripció</label>
            <textarea
              id="task-desc"
              className="tk__form-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="tk__form-2col">
            <div className="tk__form-field">
              <label htmlFor="task-due" className="tk__form-label">Data límit</label>
              <input
                id="task-due"
                type="date"
                className="tk__form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="tk__form-field">
              <label htmlFor="task-priority" className="tk__form-label">Prioritat</label>
              <select
                id="task-priority"
                className="tk__form-select"
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

          {error && <p className="tk__form-err">{error}</p>}

          <div className="tk__form-footer">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="tk__btn tk__btn--prim"
            >
              {submitting ? 'Creant...' : 'Crear tasca'}
            </button>
            <Link href={customerHubTasksHref} className="tk__btn">
              Cancel·lar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function normalizeTaskPriority(value: string | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
    return value;
  }
  return 'MEDIUM';
}
