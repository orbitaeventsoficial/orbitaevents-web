"use client";

import { useMemo } from 'react';
import { absoluteUrl } from '@/lib/site';


export default function Breadcrumbs({ items }: { items: Array<{ name: string; url: string }> }) {
  const json = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        item: absoluteUrl(it.url),
      })),
    }),
    [items]
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
      />

      {/* Breadcrumbs visuales refinados */}
      <nav
        aria-label="Breadcrumb"
        className="hidden md:flex justify-center items-center gap-2 mb-12 text-sm font-medium text-white/60"
      >
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-oe-gold/60">•</span>}
            {i === items.length - 1 ? (
              <span className="text-white font-semibold tracking-wide drop-shadow-sm">
                {it.name}
              </span>
            ) : (
              <a
                href={it.url}
                className="hover:text-oe-gold transition-all duration-200 hover:drop-shadow-[0_0_4px_rgba(215,184,110,0.5)]"
              >
                {it.name}
              </a>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}
