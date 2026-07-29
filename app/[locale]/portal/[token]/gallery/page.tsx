import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/app/config/site-config';
import {
  findPortalAccessByRawToken,
  markPortalAccessHit,
  normalizePortalLocale,
} from '@/lib/services/clientPortalAccess';
import { listPortalPhotos } from '@/lib/services/galleryService';
import {
  CLIENT_PORTAL_MESSAGES,
  getClientPortalGalleryPhotoCountLabel,
  type ClientPortalLocale,
} from '@/lib/clientPortalMessages';
import { resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from '../PortalBottomNav';
import GalleryClient from './GalleryClient';
import { getClientPortalHiddenNavItems, getClientPortalVisibility } from '@/lib/clientPortalVisibility';
import ClientPortalPageHeader from '@/app/components/public/ClientPortalPageHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ClientPortalGalleryPage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale);
  const t = CLIENT_PORTAL_MESSAGES[locale];

  const access = await findPortalAccessByRawToken(params.token);
  if (!access) notFound();
  const visibility = getClientPortalVisibility(access.personalization);

  const requestHeaders = headers();
  await markPortalAccessHit({
    accessId: access.id,
    ip: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip'),
    userAgent: requestHeaders.get('user-agent'),
  });

  const accentHex = resolvePortalAccentHex(access.personalization);
  const booking = access.booking;

  let photos: { id: string; photoUrl: string; caption: string | null }[] = [];
  try {
    photos = await listPortalPhotos(booking.id);
  } catch {
    // non-critical — show empty state
  }

  return (
    <main className="min-h-screen pb-24 text-white/90 portal-shell-bg">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-start justify-between gap-4">
          <ClientPortalPageHeader
            backHref={`/${locale}/portal/${params.token}`}
            backLabel={t.portalLabel}
            eyebrow={t.gallery}
            title={booking.reference}
            accentColor={accentHex}
          />
          {photos.length > 0 && (
            <span className="mt-10 text-sm text-white/35">
              {getClientPortalGalleryPhotoCountLabel(locale, photos.length)}
            </span>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-12 text-center">
            <p className="text-sm text-white/40">{t.galleryEmpty}</p>
          </div>
        ) : (
          <GalleryClient
            photos={photos}
            labels={{
              gallery: t.gallery,
              galleryClose: t.galleryClose,
              galleryDownload: t.galleryDownload,
              galleryOf: t.galleryOf,
              galleryPhotoLabel: t.galleryPhotoLabel,
              galleryPrev: t.galleryPrev,
              galleryNext: t.galleryNext,
              opensInNewTab: t.opensInNewTab,
            }}
          />
        )}

        <footer className="mt-10 text-center">
          <p className="text-xs text-white/15">{SITE_CONFIG.business.name}</p>
        </footer>
      </div>
      <PortalBottomNav
        basePath={`/${locale}/portal/${params.token}`}
        accentHex={accentHex}
        labels={{
          ariaLabel: t.portalNavigationLabel,
          hub: t.portalLabel,
          payments: t.payments,
          timeline: t.timelineLabel,
          contract: t.contract,
          gallery: t.navGallery,
        }}
        hiddenItems={getClientPortalHiddenNavItems(visibility)}
      />
    </main>
  );
}
