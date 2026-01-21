'use client';

import { useState } from 'react';

type LeadTask = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  priority: string;
  createdAt: string;
};

type LeadDocument = {
  id: string;
  title: string;
  fileUrl: string;
  type: string;
  source: string;
  createdAt: string;
};

type LeadActivity = {
  id: string;
  type: string;
  title?: string | null;
  description?: string | null;
  createdBy?: string | null;
  createdAt: string;
};

export default function LeadWorkspace({
  leadId,
  initialTasks,
  initialDocuments,
  initialActivities,
}: {
  leadId: string;
  initialTasks: LeadTask[];
  initialDocuments: LeadDocument[];
  initialActivities: LeadActivity[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [documents, setDocuments] = useState(initialDocuments);
  const [activities, setActivities] = useState(initialActivities);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('FILE');
  const [docFile, setDocFile] = useState<File | null>(null);

  const refreshActivities = async () => {
    const res = await fetch(`/api/admin/leads-new/${leadId}/activities`);
    if (!res.ok) return;
    const data = await res.json();
    setActivities(data.activities || []);
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    const res = await fetch(`/api/admin/leads-new/${leadId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskTitle.trim(),
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setTasks((prev) => [data.task, ...prev]);
    refreshActivities();
    setTaskTitle('');
    setTaskDueDate('');
    setTaskPriority('MEDIUM');
  };

  const updateTask = async (taskId: string, status: string) => {
    const res = await fetch(`/api/admin/leads-new/${leadId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setTasks((prev) => prev.map((task) => (task.id === taskId ? data.task : task)));
    refreshActivities();
  };

  const deleteTask = async (taskId: string) => {
    const res = await fetch(`/api/admin/leads-new/${leadId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) return;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    refreshActivities();
  };

  const uploadDocument = async () => {
    if (!docFile || !docTitle.trim()) return;
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('title', docTitle.trim());
    formData.append('type', docType);
    formData.append('createdBy', 'Admin');

    const res = await fetch(`/api/admin/leads-new/${leadId}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return;
    const data = await res.json();
    setDocuments((prev) => [data.document, ...prev]);
    refreshActivities();
    setDocTitle('');
    setDocType('FILE');
    setDocFile(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-700">Tasques pendents</h2>
          <span className="text-sm text-slate-500">{tasks.length} tasques</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700"
            placeholder="Nova tasca"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            aria-label="Nova tasca"
          />
          <input
            type="date"
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            aria-label="Data de venciment"
          />
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            aria-label="Prioritat"
          >
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Mitjana</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <button
          type="button"
          onClick={addTask}
          aria-label="Afegir tasca"
          className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
        >
          Afegir tasca
        </button>

        <div className="mt-6 space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500">No hi ha tasques actives.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.dueDate ? `Venciment: ${task.dueDate.slice(0, 10)}` : 'Sense data'} · {task.priority}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {task.status !== 'DONE' && (
                    <button
                      type="button"
                      onClick={() => updateTask(task.id, 'DONE')}
                      aria-label={`Marcar tasca ${task.title} com feta`}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      Marcar feta
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Eliminar tasca ${task.title}`}
                    className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Documents</h2>
        <div className="mt-3 grid gap-2">
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700"
            placeholder="Títol del document"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            aria-label="Títol del document"
          />
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            aria-label="Tipus de document"
          >
            <option value="QUOTE">Pressupost</option>
            <option value="CONTRACT">Contracte</option>
            <option value="INVOICE">Factura</option>
            <option value="IMAGE">Imatge</option>
            <option value="FILE">Arxiu</option>
            <option value="OTHER">Altres</option>
          </select>
          <input
            type="file"
            className="text-sm text-slate-600"
            onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            aria-label="Arxiu del document"
          />
          <button
            type="button"
            onClick={uploadDocument}
            aria-label="Pujar document"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Pujar document
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">Sense documents.</p>
          ) : (
            documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-stone-300"
              >
                <div className="font-medium">{doc.title}</div>
                <div className="text-xs text-slate-500">{doc.type} · {doc.source}</div>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-3">
        <h2 className="text-lg font-semibold text-slate-700">Timeline d'activitat</h2>
        <div className="mt-4 space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500">Sense activitat registrada.</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{activity.title || activity.type}</p>
                  {activity.description && (
                    <p className="text-xs text-slate-500">{activity.description}</p>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(activity.createdAt).toLocaleDateString('ca-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
