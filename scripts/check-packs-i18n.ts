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

type Locale = 'ca' | 'es' | 'en';

const LOCALES: Locale[] = ['ca', 'es', 'en'];
const BROKEN_KEY_RE = /(configurator\.|pages\.|services\.)/i;

type Finding = {
  packId: string;
  slug: string;
  locale: Locale;
  field: string;
  value: string;
};

function isBroken(value: string): boolean {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  return BROKEN_KEY_RE.test(normalized);
}

function pushIfBroken(findings: Finding[], candidate: Finding) {
  if (isBroken(candidate.value)) findings.push(candidate);
}

async function main() {
  const packs = getAllPacks();
  const findings: Finding[] = [];

  for (const pack of packs) {
    for (const locale of LOCALES) {
      const name = resolvePackI18nKey(pack.name, locale);
      const tagline = resolvePackI18nKey(pack.tagline, locale);
      const badge = resolvePackI18nKey(pack.badge || '', locale);
      const features = resolvePackI18nFeatures(pack.features || [], locale);

      pushIfBroken(findings, {
        packId: pack.id,
        slug: pack.slug,
        locale,
        field: 'name',
        value: name,
      });
      pushIfBroken(findings, {
        packId: pack.id,
        slug: pack.slug,
        locale,
        field: 'tagline',
        value: tagline,
      });
      pushIfBroken(findings, {
        packId: pack.id,
        slug: pack.slug,
        locale,
        field: 'badge',
        value: badge,
      });

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

main().catch((error) => {
  console.error('[PACKS I18N GUARD] Error executant validació:', error);
  process.exit(1);
});

