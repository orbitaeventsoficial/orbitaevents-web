// app/admin/emails/EmailStatsCards.tsx
'use client';

interface Stats {
  leadsWithEmail: number;
  postEventSent: number;
  postEventPending: number;
  testimonials: number;
  discountCodes: number;
}

export default function EmailStatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: 'Leads amb email',
      value: stats.leadsWithEmail,
      icon: '📧',
      sublabel: 'Ultims 30 dies',
      color: 'blue',
    },
    {
      label: 'Post-Event Enviats',
      value: stats.postEventSent,
      icon: '✅',
      sublabel: 'Total historic',
      color: 'green',
    },
    {
      label: 'Pendents',
      value: stats.postEventPending,
      icon: '⏳',
      sublabel: 'Per enviar',
      color: 'amber',
    },
    {
      label: 'Valoracions',
      value: stats.testimonials,
      icon: '⭐',
      sublabel: 'Ultims 30 dies',
      color: 'purple',
    },
    {
      label: 'Codis Descompte',
      value: stats.discountCodes,
      icon: '🎁',
      sublabel: 'Generats (30d)',
      color: 'pink',
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    pink: 'bg-pink-50 border-pink-200 text-pink-600',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${colorClasses[card.color]}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{card.icon}</span>
            <span className="text-xs font-medium uppercase tracking-wider opacity-70">
              {card.label}
            </span>
          </div>
          <p className="text-3xl font-bold">{card.value}</p>
          <p className="text-xs opacity-60 mt-1">{card.sublabel}</p>
        </div>
      ))}
    </div>
  );
}
