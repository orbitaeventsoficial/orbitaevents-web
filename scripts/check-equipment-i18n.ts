/**
 * EQUIPMENT I18N GUARD
 * ====================
 * Verifica que el catàleg públic d'equipament no retorni claus tècniques.
 * Si detecta algun cas trencat, surt amb codi 1 perquè CI/build ho vegin.
 */

import { getLocalizedEquipmentCatalog } from '../app/config/equipment-config';

export type Locale = 'ca' | 'es' | 'en';

export const LOCALES: Locale[] = ['ca', 'es', 'en'];
export const BROKEN_KEY_RE = /equipmentCatalog\.[a-z0-9_.-]+/i;

export type Finding = {
  itemId: string;
  locale: Locale;
  field: string;
  value: string;
};

export type EquipmentI18nItem = {
  id: string;
  name: string;
  description: string;
  specs?: Record<string, unknown>;
};

export type EquipmentCatalogResolver = (locale: Locale) => EquipmentI18nItem[];

export function isBroken(value: string): boolean {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  return BROKEN_KEY_RE.test(normalized);
}

export function pushIfBroken(findings: Finding[], candidate: Finding) {
  if (isBroken(candidate.value)) findings.push(candidate);
}

export function analyzeEquipmentI18n(
  resolveCatalog: EquipmentCatalogResolver,
  locales: Locale[] = LOCALES,
): Finding[] {
  const findings: Finding[] = [];

  for (const locale of locales) {
    const catalog = resolveCatalog(locale);

    for (const item of catalog) {
      pushIfBroken(findings, { itemId: item.id, locale, field: 'name', value: item.name });
      pushIfBroken(findings, {
        itemId: item.id,
        locale,
        field: 'description',
        value: item.description,
      });

      Object.entries(item.specs || {}).forEach(([key, value]) => {
        pushIfBroken(findings, {
          itemId: item.id,
          locale,
          field: `specs.${key}`,
          value: String(value || ''),
        });
      });
    }
  }

  return findings;
}

async function main() {
  const findings = analyzeEquipmentI18n(getLocalizedEquipmentCatalog);

  if (findings.length > 0) {
    console.error('\n[EQUIPMENT I18N GUARD] S\'han detectat textos trencats:\n');
    findings.forEach((finding) => {
      console.error(
        `- item=${finding.itemId} locale=${finding.locale} field=${finding.field} -> "${finding.value}"`,
      );
    });
    console.error('\n[EQUIPMENT I18N GUARD] ERROR: hi ha claus tècniques visibles. Revisa traduccions/config.\n');
    process.exit(1);
  }

  console.log(`[EQUIPMENT I18N GUARD] OK: catàleg validat en ${LOCALES.length} idiomes.`);
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].includes('check-equipment-i18n');

if (isMain) {
  main().catch((error) => {
    console.error('[EQUIPMENT I18N GUARD] Error executant validació:', error);
    process.exit(1);
  });
}
