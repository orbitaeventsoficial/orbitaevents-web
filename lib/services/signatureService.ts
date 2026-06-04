/**
 * Signature Service — Gestiona signatures de email de forma canonical
 * Centralitza tota la lògica de construcció de signatures HTML i text.
 */

import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import { absoluteUrl, getAppBaseUrl } from '@/lib/site';
import { EMAIL_CONTACT } from '@/lib/constants/email';

const APP_BASE_URL = (getAppBaseUrl()).replace(/\/+$/, '');
const EMAIL_LOGO_URL = `${APP_BASE_URL}/img/logosoloplaneta.png`;

/**
 * Llegeix la firma personalitzada de BD. Retorna null si no existeix o és buida.
 */
async function getSignatureOverride(): Promise<string | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.setting.findUnique({ where: { key: 'email.signature' } });
    const val = row?.value?.trim();
    return val && val.length > 0 ? val : null;
  } catch {
    return null;
  }
}

/**
 * Genera firma professional HTML per als emails enviats des de l'admin.
 * Si hi ha una firma personalitzada a BD, s'afegeix com a nota extra sota el bloc fix.
 */
export async function getEmailSignatureHtml(): Promise<string> {
  const [emailLogoUrl, override] = await Promise.all([
    getManagedBrandLogoUrl(),
    getSignatureOverride(),
  ]);

  const extraHtml = override
    ? `<div style="margin-top:10px;font-size:12px;color:#64748b;white-space:pre-line;">${escapeHtmlInline(override)}</div>`
    : '';

  return `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e7e5e4;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#334155;line-height:1.5;">
      <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;padding-right:14px;">
            <img src="${emailLogoUrl}" alt="Òrbita Events" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:10px;background:#111827;padding:4px;" />
          </td>
          <td style="vertical-align:top;">
            <div style="font-weight:700;font-size:14px;color:#111827;">Òrbita Events</div>
            <div style="margin-top:2px;font-size:12px;color:#64748b;">${EMAIL_CONTACT.phone} · ${EMAIL_CONTACT.email}</div>
            <div style="margin-top:2px;font-size:12px;"><a href="${EMAIL_CONTACT.web}" style="color:#0f172a;text-decoration:none;">${EMAIL_CONTACT.web}</a></div>
            ${extraHtml}
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Genera firma en text pla. Si hi ha firma personalitzada a BD, la usa.
 */
export async function getEmailSignatureText(): Promise<string> {
  const override = await getSignatureOverride();
  if (override) return `\n---\n${override}`;
  return `\n---\nÒrbita Events\n${EMAIL_CONTACT.phone} · ${EMAIL_CONTACT.email}\n${EMAIL_CONTACT.web}`;
}

/**
 * Helpers privats
 */

async function getManagedBrandLogoUrl(): Promise<string> {
  const managedLogo = await getManagedImageOverride('layout.logo.admin');
  return absoluteUrl(managedLogo?.src || EMAIL_LOGO_URL, APP_BASE_URL);
}

function escapeHtmlInline(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
