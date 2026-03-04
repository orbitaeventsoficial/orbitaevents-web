// app/admin/emails/RecentEmailsTable.tsx
'use client';

import { formatDateSimple } from '@/lib/constants';

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
  const actionLabels: Record<string, { label: string; icon: string; bg: string; text: string }> = {
    POST_EVENT_EMAIL_SENT: {
      label: 'Email post-event enviat',
      icon: '📧',
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
    },
    TESTIMONIAL_SUBMITTED: {
      label: 'Valoracio rebuda',
      icon: '⭐',
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
    },
    DISCOUNT_CODE_GENERATED: {
      label: 'Codi descompte generat',
      icon: '🎁',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
    },
    LEAD_EMAIL_SENT: {
      label: 'Confirmacio lead enviada',
      icon: '✉️',
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
    },
  };

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
    <section className="rounded-2xl border admin-card-glass overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold">📊 Activitat Recent</h2>
        <p className="text-xs mt-1">Ultims 7 dies</p>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-2">Cap activitat recent</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const actionInfo = actionLabels[activity.action] || {
              label: activity.action,
              icon: '📋',
              bg: 'bg-white/10',
              text: 'text-white/70',
            };

            return (
              <div
                key={activity.id}
                className="px-6 py-3 flex items-center gap-4 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${actionInfo.bg}`}
                >
                  {actionInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
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
