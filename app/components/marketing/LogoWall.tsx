"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function LogoWall() {
  const t = useTranslations("logoWall");

  const logos = [
    { src: "/img/logos/cliente1.webp", alt: "Moto Offroad Academy" },
    { src: "/img/logos/cliente2.webp", alt: "Masia El Massaguer" },
    { src: "/img/logos/cliente3.webp", alt: "AECC" },
    { src: "/img/logos/cliente4.webp", alt: "Clap" },
    { src: "/img/logos/cliente5.webp", alt: "Ajuntament de Granollers" },
    { src: "/img/logos/cliente6.webp", alt: "Ajuntament de Terrassa" },
    { src: "/img/logos/cliente7.webp", alt: "MG Medicina Estètica" },
    { src: "/img/logos/cliente8.webp", alt: "Zona Motor L'Ametlla Park" },
  ];

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
