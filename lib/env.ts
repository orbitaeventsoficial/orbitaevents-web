/**
 * ENVIRONMENT VALIDATION
 * ======================
 * Validates all required environment variables at startup.
 * Fails fast with clear error messages if something is missing.
 */

import { z } from 'zod';
import { getSiteUrl } from '@/lib/site';


// Schema for server-side env vars (not exposed to client)
const serverSchema = z.object({
  // Database (Required)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Admin Auth (Required)
  ADMIN_USER: z.string().min(1, 'ADMIN_USER is required'),
  ADMIN_PASS: z.string().min(8, 'ADMIN_PASS must be at least 8 characters'),

  // CSRF Protection (Required in production)
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters').optional(),

  // Email (Optional - some features won't work without it)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  CONTACT_TO: z.string().optional(),

  // Storage (Optional)
  UPLOADS_DIR: z.string().optional(),

  // Rate limiting (Optional)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),


  // Cron (Optional)
  CRON_SECRET: z.string().optional(),

  // External APIs (Optional)
  SERPAPI_KEY: z.string().optional(),
  OUTSCRAPER_API_KEY: z.string().optional(),
  DEEPL_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  ORBITA_BASE_ADDRESS: z.string().optional(),

  // GA4 Admin Analytics (Optional)
  GA4_PROPERTY_ID: z.string().optional(),
  GA4_CLIENT_EMAIL: z.string().optional(),
  GA4_PRIVATE_KEY: z.string().optional(),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
  GOOGLE_ADS_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_ADS_CLIENT_ID: z.string().optional(),
  GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Schema for client-side env vars (exposed via NEXT_PUBLIC_)
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ADS_URL: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_ADS_STUDIO_URL: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_PLACE_ID: z.string().optional(),
  NEXT_PUBLIC_FB_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_TAWK_ENABLED: z.string().optional(),
  NEXT_PUBLIC_TAWK_PROPERTY_ID: z.string().optional(),
  NEXT_PUBLIC_TAWK_WIDGET_ID: z.string().optional(),
});

// Combined schema
const envSchema = serverSchema.merge(clientSchema);

export type Env = z.infer<typeof envSchema>;

// Validation function
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `  - ${key}: ${messages?.join(', ')}`)
      .join('\n');

    console.error('❌ Invalid environment variables:\n' + errorMessages);

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables. Check server logs.');
    }

    // In development, warn but continue
    console.warn('⚠️ Continuing with invalid env vars (development mode)');
  }

  return parsed.data as Env;
}

// Validate on import (runs once at startup)
export const env = validateEnv();

// Type-safe getters for common env vars
export const getEnv = {
  isDev: () => process.env.NODE_ENV === 'development',
  isProd: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
  siteUrl: () => getSiteUrl(),
  databaseUrl: () => process.env.DATABASE_URL,
};
