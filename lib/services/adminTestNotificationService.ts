import { SITE_CONFIG } from '@/app/config/site-config';
import { sendEmail } from '@/lib/email';
import { readCronRunStatus } from '@/lib/services/cronRunStatusService';

function buildTestEmailHtml(recipient: string, timestamp: string) {
  return `
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
        <code>SMTP: Configurat correctament ✓</code><br>
        <code>FROM: Configurat correctament ✓</code><br>
        <code>TO: ${recipient}</code>
      </div>
      <div class="timestamp">
        Test enviat: ${timestamp}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function getAdminNotificationDiagnostics() {
  const automation = await readCronRunStatus('automation.commercial').catch(() => ({
    lastRun: null,
    lastStatus: null,
    lastSummary: null,
    lastMessage: null,
    health: 'unknown' as const,
  }));

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
    automation: {
      cronSecretConfigured: !!process.env.CRON_SECRET,
      lastRun: automation.lastRun,
      lastStatus: automation.lastStatus,
      lastMessage: automation.lastMessage,
      lastSummary: automation.lastSummary,
    },
  };

  const instructions: string[] = [];

  if (!process.env.SMTP_HOST) {
    instructions.push(`
🔧 CONFIGURAR EMAIL A RAILWAY:

1. Ves al panell de Railway → El teu servei → Variables
2. Afegeix les següents variables:

   SMTP_HOST=smtp.dondominio.com
   SMTP_PORT=587
   SMTP_USER=info@orbitaevents.com
   SMTP_PASS=la_teva_contrasenya_email
   SMTP_FROM=info@orbitaevents.com
   CONTACT_TO=info@orbitaevents.com

3. Redeploy del servei (o fes un commit buit)
    `);
  }

  if (!process.env.WHATSAPP_WEBHOOK_URL && !process.env.WHATSAPP_API_URL) {
    instructions.push(`
📱 CONFIGURAR WHATSAPP (Opcional però recomanat):

Opció A - Webhook simple (Make/IFTTT/Zapier):
   WHATSAPP_WEBHOOK_URL=https://hook.make.com/xxx
   ADMIN_WHATSAPP=+34612345678

Opció B - WhatsApp Business API:
   WHATSAPP_API_URL=https://your-whatsapp-api-url
   WHATSAPP_API_TOKEN=el_teu_token
   ADMIN_WHATSAPP=+34612345678
    `);
  }

  if (!process.env.CRON_SECRET) {
    instructions.push(`
🤖 CONFIGURAR AUTOPILOT COMERCIAL (Recomanat):

1. Afegeix variable a Railway:
   CRON_SECRET=una_clau_llarga_i_segura

2. Programa una crida diària (cron extern o Railway):
   GET /api/cron/commercial-daily
   Header Authorization: Bearer CRON_SECRET

3. Hora recomanada:
   Cada dia 08:00 Europe/Madrid
    `);
  }

  return {
    config,
    instructions: instructions.length > 0 ? instructions : ['✅ Tot configurat correctament!'],
    canSendEmail: config.status.emailReady,
    canSendWhatsApp: config.status.whatsappReady,
  };
}

export async function sendAdminTestEmail(email?: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return {
      ok: false as const,
      status: 400,
      body: {
        success: false,
        error: 'SMTP no configurat',
        message: 'Falta configurar les variables SMTP_HOST, SMTP_USER i SMTP_PASS a Railway',
        help: 'Fes GET a /api/admin/test-notifications per veure instruccions',
      },
    };
  }

  const recipient = email || process.env.CONTACT_TO || SITE_CONFIG.business.email;
  const timestamp = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  await sendEmail({
    to: recipient,
    subject: '✅ Test Òrbita Events - Email funciona!',
    html: buildTestEmailHtml(recipient, timestamp),
  });

  return {
    ok: true as const,
    status: 200,
    body: {
      success: true,
      ok: true,
      message: `Email de test enviat a ${recipient}`,
      timestamp,
    },
  };
}