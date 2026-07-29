import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/app/config/site-config';
import { getGalleryByShareToken } from '@/lib/services/galleryService';
import { toIntlLocale } from '@/lib/constants';
import GalleryPasswordGate from './GalleryPasswordGate';
import {
  CLIENT_PORTAL_MESSAGES,
  getClientPortalGalleryPhotoLabel,
} from '@/lib/clientPortalMessages';
import { normalizePortalLocale } from '@/lib/services/clientPortalAccess';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicGalleryPage({
  params,
  searchParams,
}: {
  params: { locale: string; shareToken: string };
  searchParams: { password?: string | string[] };
}) {
  const locale = normalizePortalLocale(params.locale);
  const t = CLIENT_PORTAL_MESSAGES[locale];
  const password = Array.isArray(searchParams.password) ? searchParams.password[0] : searchParams.password;
  const result = await getGalleryByShareToken(params.shareToken, password);

  if (result.status === 'NOT_FOUND') notFound();

  if (result.status === 'PASSWORD_REQUIRED' || result.status === 'WRONG_PASSWORD') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center px-4">
        <GalleryPasswordGate
          shareToken={params.shareToken}
          locale={locale}
          wrongPassword={result.status === 'WRONG_PASSWORD'}
          brandName={SITE_CONFIG.business.name}
          labels={{
            title: t.sharedGalleryProtectedTitle,
            prompt: t.sharedGalleryPasswordPrompt,
            passwordLabel: t.sharedGalleryPasswordLabel,
            passwordPlaceholder: t.sharedGalleryPasswordPlaceholder,
            wrongPassword: t.sharedGalleryWrongPassword,
            submitting: t.sharedGallerySubmitting,
            access: t.sharedGalleryAccess,
          }}
        />
      </main>
    );
  }

  const { bookingReference, eventDate, photos } = result;
  const eventDateStr = new Date(eventDate).toLocaleDateString(toIntlLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white/90">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">{SITE_CONFIG.business.name}</p>
          <h1 className="mt-2 text-2xl font-bold">{t.gallery}</h1>
          <p className="mt-1 text-sm text-white/50">
            {bookingReference} · {eventDateStr}
          </p>
        </header>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/40 text-sm">
            {t.galleryEmpty}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => {
              const photoLabel = getClientPortalGalleryPhotoLabel(t.galleryPhotoLabel, photo.caption, index);
              return (
                <a
                  key={photo.id}
                  href={photo.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-white/30 transition-colors"
                  aria-label={`${photoLabel} (${t.opensInNewTab})`}
                >
                  <Image
                    src={photo.photoUrl}
                    alt={photoLabel}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.caption}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-white/30">
          <Link href={`/${locale}`} className="hover:text-cyan-400 transition-colors">
            {SITE_CONFIG.business.name}
          </Link>
        </footer>
      </div>
    </main>
  );
}
