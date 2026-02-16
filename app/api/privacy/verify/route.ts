/**
 * API ROUTE: Privacy Verification
 * Verificacion de solicitudes de derechos ARCO
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyDataRequest } from '@/lib/services/privacyService';
import { escapeHtml } from '@/lib/utils/sanitize';

export const dynamic = 'force-dynamic';

type Locale = 'ca' | 'es' | 'en';
type VerifyMessages = {
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

const MESSAGES: Record<Locale, VerifyMessages> = {
  ca: {
    requestTypes: {
      ACCESS: "Dret d'accés",
      RECTIFICATION: 'Dret de rectificació',
      ERASURE: 'Dret de supressió',
      RESTRICTION: 'Dret de limitació',
      PORTABILITY: 'Dret de portabilitat',
      OBJECTION: "Dret d'oposició",
      AUTOMATED: 'Decisions automatitzades',
    },
    tokenMissing: 'No s’ha proporcionat cap token',
    verifyError: 'Error verificant la sol·licitud',
    htmlLang: 'ca',
    successTitle: 'Sol·licitud verificada',
    successPageTitle: 'Sol·licitud verificada - Orbita Events',
    hello: 'Hola',
    verifiedIntro: 'La teva sol·licitud de',
    processedSoon: 'ha estat verificada correctament. El nostre equip la processarà al més aviat possible.',
    deadlineLabel: 'Data límit de resposta',
    gdprNotice: 'Segons el RGPD, tenim fins a 30 dies per respondre la teva sol·licitud. Si necessitem més temps, t\'ho notificarem.',
    backHome: "Tornar a l'inici",
    rightsReserved: 'Orbita Events. Tots els drets reservats.',
    errorPageTitle: 'Error - Orbita Events',
    verifyErrorTitle: 'Error de verificació',
    verifyErrorIntro: 'No hem pogut verificar la teva sol·licitud.',
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

function resolveLocale(req: NextRequest): Locale {
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

export async function GET(req: NextRequest) {
  const t = MESSAGES[resolveLocale(req)];
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(generateErrorPage(t.tokenMissing, t), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const request = await verifyDataRequest(token);

    return new NextResponse(
      generateSuccessPage(
        request.requesterName,
        t.requestTypes[request.requestType] || request.requestType,
        request.legalDeadline,
        t
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : t.verifyError;
    return new NextResponse(generateErrorPage(message, t), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function generateSuccessPage(
  name: string,
  requestType: string,
  deadline: Date,
  t: VerifyMessages
): string {
  return `
    <!DOCTYPE html>
    <html lang="${t.htmlLang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.successPageTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: #0a0a0a;
          color: #e5e5e5;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 500px;
          background: #1a1a1a;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          border: 1px solid #333;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: rgba(34, 197, 94, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .icon svg {
          width: 40px;
          height: 40px;
          color: #22c55e;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 16px;
          color: white;
        }
        .highlight {
          color: #f97316;
          font-weight: 600;
        }
        p {
          color: #a3a3a3;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .deadline {
          background: #262626;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .deadline-label {
          font-size: 12px;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .deadline-date {
          font-size: 20px;
          color: #f97316;
          font-weight: 600;
          margin-top: 4px;
        }
        .btn {
          display: inline-block;
          background: #f97316;
          color: white;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #ea580c;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #333;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1>${t.successTitle}</h1>

        <p>${t.hello} <span class="highlight">${escapeHtml(name)}</span>,</p>

        <p>${t.verifiedIntro} <strong>${escapeHtml(requestType)}</strong> ${t.processedSoon}</p>

        <div class="deadline">
          <div class="deadline-label">${t.deadlineLabel}</div>
          <div class="deadline-date">${new Date(deadline).toLocaleDateString(t.htmlLang === 'ca' ? 'ca-ES' : t.htmlLang === 'en' ? 'en-GB' : 'es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}</div>
        </div>

        <p style="font-size: 14px;">
          ${t.gdprNotice}
        </p>

        <a href="/" class="btn">${t.backHome}</a>

        <div class="footer">
          ${new Date().getFullYear()} ${t.rightsReserved}
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateErrorPage(error: string, t: VerifyMessages): string {
  return `
    <!DOCTYPE html>
    <html lang="${t.htmlLang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.errorPageTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: #0a0a0a;
          color: #e5e5e5;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 500px;
          background: #1a1a1a;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          border: 1px solid #333;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: rgba(239, 68, 68, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .icon svg {
          width: 40px;
          height: 40px;
          color: #ef4444;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 16px;
          color: white;
        }
        p {
          color: #a3a3a3;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .btn {
          display: inline-block;
          background: #f97316;
          color: white;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #ea580c;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1>${t.verifyErrorTitle}</h1>

        <p>${t.verifyErrorIntro}</p>

        <div class="error-msg">${escapeHtml(error)}</div>

        <p>${t.needHelp} <strong>info@orbitaevents.com</strong></p>

        <a href="/" class="btn">${t.backHome}</a>
      </div>
    </body>
    </html>
  `;
}
