// app/api/admin/emails/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 3 test emails per 5 minutes
  const rateLimitResult = checkRateLimit(req, { ...RATE_LIMITS.contact, limit: 3 });
  if (rateLimitResult) return rateLimitResult;

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invàlid' }, { status: 400 });
    }

    const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #DAA520, #B8860B); padding: 30px; text-align: center;">
      <h1 style="color: #000; margin: 0; font-size: 24px;">✅ Email de Prova</h1>
    </div>
    <div style="padding: 30px; color: #e5e5e5;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">
        Si estàs llegint aquest email, la configuració SMTP funciona correctament.
      </p>
      <div style="background: rgba(34,197,94,0.1); border: 1px solid #22c55e; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #22c55e; font-weight: bold;">
          🎉 Tot configurat correctament!
        </p>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Enviat des del panell d'administració d'Òrbita Events.
      </p>
    </div>
    <div style="padding: 20px; background: #0a0a0a; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        © ${new Date().getFullYear()} Òrbita Events · ${SITE_CONFIG.business.phone}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: email,
      subject: '✅ Email de Prova - Òrbita Events Admin',
      html: testHtml,
    });

    return NextResponse.json({ ok: true, message: 'Email de prova enviat' });
  } catch (error) {
    log.error('Error enviant email de prova:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error enviant email' },
      { status: 500 }
    );
  }
}
