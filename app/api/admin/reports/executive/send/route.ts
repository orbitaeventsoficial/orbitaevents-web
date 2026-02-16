import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { buildExecutiveReport } from '@/lib/services/executiveReportService';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const report = await buildExecutiveReport();
    const recipient = (process.env.CONTACT_TO || SITE_CONFIG.business.email).trim();

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px">
        <h2 style="margin:0 0 12px 0;color:#f8fafc">Executive Report</h2>
        <p style="margin:0 0 18px 0;color:#94a3b8">Generat: ${new Date(report.generatedAt).toLocaleString('ca-ES')}</p>
        <ul style="line-height:1.8;margin:0 0 18px 0;padding-left:18px">
          <li>Customers: <strong>${report.headline.customers}</strong></li>
          <li>Open leads: <strong>${report.headline.openLeads}</strong></li>
          <li>Ingressos tancats: <strong>${report.headline.revenueClosed.toLocaleString('ca-ES')}€</strong></li>
          <li>Pipeline brut: <strong>${report.headline.pipelineRaw.toLocaleString('ca-ES')}€</strong></li>
          <li>Forecast ponderat: <strong>${report.headline.forecastWeighted.toLocaleString('ca-ES')}€</strong></li>
          <li>SLA trencat (+24h NEW): <strong>${report.headline.slaBroken}</strong></li>
        </ul>
        <p style="margin:0;color:#94a3b8">Funnel: NEW ${report.funnel.NEW} · CONTACTED ${report.funnel.CONTACTED} · QUOTE ${report.funnel.QUOTE_SENT} · NEGOTIATING ${report.funnel.NEGOTIATING} · WON ${report.funnel.WON} · LOST ${report.funnel.LOST}</p>
      </div>
    `;

    await sendEmail({
      to: recipient,
      subject: `Executive Report Òrbita · ${new Date().toLocaleDateString('ca-ES')}`,
      html,
    });

    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) {
      const to = (process.env.ADMIN_WHATSAPP || SITE_CONFIG.business.phone).replace(/[^\d]/g, '');
      const text = [
        '📊 Executive Report',
        `Open leads: ${report.headline.openLeads}`,
        `Ingressos tancats: ${report.headline.revenueClosed.toLocaleString('ca-ES')}€`,
        `Forecast: ${report.headline.forecastWeighted.toLocaleString('ca-ES')}€`,
        `SLA trencat: ${report.headline.slaBroken}`,
      ].join('\n');
      try {
        await fetch(`${process.env.WHATSAPP_API_URL}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
        });
      } catch (waErr) {
        log.warn('Executive report whatsapp send failed', { error: waErr });
      }
    }

    await prisma.adminLog.create({
      data: {
        action: 'EXEC_REPORT_SENT',
        entity: 'report',
        entityId: 'executive',
        details: {
          recipient,
          generatedAt: report.generatedAt,
          headline: report.headline,
        },
      },
    });

    return NextResponse.json({ ok: true, recipient, report });
  } catch (error) {
    log.error('Error sending executive report', error);
    return NextResponse.json({ ok: false, error: 'Error enviando executive report' }, { status: 500 });
  }
}
