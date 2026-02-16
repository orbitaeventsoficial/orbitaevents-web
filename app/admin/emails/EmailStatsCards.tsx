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
      label: 'Entrades amb correu',
      value: stats.leadsWithEmail,
      icon: '📧',
      sublabel: 'Ultims 30 dies',
      borderColor: 'border-blue-500/20',
      gradient: 'from-blue-500/10 to-blue-600/5',
      labelColor: 'text-blue-400',
    },
    {
      label: 'Post-Event Enviats',
      value: stats.postEventSent,
      icon: '✅',
      sublabel: 'Total historic',
      borderColor: 'border-emerald-500/20',
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      labelColor: 'text-emerald-400',
    },
    {
      label: 'Pendents',
      value: stats.postEventPending,
      icon: '⏳',
      sublabel: 'Per enviar',
      borderColor: 'border-amber-500/20',
      gradient: 'from-amber-500/10 to-amber-600/5',
      labelColor: 'text-amber-400',
    },
    {
      label: 'Valoracions',
      value: stats.testimonials,
      icon: '⭐',
      sublabel: 'Ultims 30 dies',
      borderColor: 'border-purple-500/20',
      gradient: 'from-purple-500/10 to-purple-600/5',
      labelColor: 'text-purple-400',
    },
    {
      label: 'Codis Descompte',
      value: stats.discountCodes,
      icon: '🎁',
      sublabel: 'Generats (30d)',
      borderColor: 'border-pink-500/20',
      gradient: 'from-pink-500/10 to-pink-600/5',
      labelColor: 'text-pink-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} backdrop-blur-sm p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{card.icon}</span>
            <span className={`text-xs font-medium uppercase tracking-wider ${card.labelColor}`}>
              {card.label}
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{card.value}</p>
          <p className="text-xs text-slate-500 mt-1">{card.sublabel}</p>
        </div>
      ))}
    </div>
  );
}
