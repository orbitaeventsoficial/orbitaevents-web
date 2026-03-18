/**
 * Traduccions i helpers purs per la verificació de privacitat.
 * Extret de route.ts per reduir la mida del handler.
 */

import type { NextRequest } from 'next/server';

export type Locale = 'ca' | 'es' | 'en';

export type VerifyMessages = {
  requestTypes: Record<string, string>;
  tokenMissing: string;
  verifyError: string;
  htmlLang: string;
  successTitle: string;
  successPageTitle: string;
  hello: string;
  verifiedIntro: string;
  processedSoon: string;
  deadlineLabel: string;
  gdprNotice: string;
  backHome: string;
  rightsReserved: string;
  errorPageTitle: string;
  verifyErrorTitle: string;
  verifyErrorIntro: string;
  needHelp: string;
};

export const MESSAGES: Record<Locale, VerifyMessages> = {
  ca: {
    requestTypes: {
      ACCESS: "Dret d'acc\u00e9s",
      RECTIFICATION: 'Dret de rectificaci\u00f3',
      ERASURE: 'Dret de supressi\u00f3',
      RESTRICTION: 'Dret de limitaci\u00f3',
      PORTABILITY: 'Dret de portabilitat',
      OBJECTION: "Dret d'oposici\u00f3",
      AUTOMATED: 'Decisions automatitzades',
    },
    tokenMissing: "No s'ha proporcionat cap token",
    verifyError: "Error verificant la sol\u00b7licitud",
    htmlLang: 'ca',
    successTitle: "Sol\u00b7licitud verificada",
    successPageTitle: "Sol\u00b7licitud verificada - Orbita Events",
    hello: 'Hola',
    verifiedIntro: 'La teva sol\u00b7licitud de',
    processedSoon: "ha estat verificada correctament. El nostre equip la processar\u00e0 al m\u00e9s aviat possible.",
    deadlineLabel: 'Data l\u00edmit de resposta',
    gdprNotice: "Segons el RGPD, tenim fins a 30 dies per respondre la teva sol\u00b7licitud. Si necessitem m\u00e9s temps, t'ho notificarem.",
    backHome: "Tornar a l'inici",
    rightsReserved: 'Orbita Events. Tots els drets reservats.',
    errorPageTitle: 'Error - Orbita Events',
    verifyErrorTitle: "Error de verificaci\u00f3",
    verifyErrorIntro: 'No hem pogut verificar la teva sol\u00b7licitud.',
    needHelp: "Si necessites ajuda, contacta'ns a",
  },
  es: {
    requestTypes: {
      ACCESS: 'Derecho de acceso',
      RECTIFICATION: 'Derecho de rectificacion',
      ERASURE: 'Derecho de supresion',
      RESTRICTION: 'Derecho de limitacion',
      PORTABILITY: 'Derecho de portabilidad',
      OBJECTION: 'Derecho de oposicion',
      AUTOMATED: 'Decisiones automatizadas',
    },
    tokenMissing: 'Token no proporcionado',
    verifyError: 'Error verificando la solicitud',
    htmlLang: 'es',
    successTitle: 'Solicitud verificada',
    successPageTitle: 'Solicitud verificada - Orbita Events',
    hello: 'Hola',
    verifiedIntro: 'Tu solicitud de',
    processedSoon: 'ha sido verificada correctamente. Nuestro equipo procesará tu solicitud lo antes posible.',
    deadlineLabel: 'Fecha limite de respuesta',
    gdprNotice: 'Segun el RGPD, tenemos hasta 30 dias para responder a tu solicitud. Si necesitamos mas tiempo, te lo notificaremos.',
    backHome: 'Volver al inicio',
    rightsReserved: 'Orbita Events. Todos los derechos reservados.',
    errorPageTitle: 'Error - Orbita Events',
    verifyErrorTitle: 'Error de verificacion',
    verifyErrorIntro: 'No hemos podido verificar tu solicitud.',
    needHelp: 'Si necesitas ayuda, contactanos en',
  },
  en: {
    requestTypes: {
      ACCESS: 'Right of access',
      RECTIFICATION: 'Right of rectification',
      ERASURE: 'Right of erasure',
      RESTRICTION: 'Right of restriction',
      PORTABILITY: 'Right of portability',
      OBJECTION: 'Right of objection',
      AUTOMATED: 'Automated decisions',
    },
    tokenMissing: 'Missing token',
    verifyError: 'Error verifying request',
    htmlLang: 'en',
    successTitle: 'Request verified',
    successPageTitle: 'Request verified - Orbita Events',
    hello: 'Hello',
    verifiedIntro: 'Your request for',
    processedSoon: 'has been verified successfully. Our team will process it as soon as possible.',
    deadlineLabel: 'Response deadline',
    gdprNotice: 'Under GDPR, we have up to 30 days to respond to your request. If we need more time, we will notify you.',
    backHome: 'Back to home',
    rightsReserved: 'Orbita Events. All rights reserved.',
    errorPageTitle: 'Error - Orbita Events',
    verifyErrorTitle: 'Verification error',
    verifyErrorIntro: 'We could not verify your request.',
    needHelp: 'If you need help, contact us at',
  },
};

export function resolveLocale(req: NextRequest): Locale {
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}
