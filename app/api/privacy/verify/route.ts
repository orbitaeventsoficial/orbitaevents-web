/**
 * API ROUTE: Privacy Verification
 * Verificacion de solicitudes de derechos ARCO
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyDataRequest } from '@/lib/services/privacyService';
import { escapeHtml } from '@/lib/utils/sanitize';

export const dynamic = 'force-dynamic';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: "Derecho de acceso",
  RECTIFICATION: 'Derecho de rectificacion',
  ERASURE: 'Derecho de supresion',
  RESTRICTION: 'Derecho de limitacion',
  PORTABILITY: 'Derecho de portabilidad',
  OBJECTION: 'Derecho de oposicion',
  AUTOMATED: 'Decisiones automatizadas',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(generateErrorPage('Token no proporcionado'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const request = await verifyDataRequest(token);

    return new NextResponse(
      generateSuccessPage(
        request.requesterName,
        REQUEST_TYPE_LABELS[request.requestType] || request.requestType,
        request.legalDeadline
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error verificando la solicitud';
    return new NextResponse(generateErrorPage(message), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function generateSuccessPage(
  name: string,
  requestType: string,
  deadline: Date
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitud verificada - Orbita Events</title>
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

        <h1>Solicitud verificada</h1>

        <p>Hola <span class="highlight">${escapeHtml(name)}</span>,</p>

        <p>Tu solicitud de <strong>${escapeHtml(requestType)}</strong> ha sido verificada correctamente.</p>

        <p>Nuestro equipo procesara tu solicitud lo antes posible.</p>

        <div class="deadline">
          <div class="deadline-label">Fecha limite de respuesta</div>
          <div class="deadline-date">${new Date(deadline).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}</div>
        </div>

        <p style="font-size: 14px;">
          Segun el RGPD, tenemos hasta 30 dias para responder a tu solicitud.
          Si necesitamos mas tiempo, te lo notificaremos.
        </p>

        <a href="/" class="btn">Volver al inicio</a>

        <div class="footer">
          ${new Date().getFullYear()} Orbita Events. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateErrorPage(error: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - Orbita Events</title>
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

        <h1>Error de verificacion</h1>

        <p>No hemos podido verificar tu solicitud.</p>

        <div class="error-msg">${escapeHtml(error)}</div>

        <p>Si necesitas ayuda, contactanos en <strong>info@orbitaevents.com</strong></p>

        <a href="/" class="btn">Volver al inicio</a>
      </div>
    </body>
    </html>
  `;
}