/**
 * Notification Service - Sistema centralitzat de notificacions
 * Suporta: Email, WhatsApp, Webhook
 *
 * Òrbita Events - 2024
 */

import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';

// ============================================
// TIPUS
// ============================================

export interface LeadNotificationData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  eventType: string;
  eventDate?: Date | null;
  guestCount?: number | null;
  budget?: string | null;
  message?: string | null;
  packName?: string | null;
  estimatedPrice?: number | null;
  source: string;
  createdAt: Date;
}

export interface NotificationResult {
  success: boolean;
  channel: 'email' | 'whatsapp' | 'webhook';
  error?: string;
}

// ============================================
// CONFIGURACIÓ
// ============================================

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Cumpleaños',
  CORPORATE: '🎯 Corporativo',
  COMMUNION: '⛪ Comunión',
  BAPTISM: '👶 Bautizo',
  GRADUATION: '🎓 Graduación',
  ANNIVERSARY: '🎉 Aniversario',
  PRIVATE_PARTY: '🎵 Fiesta privada',
  OTHER: '📋 Otro',
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: '🌐 Web',
  CONFIGURATOR: '⚙️ Configurador',
  PHONE: '📞 Teléfono',
  WHATSAPP: '💬 WhatsApp',
  INSTAGRAM: '📸 Instagram',
  REFERRAL: '🤝 Referido',
  GOOGLE: '🔍 Google',
  OTHER: '📋 Otro',
};

// ============================================
// NOTIFICACIÓ PRINCIPAL - NOU LEAD
// ============================================

export async function notifyNewLead(lead: LeadNotificationData): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  // 1. Intentar enviar email
  const emailResult = await sendLeadEmailNotification(lead);
  results.push(emailResult);

  // 2. Enviar WhatsApp si el email falla o sempre com a backup
  if (!emailResult.success || process.env.ALWAYS_SEND_WHATSAPP === 'true') {
    const waResult = await sendLeadWhatsAppNotification(lead);
    results.push(waResult);
  }

  // 3. Webhook opcional (per integrar amb altres sistemes)
  if (process.env.LEAD_WEBHOOK_URL) {
    const webhookResult = await sendLeadWebhook(lead);
    results.push(webhookResult);
  }

  // Log dels resultats
  const successCount = results.filter(r => r.success).length;
  console.log(`[Notification] Lead ${lead.id}: ${successCount}/${results.length} canals exitosos`);

  return results;
}

// ============================================
// EMAIL NOTIFICATION
// ============================================

async function sendLeadEmailNotification(lead: LeadNotificationData): Promise<NotificationResult> {
  try {
    // Verificar si hi ha configuració SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn('[Email] SMTP no configurat - saltant email');
      return { success: false, channel: 'email', error: 'SMTP no configurat' };
    }

    const eventLabel = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
    const sourceLabel = SOURCE_LABELS[lead.source] || lead.source;
    const timestamp = new Date().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const adminEmailHtml = generateAdminEmailHTML(lead, eventLabel, sourceLabel, timestamp);

    await sendEmail({
      to: process.env.CONTACT_TO || SITE_CONFIG.business.email,
      subject: `🚀 NOU LEAD: ${lead.name} - ${eventLabel} ${lead.estimatedPrice ? `(${lead.estimatedPrice}€)` : ''}`,
      html: adminEmailHtml,
      replyTo: lead.email.includes('@') && !lead.email.includes('temp-') ? lead.email : undefined,
    });

    return { success: true, channel: 'email' };
  } catch (error) {
    console.error('[Email] Error enviant notificació:', error);
    return {
      success: false,
      channel: 'email',
      error: error instanceof Error ? error.message : 'Error desconegut'
    };
  }
}

// ============================================
// WHATSAPP NOTIFICATION (via URL scheme - simple)
// ============================================

async function sendLeadWhatsAppNotification(lead: LeadNotificationData): Promise<NotificationResult> {
  try {
    // Si tenim WhatsApp Business API configurat
    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) {
      return await sendWhatsAppAPI(lead);
    }

    // Si no, generem un webhook que pot obrir WhatsApp
    // Això és útil per notificar via un servei extern com IFTTT, Make, etc.
    if (process.env.WHATSAPP_WEBHOOK_URL) {
      const eventLabel = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;

      const message = `🚀 *NOU LEAD ÒRBITA*

👤 *${lead.name}*
${lead.email.includes('temp-') ? '' : `📧 ${lead.email}`}
${lead.phone ? `📱 ${lead.phone}` : ''}

🎉 *${eventLabel}*
${lead.eventDate ? `📅 ${new Date(lead.eventDate).toLocaleDateString('ca-ES')}` : ''}
${lead.guestCount ? `👥 ${lead.guestCount} convidats` : ''}
${lead.budget ? `💰 ${lead.budget}` : ''}

${lead.message ? `💬 "${lead.message}"` : ''}

${lead.packName ? `📦 Pack: ${lead.packName}` : ''}
${lead.estimatedPrice ? `💵 Estimat: ${lead.estimatedPrice}€` : ''}

🔗 Admin: https://orbitaevents.com/admin/leads/${lead.id}`;

      await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          leadId: lead.id,
          phone: process.env.ADMIN_WHATSAPP || SITE_CONFIG.business.phone,
        }),
      });

      return { success: true, channel: 'whatsapp' };
    }

    // Si no hi ha res configurat, només loguejem
    console.log('[WhatsApp] No configurat - generant link manual');
    const waLink = generateWhatsAppLink(lead);
    console.log('[WhatsApp] Link per notificar manualment:', waLink);

    return { success: false, channel: 'whatsapp', error: 'WhatsApp no configurat' };
  } catch (error) {
    console.error('[WhatsApp] Error:', error);
    return {
      success: false,
      channel: 'whatsapp',
      error: error instanceof Error ? error.message : 'Error desconegut'
    };
  }
}

// WhatsApp Business API (Cloud API)
async function sendWhatsAppAPI(lead: LeadNotificationData): Promise<NotificationResult> {
  try {
    const eventLabel = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;

    // Format per WhatsApp Business API template
    const response = await fetch(`${process.env.WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: process.env.ADMIN_WHATSAPP?.replace(/[^\d]/g, '') || SITE_CONFIG.business.phone.replace(/[^\d]/g, ''),
        type: 'text',
        text: {
          body: `🚀 NOU LEAD: ${lead.name}\n${eventLabel}\n${lead.phone || lead.email}\n\nAdmin: https://orbitaevents.com/admin/leads/${lead.id}`
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    return { success: true, channel: 'whatsapp' };
  } catch (error) {
    console.error('[WhatsApp API] Error:', error);
    return {
      success: false,
      channel: 'whatsapp',
      error: error instanceof Error ? error.message : 'Error desconegut'
    };
  }
}

// Generar link de WhatsApp per notificació manual
function generateWhatsAppLink(lead: LeadNotificationData): string {
  const eventLabel = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
  const message = `🚀 NOU LEAD: ${lead.name} - ${eventLabel}
📱 ${lead.phone || 'Sense telèfon'}
📧 ${lead.email}
🔗 https://orbitaevents.com/admin/leads/${lead.id}`;

  const adminPhone = (process.env.ADMIN_WHATSAPP || SITE_CONFIG.business.phone).replace(/[^\d]/g, '');
  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
}

// ============================================
// WEBHOOK NOTIFICATION
// ============================================

async function sendLeadWebhook(lead: LeadNotificationData): Promise<NotificationResult> {
  try {
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    if (!webhookUrl) {
      return { success: false, channel: 'webhook', error: 'Webhook no configurat' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LEAD_WEBHOOK_SECRET && {
          'X-Webhook-Secret': process.env.LEAD_WEBHOOK_SECRET
        }),
      },
      body: JSON.stringify({
        event: 'lead.created',
        timestamp: new Date().toISOString(),
        data: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          eventType: lead.eventType,
          eventDate: lead.eventDate,
          guestCount: lead.guestCount,
          budget: lead.budget,
          message: lead.message,
          packName: lead.packName,
          estimatedPrice: lead.estimatedPrice,
          source: lead.source,
          createdAt: lead.createdAt,
          adminUrl: `https://orbitaevents.com/admin/leads/${lead.id}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    return { success: true, channel: 'webhook' };
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return {
      success: false,
      channel: 'webhook',
      error: error instanceof Error ? error.message : 'Error desconegut'
    };
  }
}

// ============================================
// EMAIL HTML GENERATOR
// ============================================

function generateAdminEmailHTML(
  lead: LeadNotificationData,
  eventLabel: string,
  sourceLabel: string,
  timestamp: string
): string {
  const isEmail = lead.email.includes('@') && !lead.email.includes('temp-');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #DAA520, #B8860B); padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; color: #000; }
    .header .lead-id { font-size: 14px; color: rgba(0,0,0,0.7); margin-top: 8px; }
    .badge { display: inline-block; background: rgba(0,0,0,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 12px; }
    .content { padding: 30px; }
    .field { margin-bottom: 20px; }
    .field-label { font-size: 12px; text-transform: uppercase; color: #DAA520; letter-spacing: 1px; margin-bottom: 4px; }
    .field-value { font-size: 18px; color: #fff; }
    .highlight-box { background: rgba(218,165,32,0.1); border: 1px solid #DAA520; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .cta-button { display: block; text-align: center; background: linear-gradient(135deg, #DAA520, #B8860B); color: #000 !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 16px 0; }
    .cta-button:hover { opacity: 0.9; }
    .footer { padding: 20px; background: #0d0d0d; text-align: center; font-size: 12px; color: #666; }
    .price { font-size: 32px; font-weight: bold; color: #DAA520; margin-top: 8px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .stat-box { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #DAA520; }
    .stat-label { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 NOU LEAD!</h1>
      <div class="lead-id">ID: ${lead.id}</div>
      <div class="badge">${sourceLabel}</div>
    </div>

    <div class="content">
      <div class="field">
        <div class="field-label">Client</div>
        <div class="field-value">${lead.name}</div>
      </div>

      <div class="field">
        <div class="field-label">${isEmail ? 'Email' : 'Contacte'}</div>
        <div class="field-value">${isEmail ? lead.email : (lead.phone || lead.email)}</div>
      </div>

      ${lead.phone ? `
      <div class="field">
        <div class="field-label">Telèfon</div>
        <div class="field-value">📱 ${lead.phone}</div>
      </div>
      ` : ''}

      <div class="field">
        <div class="field-label">Tipus d'Esdeveniment</div>
        <div class="field-value">${eventLabel}</div>
      </div>

      <div class="stats-grid">
        ${lead.eventDate ? `
        <div class="stat-box">
          <div class="stat-value">📅</div>
          <div class="stat-label">${new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
        ` : ''}
        ${lead.guestCount ? `
        <div class="stat-box">
          <div class="stat-value">${lead.guestCount}</div>
          <div class="stat-label">Convidats</div>
        </div>
        ` : ''}
      </div>

      ${lead.message ? `
      <div class="field">
        <div class="field-label">Missatge</div>
        <div class="field-value" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; font-size: 14px;">
          "${lead.message}"
        </div>
      </div>
      ` : ''}

      ${lead.packName ? `
      <div class="highlight-box">
        <div class="field-label">Pack Seleccionat</div>
        <div class="field-value">${lead.packName}</div>
        ${lead.estimatedPrice ? `<div class="price">${lead.estimatedPrice.toLocaleString('es-ES')}€</div>` : ''}
      </div>
      ` : ''}

      ${lead.budget && !lead.packName ? `
      <div class="highlight-box">
        <div class="field-label">Pressupost indicat</div>
        <div class="price">${lead.budget}</div>
      </div>
      ` : ''}

      <!-- CTAs -->
      <a href="https://orbitaevents.com/admin/leads/${lead.id}" class="cta-button">
        📋 Veure Lead a l'Admin
      </a>

      ${lead.phone ? `
      <a href="https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${lead.name}! Sóc de Òrbita Events, hem rebut la teva sol·licitud per ${eventLabel.replace(/[^\w\s]/g, '')} i estem encantats d'ajudar-te. Quan et va bé que parlem?`)}" class="cta-button" style="background: #25D366;">
        💬 WhatsApp a ${lead.name.split(' ')[0]}
      </a>
      ` : ''}

      ${isEmail ? `
      <a href="mailto:${lead.email}?subject=${encodeURIComponent(`Re: La teva sol·licitud - ${eventLabel.replace(/[^\w\s]/g, '')} | Òrbita Events`)}" class="cta-button" style="background: #4A90D9;">
        ✉️ Respondre Email
      </a>
      ` : ''}
    </div>

    <div class="footer">
      <strong>Òrbita Events</strong> | Sistema de Gestió de Leads<br>
      ${timestamp}
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// NOTIFICACIÓ CANVI D'ESTAT
// ============================================

export async function notifyLeadStatusChange(
  lead: LeadNotificationData,
  oldStatus: string,
  newStatus: string,
  note?: string
): Promise<void> {
  // Només notifiquem canvis importants
  const importantChanges = ['WON', 'LOST'];

  if (importantChanges.includes(newStatus)) {
    // Podríem enviar notificació
    console.log(`[Notification] Lead ${lead.id} canviat de ${oldStatus} a ${newStatus}`);
  }
}
