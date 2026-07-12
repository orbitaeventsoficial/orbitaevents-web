import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { SITE_CONFIG } from '@/app/config/site-config';
import { sendTrackedStandaloneEmail } from '@/lib/email';
import { countPendingTestimonials, listPendingTestimonialsForReminder, type PendingTestimonialReminderItem } from '@/lib/services/testimonialAdminService';
import { getAppBaseUrl } from '@/lib/site';
import { escapeHtml } from '@/lib/utils/sanitize';

export const dynamic = 'force-dynamic';

function buildTestimonialsReminderHtml(input: {
  pendingCount: number;
  testimonials: PendingTestimonialReminderItem[];
  dashboardUrl: string;
}) {
  const rows = input.testimonials.map((testimonial) => {
    const createdAt = testimonial.createdAt.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return `
      <li style="margin:0 0 16px 0;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
        <div style="font-weight:700;color:#111827;">${escapeHtml(testimonial.name)} · ${testimonial.rating}/5</div>
        <div style="margin-top:4px;font-size:13px;color:#6b7280;">${escapeHtml(testimonial.email)} · ${escapeHtml(createdAt)}</div>
        <p style="margin:10px 0 0 0;color:#374151;line-height:1.5;">${escapeHtml(testimonial.textPreview)}</p>
      </li>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ca">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;background:#111827;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;">Testimonis pendents d'aprovació</h1>
          <p style="margin:8px 0 0 0;color:#d1d5db;">Hi ha ${input.pendingCount} testimonis pendents a l'admin d'Òrbita Events.</p>
        </div>
        <div style="padding:24px 28px;">
          <ul style="list-style:none;margin:0;padding:0;">${rows}</ul>
          <div style="margin-top:24px;text-align:center;">
            <a href="${escapeHtml(input.dashboardUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">Obrir ressenyes pendents</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const pendingCount = await countPendingTestimonials();
    if (pendingCount <= 0) {
      return NextResponse.json({ ok: true, pendingCount, sent: false });
    }

    const testimonials = await listPendingTestimonialsForReminder();
    const dashboardUrl = `${getAppBaseUrl().replace(/\/+$/, '')}/admin/ressenyes#pendents`;
    const recipient = process.env.EMAIL_TO || SITE_CONFIG.business.email;

    await sendTrackedStandaloneEmail({
      templateKey: 'testimonials-reminder',
      to: recipient,
      subject: `Testimonis pendents d'aprovació (${pendingCount}) - Òrbita Events`,
      html: buildTestimonialsReminderHtml({ pendingCount, testimonials, dashboardUrl }),
      locale: 'ca',
      orbita: { kind: 'admin', origin: 'testimonials-reminder' },
    });

    return NextResponse.json({ ok: true, pendingCount, sent: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
