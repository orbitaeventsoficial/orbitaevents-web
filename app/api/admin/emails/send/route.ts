// app/api/admin/emails/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { SITE_CONFIG } from '@/app/config/site-config';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function bodyToHtml(body: string): string {
  const escaped = escapeHtml(body.trim());
  return `<p style="white-space:pre-line;font-family:'Segoe UI',Arial,sans-serif;">${escaped}</p>`;
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { to, subject, body: messageBody, leadId, replyToId } = body || {};

    if (!to || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'Falten camps obligatoris: to, subject, body' },
        { status: 400 }
      );
    }

    const replyTo =
      process.env.SMTP_REPLY_TO?.trim() || SITE_CONFIG.business.email;

    await sendEmail({
      to,
      subject: String(subject),
      html: bodyToHtml(String(messageBody)),
      replyTo,
    });

    const resolvedLeadId = leadId || replyToId;
    if (resolvedLeadId) {
      await prisma.leadNote.create({
        data: {
          leadId: resolvedLeadId,
          content: `📧 Email enviat: ${String(subject)}`,
        },
      });
      await prisma.leadActivity.create({
        data: {
          leadId: resolvedLeadId,
          type: 'EMAIL',
          title: 'Email enviat',
          description: String(subject),
          createdBy: 'Admin',
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error enviant email admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { error: `Error enviant email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
