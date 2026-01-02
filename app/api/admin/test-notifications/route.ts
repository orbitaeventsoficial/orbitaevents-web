/**
 * API: Test de Notificacions
 * GET /api/admin/test-notifications - Diagnosticar configuració
 * POST /api/admin/test-notifications - Enviar test
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';

// GET: Diagnosticar configuració
export async function GET() {
  const config = {
    smtp: {
      host: process.env.SMTP_HOST ? '✅ Configurat' : '❌ FALTA',
      user: process.env.SMTP_USER ? '✅ Configurat' : '❌ FALTA',
      pass: process.env.SMTP_PASS ? '✅ Configurat' : '❌ FALTA',
      port: process.env.SMTP_PORT || '587 (default)',
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '❌ FALTA',
      secure: process.env.SMTP_SECURE || 'false',
    },
    recipients: {
      contactTo: process.env.CONTACT_TO || SITE_CONFIG.business.email,
      adminWhatsApp: process.env.ADMIN_WHATSAPP || SITE_CONFIG.business.phone,
    },
    webhooks: {
      whatsappWebhook: process.env.WHATSAPP_WEBHOOK_URL ? '✅ Configurat' : '❌ No configurat',
      leadWebhook: process.env.LEAD_WEBHOOK_URL ? '✅ Configurat' : '❌ No configurat',
    },
    whatsappApi: {
      url: process.env.WHATSAPP_API_URL ? '✅ Configurat' : '❌ No configurat',
      token: process.env.WHATSAPP_API_TOKEN ? '✅ Configurat' : '❌ No configurat',
    },
    status: {
      emailReady: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      whatsappReady: !!(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) || !!process.env.WHATSAPP_WEBHOOK_URL,
    },
  };

  // Instruccions si falta alguna cosa
  const instructions: string[] = [];
  
  if (!process.env.SMTP_HOST) {
    instructions.push(`
🔧 CONFIGURAR EMAIL A VERCEL:
    
1. Ves a Vercel Dashboard → El teu projecte → Settings → Environment Variables
2. Afegeix les següents variables:

   SMTP_HOST=smtp.dondominio.com
   SMTP_PORT=587
   SMTP_USER=info@orbitaevents.com
   SMTP_PASS=la_teva_contrasenya_email
   SMTP_FROM=info@orbitaevents.com
   CONTACT_TO=info@orbitaevents.com

3. Redesplega el projecte (o fes un commit buit)
    `);
  }

  if (!process.env.WHATSAPP_WEBHOOK_URL && !process.env.WHATSAPP_API_URL) {
    instructions.push(`
📱 CONFIGURAR WHATSAPP (Opcional però recomanat):

Opció A - Webhook simple (Make/IFTTT/Zapier):
   WHATSAPP_WEBHOOK_URL=https://hook.make.com/xxx
   ADMIN_WHATSAPP=+34612345678

Opció B - WhatsApp Business API:
   WHATSAPP_API_URL=https://graph.facebook.com/v17.0/PHONE_NUMBER_ID
   WHATSAPP_API_TOKEN=el_teu_token
   ADMIN_WHATSAPP=+34612345678
    `);
  }

  return NextResponse.json({
    config,
    instructions: instructions.length > 0 ? instructions : ['✅ Tot configurat correctament!'],
    canSendEmail: config.status.emailReady,
    canSendWhatsApp: config.status.whatsappReady,
  });
}

// POST: Enviar email de test
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const testEmail = body.email || process.env.CONTACT_TO || SITE_CONFIG.business.email;

    // Verificar configuració
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        error: 'SMTP no configurat',
        message: 'Falta configurar les variables SMTP_HOST, SMTP_USER i SMTP_PASS a Vercel',
        help: 'Fes GET a /api/admin/test-notifications per veure instruccions',
      }, { status: 400 });
    }

    const timestamp = new Date().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    // Enviar email de test
    await sendEmail({
      to: testEmail,
      subject: '✅ Test Òrbita Events - Email funciona!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 40px; }
    .container { max-width: 500px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #fff; }
    .content { padding: 30px; text-align: center; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    .timestamp { color: #888; font-size: 12px; margin-top: 20px; }
    .config { background: #0d0d0d; padding: 16px; border-radius: 8px; margin-top: 20px; text-align: left; font-size: 12px; }
    .config code { color: #DAA520; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Funcionant!</h1>
    </div>
    <div class="content">
      <div class="icon">🎉</div>
      <h2>Felicitats!</h2>
      <p>El sistema d'emails d'Òrbita Events està configurat correctament.</p>
      <p>A partir d'ara rebràs notificacions quan entri un nou lead.</p>
      
      <div class="config">
        <strong>Configuració activa:</strong><br>
        <code>SMTP: ${process.env.SMTP_HOST}</code><br>
        <code>FROM: ${process.env.SMTP_FROM || process.env.SMTP_USER}</code><br>
        <code>TO: ${testEmail}</code>
      </div>
      
      <div class="timestamp">
        Test enviat: ${timestamp}
      </div>
    </div>
  </div>
</body>
</html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Email de test enviat a ${testEmail}`,
      timestamp,
    });
  } catch (error) {
    log.error('Error enviant email de test:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconegut',
      help: `
Possibles solucions:
1. Verifica que la contrasenya SMTP és correcta
2. Si uses Gmail, activa "Accés d'aplicacions menys segures" o usa App Password
3. Si uses Don Dominio, assegura't que el port és 587 o 465
4. Comprova que no hi ha firewall bloquejant
      `,
    }, { status: 500 });
  }
}
