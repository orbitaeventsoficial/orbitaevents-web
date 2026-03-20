'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

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
  const toast = useToast();
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
  const [confirmingActivityId, setConfirmingActivityId] = useState<string | null>(null);
  const [confirmingDocumentId, setConfirmingDocumentId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmingActivityId) return;
    const t = setTimeout(() => setConfirmingActivityId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmingActivityId]);

  useEffect(() => {
    if (!confirmingDocumentId) return;
    const t = setTimeout(() => setConfirmingDocumentId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmingDocumentId]);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED'),
    [tasks]
  );
  const doneTasks = useMemo(
    () => tasks.filter((task) => task.status === 'DONE'),
    [tasks]
  );

  const refreshActivities = async () => {
    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/activities`);
    if (!res.ok) return;
    const data = await res.json();
    setActivities(data.activities || []);
  };

  const addTask = async () => {
    if (!taskTitle.trim() || loadingTask) return;
    setLoadingTask(true);
    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskTitle.trim(),
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
      }),
    });
    setLoadingTask(false);
    if (!res.ok) { toast.error('Error creant tasca'); return; }
    const data = await res.json();
    setTasks((prev) => [data.task, ...prev]);
    refreshActivities();
    setTaskTitle('');
    setTaskDueDate('');
    setTaskPriority('MEDIUM');
  };

  const updateTask = async (taskId: string, status: string) => {
    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast.error('Error actualitzant tasca'); return; }
    const data = await res.json();
    setTasks((prev) => prev.map((task) => (task.id === taskId ? data.task : task)));
    refreshActivities();
  };

  const deleteTask = async (taskId: string) => {
    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) { toast.error('Error eliminant tasca'); return; }
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

    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/documents`, {
      method: 'POST',
      body: formData,
    });
    setLoadingDoc(false);
    if (!res.ok) { toast.error('Error pujant document'); return; }
    const data = await res.json();
    setDocuments((prev) => [data.document, ...prev]);
    refreshActivities();
    setDocTitle('');
    setDocType('FILE');
    setDocFile(null);
  };

  const deleteActivity = async (activityId: string) => {
    if (confirmingActivityId !== activityId) { setConfirmingActivityId(activityId); return; }
    setConfirmingActivityId(null);

    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/activities/${activityId}`, {
      method: 'DELETE',
    });
    if (!res.ok) { toast.error('Error eliminant activitat'); return; }
    setActivities((prev) => prev.filter((activity) => activity.id !== activityId));
  };

  const cleanDuplicateActivities = async () => {
    if (cleaningActivities) return;
    setCleaningActivities(true);
    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/activities`, {
      method: 'DELETE',
    });
    setCleaningActivities(false);
    if (!res.ok) { toast.error('Error netejant activitats'); return; }
    refreshActivities();
  };

  const deleteDocument = async (documentId: string) => {
    if (deletingDocumentId) return;
    if (confirmingDocumentId !== documentId) { setConfirmingDocumentId(documentId); return; }
    setConfirmingDocumentId(null);
    setDeletingDocumentId(documentId);
    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/documents/${documentId}`, {
      method: 'DELETE',
    });
    setDeletingDocumentId(null);
    if (!res.ok) { toast.error('Error eliminant document'); return; }

    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    refreshActivities();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="ap-card p-4">
          <p className="text-xs uppercase tracking-wide">Tasques obertes</p>
          <p className="mt-1 text-2xl font-semibold">{openTasks.length}</p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs uppercase tracking-wide">Tasques completades</p>
          <p className="mt-1 text-2xl font-semibold">{doneTasks.length}</p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs uppercase tracking-wide">Documents</p>
          <p className="mt-1 text-2xl font-semibold">{documents.length}</p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs uppercase tracking-wide">Activitat</p>
          <p className="mt-1 text-2xl font-semibold">{activities.length}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section id="lead-tasks" className="ap-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Seguiment comercial (tasques)</h2>
            <span className="ap-badge px-2.5 py-1 text-xs">
              {openTasks.length} pendents
            </span>
          </div>
          <p className="mt-1 text-sm">
            Llista de coses que has de fer per tancar aquest lead: trucades, seguiment i properes accions.
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-12">
            <input
              className="ap-input px-3 py-2 text-sm md:col-span-5"
              placeholder="Ex: Trucar per tancar pressupost"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <input
              type="date"
              className="ap-input px-3 py-2 text-sm md:col-span-3"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />
            <select
              className="ap-input px-3 py-2 text-sm md:col-span-2"
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
              className="ap-btn ap-btn--primary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
            >
              {loadingTask ? 'Creant...' : 'Afegir'}
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {tasks.length === 0 ? (
              <p className="ap-card p-4 text-sm">
                Encara no hi ha tasques en aquest lead.
              </p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="ap-card p-3">
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
                          className="ap-btn ap-btn--secondary px-2.5 py-1 text-xs"
                        >
                          Marcar feta
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateTask(task.id, 'OPEN')}
                          className="ap-btn ap-btn--secondary px-2.5 py-1 text-xs"
                        >
                          Reobrir
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="ap-btn ap-btn--secondary px-2.5 py-1 text-xs"
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

        <section id="lead-documents" className="ap-card p-5">
          <h2 className="text-lg font-semibold">Documents comercials</h2>
          <div className="mt-3 space-y-2">
            <input
              className="ap-input w-full px-3 py-2 text-sm"
              placeholder="Títol document"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
            />
            <select
              className="ap-input w-full px-3 py-2 text-sm"
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
              className="w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={uploadDocument}
              disabled={loadingDoc || !docTitle.trim() || !docFile}
              className="ap-btn ap-btn--primary w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingDoc ? 'Pujant...' : 'Pujar document'}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {documents.length === 0 ? (
              <p className="ap-card p-4 text-sm">
                Encara no hi ha documents.
              </p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="ap-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
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
                      className={`ap-btn px-2.5 py-1 text-xs disabled:opacity-60 ${confirmingDocumentId === doc.id ? 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger' : 'ap-btn--secondary'}`}
                    >
                      {deletingDocumentId === doc.id ? 'Eliminant...' : confirmingDocumentId === doc.id ? 'Segur?' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="ap-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Timeline comercial</h2>
          <button
            type="button"
            onClick={cleanDuplicateActivities}
            disabled={cleaningActivities}
            className="ap-btn ap-btn--secondary px-2.5 py-1 text-xs disabled:opacity-60"
          >
            {cleaningActivities ? 'Netejant...' : 'Netejar duplicats'}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {activities.length === 0 ? (
            <p className="ap-card p-4 text-sm">
              Sense activitat registrada.
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="ap-card p-3">
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
                      className={`ap-btn px-2 py-1 text-xs ${confirmingActivityId === activity.id ? 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger' : 'ap-btn--secondary'}`}
                    >
                      {confirmingActivityId === activity.id ? 'Segur?' : 'Eliminar'}
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








