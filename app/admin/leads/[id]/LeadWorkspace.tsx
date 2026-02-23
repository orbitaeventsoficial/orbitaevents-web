'use client';

import { useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/constants';

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
  const [loadingTask, setLoadingTask] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [cleaningActivities, setCleaningActivities] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED'),
    [tasks]
  );
  const doneTasks = useMemo(
    () => tasks.filter((task) => task.status === 'DONE'),
    [tasks]
  );

  const refreshActivities = async () => {
    const res = await fetch(`/api/admin/leads/${leadId}/activities`);
    if (!res.ok) return;
    const data = await res.json();
    setActivities(data.activities || []);
  };

  const addTask = async () => {
    if (!taskTitle.trim() || loadingTask) return;
    setLoadingTask(true);
    const res = await fetch(`/api/admin/leads/${leadId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskTitle.trim(),
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
      }),
    });
    setLoadingTask(false);
    if (!res.ok) return;
    const data = await res.json();
    setTasks((prev) => [data.task, ...prev]);
    refreshActivities();
    setTaskTitle('');
    setTaskDueDate('');
    setTaskPriority('MEDIUM');
  };

  const updateTask = async (taskId: string, status: string) => {
    const res = await fetch(`/api/admin/leads/${leadId}/tasks/${taskId}`, {
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
    const res = await fetch(`/api/admin/leads/${leadId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) return;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    refreshActivities();
  };

  const uploadDocument = async () => {
    if (!docFile || !docTitle.trim() || loadingDoc) return;
    setLoadingDoc(true);
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('title', docTitle.trim());
    formData.append('type', docType);
    formData.append('createdBy', 'Admin');

    const res = await fetch(`/api/admin/leads/${leadId}/documents`, {
      method: 'POST',
      body: formData,
    });
    setLoadingDoc(false);
    if (!res.ok) return;
    const data = await res.json();
    setDocuments((prev) => [data.document, ...prev]);
    refreshActivities();
    setDocTitle('');
    setDocType('FILE');
    setDocFile(null);
  };

  const deleteActivity = async (activityId: string) => {
    const confirmed = window.confirm('Vols eliminar aquesta activitat del timeline?');
    if (!confirmed) return;

    const res = await fetch(`/api/admin/leads/${leadId}/activities/${activityId}`, {
      method: 'DELETE',
    });
    if (!res.ok) return;
    setActivities((prev) => prev.filter((activity) => activity.id !== activityId));
  };

  const cleanDuplicateActivities = async () => {
    if (cleaningActivities) return;
    setCleaningActivities(true);
    const res = await fetch(`/api/admin/leads/${leadId}/activities`, {
      method: 'DELETE',
    });
    setCleaningActivities(false);
    if (!res.ok) return;
    refreshActivities();
  };

  const deleteDocument = async (documentId: string) => {
    if (deletingDocumentId) return;
    const confirmed = window.confirm('Vols eliminar aquest document?');
    if (!confirmed) return;

    setDeletingDocumentId(documentId);
    const res = await fetch(`/api/admin/leads/${leadId}/documents/${documentId}`, {
      method: 'DELETE',
    });
    setDeletingDocumentId(null);
    if (!res.ok) return;

    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    refreshActivities();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Tasques obertes</p>
          <p className="mt-1 text-2xl font-semibold">{openTasks.length}</p>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Tasques completades</p>
          <p className="mt-1 text-2xl font-semibold">{doneTasks.length}</p>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Documents</p>
          <p className="mt-1 text-2xl font-semibold">{documents.length}</p>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Activitat</p>
          <p className="mt-1 text-2xl font-semibold">{activities.length}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section id="lead-tasks" className="rounded-2xl border p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Seguiment comercial (tasques)</h2>
            <span className="rounded-full px-2.5 py-1 text-xs font-medium">
              {openTasks.length} pendents
            </span>
          </div>
          <p className="mt-1 text-sm">
            Llista de coses que has de fer per tancar aquest lead: trucades, seguiment i properes accions.
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-12">
            <input
              className="rounded-xl border px-3 py-2 text-sm md:col-span-5"
              placeholder="Ex: Trucar per tancar pressupost"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <input
              type="date"
              className="rounded-xl border px-3 py-2 text-sm md:col-span-3"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />
            <select
              className="rounded-xl border px-3 py-2 text-sm md:col-span-2"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Mitjana</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgent</option>
            </select>
            <button
              type="button"
              onClick={addTask}
              disabled={loadingTask || !taskTitle.trim()}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
            >
              {loadingTask ? 'Creant...' : 'Afegir'}
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {tasks.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm">
                Encara no hi ha tasques en aquest lead.
              </p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-xl border p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-xs">
                        {task.dueDate ? `Venciment ${task.dueDate.slice(0, 10)}` : 'Sense data'} · Prioritat {task.priority} · Estat {task.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {task.status !== 'DONE' ? (
                        <button
                          type="button"
                          onClick={() => updateTask(task.id, 'DONE')}
                          className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                        >
                          Marcar feta
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateTask(task.id, 'OPEN')}
                          className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                        >
                          Reobrir
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section id="lead-documents" className="rounded-2xl border p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Documents comercials</h2>
          <div className="mt-3 space-y-2">
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Títol document"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
            />
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
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
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={uploadDocument}
              disabled={loadingDoc || !docTitle.trim() || !docFile}
              className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingDoc ? 'Pujant...' : 'Pujar document'}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {documents.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm">
                Encara no hi ha documents.
              </p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-sm font-semibold">{doc.title}</p>
                      <p className="text-xs">
                        {doc.type} · {doc.source} · {formatDateTime(doc.createdAt)}
                      </p>
                    </a>
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deletingDocumentId === doc.id}
                      className="rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-60"
                    >
                      {deletingDocumentId === doc.id ? 'Eliminant...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Timeline comercial</h2>
          <button
            type="button"
            onClick={cleanDuplicateActivities}
            disabled={cleaningActivities}
            className="rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-60"
          >
            {cleaningActivities ? 'Netejant...' : 'Netejar duplicats'}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {activities.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm">
              Sense activitat registrada.
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="rounded-xl border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{activity.title || activity.type}</p>
                    {activity.description && (
                      <p className="text-xs">{activity.description}</p>
                    )}
                    {activity.createdBy && (
                      <p className="text-xs">Per: {activity.createdBy}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs">{formatDateTime(activity.createdAt)}</div>
                    <button
                      type="button"
                      onClick={() => deleteActivity(activity.id)}
                      className="rounded-lg border px-2 py-1 text-xs font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

