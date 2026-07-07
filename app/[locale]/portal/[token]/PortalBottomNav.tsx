'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CLIENT_PORTAL_NAV_ITEMS,
  type ClientPortalNavKey,
} from '@/lib/constants/clientPortalNavigation';
import type { ClientPortalHiddenNavItems } from '@/lib/clientPortalVisibility';

interface Props {
  basePath: string;
  accentHex: string;
  labels: {
    ariaLabel: string;
    hub: string;
    payments: string;
    timeline: string;
    contract: string;
    gallery: string;
  };
  hiddenItems?: ClientPortalHiddenNavItems;
}

function renderIcon(key: ClientPortalNavKey) {
  switch (key) {
    case 'hub':
      return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 18v-5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      );
    case 'payments':
      return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="13" r="1" fill="currentColor" />
      </svg>
      );
    case 'timeline':
      return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="5" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 6.5v2M5 11.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 5h6M8.5 10h6M8.5 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      );
    case 'contract':
      return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="4" y="2" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      );
    case 'gallery':
      return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 13l4-4 3.5 3.5L13 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      );
  }
}

export default function PortalBottomNav({ basePath, accentHex, labels, hiddenItems }: Props) {
  const pathname = usePathname() ?? '';

  function isActive(path: string) {
    const full = `${basePath}${path}`;
    return path === '' ? pathname === basePath : pathname.startsWith(full);
  }

  return (
    <nav
      aria-label={labels.ariaLabel}
      className="fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="border-t border-white/[0.08] bg-black/80"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {CLIENT_PORTAL_NAV_ITEMS.filter((item) => !hiddenItems?.[item.key]).map((item) => {
            const active = isActive(item.path);
            const labelKey = item.key as keyof typeof labels;
            return (
              <Link
                key={item.key}
                href={`${basePath}${item.path}`}
                className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors"
                style={{ color: active ? accentHex : 'rgba(255,255,255,0.35)' }}
                aria-current={active ? 'page' : undefined}
              >
                {renderIcon(item.key)}
                <span className="truncate">{labels[labelKey]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
