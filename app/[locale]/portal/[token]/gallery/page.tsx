import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  findPortalAccessByRawToken,
  markPortalAccessHit,
  normalizePortalLocale,
} from '@/lib/services/clientPortalAccess';
import { listPortalPhotos } from '@/lib/services/galleryService';
import { CLIENT_PORTAL_MESSAGES, type ClientPortalLocale } from '@/lib/clientPortalMessages';
import { resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from '../PortalBottomNav';
import GalleryClient from './GalleryClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ClientPortalGalleryPage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale) as ClientPortalLocale;
  const t = CLIENT_PORTAL_MESSAGES[locale];

  const access = await findPortalAccessByRawToken(params.token);
  if (!access) notFound();

  const requestHeaders = headers();
  await markPortalAccessHit({
    accessId: access.id,
    ip: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip'),
    userAgent: requestHeaders.get('user-agent'),
  });

  const accentHex = resolvePortalAccentHex(access.personalization);
  const booking = access.booking as { id: string; reference: string };

  let photos: { id: string; photoUrl: string; caption: string | null }[] = [];
  try {
    photos = await listPortalPhotos(booking.id);
  } catch {
    // non-critical — show empty state
  }

  return (
    <main className="min-h-screen pb-24 text-white/90 portal-shell-bg">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-6">
          <Link
            href={`/${locale}/portal/${params.token}`}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            ← {t.portalLabel}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accentHex }}>{t.gallery}</p>
              <h1 className="text-2xl font-bold text-white">{booking.reference}</h1>
            </div>
            {photos.length > 0 && (
              <span className="text-sm text-white/35">{photos.length} fotos</span>
            )}
          </div>
        </header>

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
              galleryPrev: t.galleryPrev,
              galleryNext: t.galleryNext,
            }}
          />
        )}

        <footer className="mt-10 text-center">
          <p className="text-xs text-white/15">Òrbita Events</p>
        </footer>
      </div>
      <PortalBottomNav
        basePath={`/${locale}/portal/${params.token}`}
        accentHex={accentHex}
        labels={{
          hub: t.portalLabel,
          payments: t.payments,
          timeline: t.timelineLabel,
          contract: t.contract,
          gallery: t.navGallery,
        }}
      />
    </main>
  );
}
