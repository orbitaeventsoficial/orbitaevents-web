import type { ReactNode } from 'react';

type OwnerTone = 'info' | 'warning' | 'success';

type OwnerCard = {
  eyebrow: string;
  title: string;
  tone: OwnerTone;
  items: string[];
  emptyText: string;
};

type OwnerNextStep = {
  eyebrow?: string;
  title: string;
  detail: string;
  href: string;
  ctaLabel?: string;
  external?: boolean;
  secondaryAction?: {
    href: string;
    label: string;
    external?: boolean;
  };
};

/**
 * ERRADICAT de l'admin (#976, ordre del propietari): el panell «Automàtic /
 * Manual / Següent pas» ja NO es renderitza. Era un festival de colors no-Òrbita
 * (cyan/sky/amber/emerald/white/black hardcodejats) que violava la norma de sèrie.
 * Es manté la signatura de props perquè els ~37 consumidors no es trenquin; la
 * neteja dels usos (treure import + bloc) és feina de seguiment, sense impacte UI.
 */
export function OwnerControlStrip(_props: {
  system: OwnerCard;
  manual: OwnerCard;
  nextStep: OwnerNextStep;
  className?: string;
}) {
  return null;
}

export function OwnerControlSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
