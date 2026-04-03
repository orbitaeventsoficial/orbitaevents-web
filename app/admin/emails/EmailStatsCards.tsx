// app/admin/emails/EmailStatsCards.tsx
'use client';

interface Stats {
  leadsWithEmail: number;
  postEventSent: number;
  postEventPending: number;
  testimonials: number;
  discountCodes: number;
}

type CardTone = {
  label: string;
  value: number;
  icon: string;
  sublabel: string;
  cardClass: string;
  labelClass: string;
};

export default function EmailStatsCards({ stats }: { stats: Stats }) {
  const cards: CardTone[] = [
    {
      label: 'Entrades amb correu',
      value: stats.leadsWithEmail,
      icon: '📧',
      sublabel: 'Últims 30 dies',
      cardClass: 'ap-card ap-card--info',
      labelClass: 'admin-tone-text-info',
    },
    {
      label: 'Post-Event Enviats',
      value: stats.postEventSent,
      icon: '✅',
      sublabel: 'Total històric',
      cardClass: 'ap-card ap-card--success',
      labelClass: 'admin-tone-text-success',
    },
    {
      label: 'Pendents',
      value: stats.postEventPending,
      icon: '⏳',
      sublabel: 'Per enviar',
      cardClass: 'ap-card ap-card--warning',
      labelClass: 'admin-tone-text-warning',
    },
    {
      label: 'Valoracions',
      value: stats.testimonials,
      icon: '⭐',
      sublabel: 'Últims 30 dies',
      cardClass: 'ap-card',
      labelClass: 'admin-tone-text-violet',
    },
    {
      label: 'Codis Descompte',
      value: stats.discountCodes,
      icon: '🎁',
      sublabel: 'Generats (30d)',
      cardClass: 'ap-card',
      labelClass: 'admin-tone-text-danger',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-help-title="Mètriques d'emails" data-help-desc="Resumeixen el volum recent de leads amb correu, post-event enviats, pendents, valoracions i codis de descompte generats.">
      {cards.map((card) => (
        <div key={card.label} className={`${card.cardClass} admin-card-glass rounded-2xl`} data-help-title={card.label} data-help-desc={card.sublabel}>
          <div className="ap-card-body p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">{card.icon}</span>
              <span className={`text-xs font-medium uppercase tracking-wider ${card.labelClass}`}>
                {card.label}
              </span>
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs">{card.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
