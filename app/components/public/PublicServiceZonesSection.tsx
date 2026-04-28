"use client";

import type { ReactNode } from 'react';
import { Link } from '@/lib/navigation';

export type PublicServiceZoneCard = {
  id: string;
  href: string;
  icon: string;
  label: string;
  description: string;
};

export type PublicServiceZonesBadge = {
  icon: ReactNode;
  label: string;
};

type PublicServiceZonesSectionProps = {
  title: string;
  zones: PublicServiceZoneCard[];
  columnsClassName?: string;
  badge?: PublicServiceZonesBadge;
  subtitle?: string;
  headingLevel?: 'h2' | 'h3';
};

export default function PublicServiceZonesSection({
  title,
  zones,
  columnsClassName = 'grid-cols-2 md:grid-cols-4',
  badge,
  subtitle,
  headingLevel = 'h2',
}: PublicServiceZonesSectionProps) {
  const Heading = headingLevel;
  return (
    <section className="max-w-5xl mx-auto px-4 pb-20">
      <div className="text-center mb-8">
        {badge && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-oe-gold/10 border border-oe-gold/30 mb-4">
            {badge.icon}
            <span className="text-sm font-medium text-oe-gold">{badge.label}</span>
          </div>
        )}
        <Heading className="text-2xl font-bold text-white">{title}</Heading>
        {subtitle && <p className="text-white/50 mt-2">{subtitle}</p>}
      </div>
      <div className={`grid ${columnsClassName} gap-4`}>
        {zones.map((zone) => (
          <Link
            key={zone.id}
            href={zone.href}
            className="group p-4 rounded-xl bg-bg-surface border border-white/10 hover:border-oe-gold/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">{zone.icon}</div>
            <div className="font-semibold text-white text-sm group-hover:text-oe-gold transition-colors">{zone.label}</div>
            <div className="text-xs text-white/50 mt-1">{zone.description}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
