export type SocialOperatingLoopInput = {
  ideasCount: number;
  scheduledCount: number;
  publishedCount: number;
  instagramLeadCount: number;
  instagramWonCount: number;
  isActive: boolean;
  consistencyScore: number;
};

export type SocialOperatingLoop = {
  title: string;
  focus: string;
  evidence: string;
  captureLabel: string;
};

export function buildSocialOperatingLoop(input: SocialOperatingLoopInput): SocialOperatingLoop {
  const captureLabel = input.instagramLeadCount > 0
    ? `${input.instagramLeadCount} leads Instagram · ${input.instagramWonCount} guanyats`
    : 'Instagram encara sense pipeline atribuït';

  if (input.ideasCount > 0 && input.scheduledCount === 0) {
    return {
      title: 'Idees sense calendari',
      focus: 'Convertir una idea en peça programada abans de generar-ne més',
      evidence: `${input.ideasCount} idees disponibles · ${input.scheduledCount} programades`,
      captureLabel,
    };
  }

  if (!input.isActive) {
    return {
      title: 'Calendari sense pols públic',
      focus: 'Publicar una peça real i mesurar si genera conversa comercial',
      evidence: `${input.publishedCount} publicades · consistència ${input.consistencyScore}%`,
      captureLabel,
    };
  }

  if (input.instagramLeadCount > 0) {
    return {
      title: 'Contingut connectat a captació',
      focus: 'Repetir el format que porta leads i revisar conversió guanyada',
      evidence: `${input.publishedCount} publicades · ${input.scheduledCount} programades`,
      captureLabel,
    };
  }

  return {
    title: 'Calendari actiu sense captació visible',
    focus: 'Mantenir cadència i fer explícit el CTA cap al pipeline',
    evidence: `${input.publishedCount} publicades · consistència ${input.consistencyScore}%`,
    captureLabel,
  };
}
