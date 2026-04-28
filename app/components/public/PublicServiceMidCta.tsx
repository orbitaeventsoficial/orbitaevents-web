"use client";

import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/navigation';

type PublicServiceMidCtaProps = {
  title: string;
  subtitle: string;
  href: string;
  ctaLabel: string;
  onClick?: () => void;
};

export default function PublicServiceMidCta({
  title,
  subtitle,
  href,
  ctaLabel,
  onClick,
}: PublicServiceMidCtaProps) {
  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="p-10 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
        <h3 className="text-3xl font-bold text-white mb-3">
          {title}
        </h3>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          {subtitle}
        </p>
        <Link
          href={href}
          onClick={onClick}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-orange-500/25"
        >
          {ctaLabel}
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
