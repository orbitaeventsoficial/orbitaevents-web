// app/admin/emails/RecentEmailsTable.tsx
'use client';

interface Activity {
  id: string;
  action: string;
  createdAt: Date;
  customer: {
    name: string;
    email: string;
  } | null;
  details?: Record<string, unknown>;
}

export default function RecentEmailsTable({ activities }: { activities: Activity[] }) {
  const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
    POST_EVENT_EMAIL_SENT: {
      label: 'Email post-event enviat',
      icon: '📧',
      color: 'text-blue-600 bg-blue-50',
    },
    TESTIMONIAL_SUBMITTED: {
      label: 'Valoracio rebuda',
      icon: '⭐',
      color: 'text-amber-600 bg-amber-50',
    },
    DISCOUNT_CODE_GENERATED: {
      label: 'Codi descompte generat',
      icon: '🎁',
      color: 'text-green-600 bg-green-50',
    },
    LEAD_EMAIL_SENT: {
      label: 'Confirmacio lead enviada',
      icon: '✉️',
      color: 'text-purple-600 bg-purple-50',
    },
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Ara mateix';
    if (hours < 24) return `Fa ${hours}h`;
    if (days < 7) return `Fa ${days}d`;
    return d.toLocaleDateString('ca-ES');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">📊 Activitat Recent</h2>
        <p className="text-xs text-slate-500 mt-1">Ultims 7 dies</p>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <span className="text-4xl">📭</span>
          <p className="mt-2">Cap activitat recent</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const actionInfo = actionLabels[activity.action] || {
              label: activity.action,
              icon: '📋',
              color: 'text-slate-600 bg-slate-50',
            };

            return (
              <div
                key={activity.id}
                className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${actionInfo.color}`}
                >
                  {actionInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activity.customer?.name || 'Usuari desconegut'}
                  </p>
                  <p className="text-xs text-slate-500">{actionInfo.label}</p>
                </div>
                <div className="text-xs text-slate-400">
                  {formatDate(activity.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
