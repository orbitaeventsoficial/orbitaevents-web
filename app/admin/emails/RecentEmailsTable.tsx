// app/admin/emails/RecentEmailsTable.tsx
'use client';

import { EMAIL_ACTIVITY_DISPLAY, formatDateSimple } from '@/lib/constants';

type ActionTone = {
  label: string;
  icon: string;
  bg: string;
  text: string;
};

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

const DEFAULT_ACTION_TONE: ActionTone = {
  label: 'Activitat',
  icon: '📋',
  bg: 'admin-tone-bg-neutral',
  text: 'admin-tone-text-neutral',
};

export default function RecentEmailsTable({ activities }: { activities: Activity[] }) {
  const formatRelativeDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Ara mateix';
    if (hours < 24) return `Fa ${hours}h`;
    if (days < 7) return `Fa ${days}d`;
    return formatDateSimple(d);
  };

  return (
    <section className="ap-card overflow-hidden" data-help-title="Activitat recent d'emails" data-help-desc="Llista cronològica dels últims enviaments, testimonis i automatitzacions relacionades amb correu.">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">📊 Activitat Recent</h2>
        <p className="mt-1 text-xs">Últims 7 dies</p>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-2">Cap activitat recent</p>
        </div>
      ) : (
        <div className="max-h-96 divide-y admin-tone-border-subtle overflow-y-auto" data-help-title="Taula d'activitat recent" data-help-desc="Cada fila indica qui ha rebut o generat l'acció i quan ha passat per seguir el ritme del sistema d'emails.">
          {activities.map((activity) => {
            const actionInfo = EMAIL_ACTIVITY_DISPLAY[activity.action] || {
              ...DEFAULT_ACTION_TONE,
              label: activity.action,
            };

            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 px-6 py-3 transition-colors"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${actionInfo.bg}`}
                >
                  {actionInfo.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {activity.customer?.name || 'Usuari desconegut'}
                  </p>
                  <p className={`text-xs ${actionInfo.text}`}>{actionInfo.label}</p>
                </div>
                <div className="text-xs">
                  {formatRelativeDate(activity.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

