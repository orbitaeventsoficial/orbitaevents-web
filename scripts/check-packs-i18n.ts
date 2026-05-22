/**
 * PACKS I18N GUARD
 * =================
 * Verifica que nom/tagline/features/badge de packs NO retornin claus tècniques.
 * Si detecta algun cas trencat, surt amb codi 1 perquè CI/build ho vegin.
 *
 * Ús:
 *   npx tsx scripts/check-packs-i18n.ts
 */

import { getAllPacks } from '../app/config/packs-config';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '../lib/pack-i18n';

export type Locale = 'ca' | 'es' | 'en';

export const LOCALES: Locale[] = ['ca', 'es', 'en'];
export const BROKEN_KEY_RE = /(configurator\.|pages\.|services\.)/i;

export type Finding = {
  packId: string;
  slug: string;
  locale: Locale;
  field: string;
  value: string;
};

export type PackI18nInput = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  badge?: string | null;
  features?: string[];
};

export type PackI18nResolvers = {
  resolveKey: (raw: string, locale: Locale) => string;
  resolveFeatures: (raws: string[], locale: Locale) => string[];
};

export function isBroken(value: string): boolean {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  return BROKEN_KEY_RE.test(normalized);
}

export function pushIfBroken(findings: Finding[], candidate: Finding) {
  if (isBroken(candidate.value)) findings.push(candidate);
}

export function analyzePackI18n(
  packs: PackI18nInput[],
  resolvers: PackI18nResolvers,
  locales: Locale[] = LOCALES,
): Finding[] {
  const findings: Finding[] = [];

  for (const pack of packs) {
    for (const locale of locales) {
      const name = resolvers.resolveKey(pack.name, locale);
      const tagline = resolvers.resolveKey(pack.tagline, locale);
      const badge = resolvers.resolveKey(pack.badge || '', locale);
      const features = resolvers.resolveFeatures(pack.features || [], locale);

      pushIfBroken(findings, { packId: pack.id, slug: pack.slug, locale, field: 'name', value: name });
      pushIfBroken(findings, { packId: pack.id, slug: pack.slug, locale, field: 'tagline', value: tagline });
      pushIfBroken(findings, { packId: pack.id, slug: pack.slug, locale, field: 'badge', value: badge });

      features.forEach((feature, index) => {
        pushIfBroken(findings, {
          packId: pack.id,
          slug: pack.slug,
          locale,
          field: `features[${index}]`,
          value: feature,
        });
      });
    }
  }

  return findings;
}

async function main() {
  const packs = getAllPacks();
  const findings = analyzePackI18n(packs, {
    resolveKey: resolvePackI18nKey,
    resolveFeatures: resolvePackI18nFeatures,
  });

  if (findings.length > 0) {
    console.error('\n[PACKS I18N GUARD] S\'han detectat textos trencats:\n');
    findings.forEach((f) => {
      console.error(
        `- pack=${f.packId} slug=${f.slug} locale=${f.locale} field=${f.field} -> "${f.value}"`
      );
    });
    console.error('\n[PACKS I18N GUARD] ERROR: hi ha claus tècniques visibles. Revisa traduccions/config.\n');
    process.exit(1);
  }

  console.log(`[PACKS I18N GUARD] OK: ${packs.length} packs validats en ${LOCALES.length} idiomes.`);
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].includes('check-packs-i18n');

if (isMain) {
  main().catch((error) => {
    console.error('[PACKS I18N GUARD] Error executant validació:', error);
    process.exit(1);
  });
}
