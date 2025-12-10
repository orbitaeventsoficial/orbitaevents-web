/**
 * API ROUTE: Test Email
 * Endpoint de test per verificar la configuració SMTP
 * NOTA: Només accessible en mode desenvolupament o amb autenticació admin
 */

import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET() {
  // En producció, no permetre test sense autenticació
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test email endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    const testTo = process.env.CONTACT_TO;

    if (!testTo) {
      return NextResponse.json(
        { error: 'CONTACT_TO not configured' },
        { status: 500 }
      );
    }

    await sendEmail({
      to: testTo,
      subject: "🧪 Test email from Òrbita Events API",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #DAA520;">✅ Email working!</h1>
          <p>This is a test email sent at ${new Date().toLocaleString('ca-ES')}.</p>
          <p style="color: #666;">If you received this, your SMTP configuration is correct.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      sentTo: testTo,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: 'Check SMTP configuration in environment variables'
      },
      { status: 500 }
    );
  }
}
