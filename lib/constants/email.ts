/**
 * Email Constants — Configuració canonical de contacte i identitat per emails
 */

import { SITE_CONFIG } from '@/app/config/site-config';

export const EMAIL_CONTACT = {
  phone: SITE_CONFIG.business.phoneDisplay || SITE_CONFIG.business.phone,
  email: SITE_CONFIG.business.email,
  web: SITE_CONFIG.web.url,
} as const;
