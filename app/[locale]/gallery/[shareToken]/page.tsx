import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGalleryByShareToken } from '@/lib/services/galleryService';
import { toIntlLocale } from '@/lib/constants';
import GalleryPasswordGate from './GalleryPasswordGate';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicGalleryPage({
  params,
  searchParams,
}: {
  params: { locale: string; shareToken: string };
  searchParams: { password?: string };
}) {
  const result = await getGalleryByShareToken(params.shareToken, searchParams.password);

  if (result.status === 'NOT_FOUND') notFound();

  if (result.status === 'PASSWORD_REQUIRED' || result.status === 'WRONG_PASSWORD') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center px-4">
        <GalleryPasswordGate
          shareToken={params.shareToken}
          locale={params.locale}
          wrongPassword={result.status === 'WRONG_PASSWORD'}
        />
      </main>
    );
  }

  const { bookingReference, eventDate, photos } = result;
  const eventDateStr = new Date(eventDate).toLocaleDateString(toIntlLocale(params.locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white/90">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Orbita Events</p>
          <h1 className="mt-2 text-2xl font-bold">Galeria de fotos</h1>
          <p className="mt-1 text-sm text-white/50">
            {bookingReference} · {eventDateStr}
          </p>
        </header>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/40 text-sm">
            Encara no hi ha fotos disponibles.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-white/30 transition-colors"
                aria-label={photo.caption || 'Foto de l\'event'}
              >
                <Image
                  src={photo.photoUrl}
                  alt={photo.caption || 'Foto de l\'event'}
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
            ))}
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-white/30">
          <Link href={`/${params.locale}`} className="hover:text-cyan-400 transition-colors">
            Orbita Events
          </Link>
        </footer>
      </div>
    </main>
  );
}
