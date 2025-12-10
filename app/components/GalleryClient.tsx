// components/GalleryClient.tsx
'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

type GalleryClientProps = {
  files: string[];
};

export default function GalleryClient({ files }: GalleryClientProps) {
  const t = useTranslations('gallery');

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-32">
        <p className="text-3xl text-white/80 mb-4">
          {t('preparingTitle')}
        </p>
        <p className="text-xl text-white/60">
          {t('preparingSubtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {files.map((src, i) => {
          const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');

          if (isVideo) {
            return (
              <video
                key={src}
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-2xl shadow-2xl hover:shadow-oe-gold/30 transition-all duration-500 hover:scale-[1.02]"
              >
                <source src={src} type="video/mp4" />
              </video>
            );
          }

          return (
            <Image
              key={src}
              src={src}
              alt={`${t('imageAlt')} ${i + 1}`}
              width={1600}
              height={1066}
              loading="lazy"
              className="w-full h-auto rounded-2xl shadow-2xl hover:shadow-oe-gold/30 transition-all duration-500 hover:scale-[1.02]"
            />
          );
        })}
      </div>
    </div>
  );
}
