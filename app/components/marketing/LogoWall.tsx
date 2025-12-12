"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function LogoWall() {
  const t = useTranslations("logoWall");

  // Els src són fixes; els alt es treuen de traduccions
  const logoSrcs = [
    "/img/logos/cliente1.webp",
    "/img/logos/cliente2.webp",
    "/img/logos/cliente3.webp",
    "/img/logos/cliente4.webp",
    "/img/logos/cliente5.webp",
    "/img/logos/cliente6.webp",
    "/img/logos/cliente7.webp",
    "/img/logos/cliente8.webp",
  ];

  const logos = logoSrcs.map((src, idx) => ({
    src,
    alt: t(`clients.${idx}`),
  }));

  return (
    <section className="bg-gradient-to-b from-bg-surface to-bg-main py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-lg font-medium text-oe-gold mb-10 tracking-wide">
          {t("title")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 place-items-center">
          {logos.map((l) => (
            <div
              key={l.alt}
              className="relative w-44 h-24 flex items-center justify-center"
            >
              <Image
                src={l.src}
                alt={l.alt}
                fill
                className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
