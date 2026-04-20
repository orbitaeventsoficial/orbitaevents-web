/**
 * EQUIPMENT I18N GUARD
 * ====================
 * Verifica que el catàleg públic d'equipament no retorni claus tècniques.
 * Si detecta algun cas trencat, surt amb codi 1 perquè CI/build ho vegin.
 */

import { getLocalizedEquipmentCatalog } from '../app/config/equipment-config';

type Locale = 'ca' | 'es' | 'en';

const LOCALES: Locale[] = ['ca', 'es', 'en'];
const BROKEN_KEY_RE = /equipmentCatalog\.[a-z0-9_.-]+/i;

type Finding = {
  itemId: string;
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
  const findings: Finding[] = [];

  for (const locale of LOCALES) {
    const catalog = getLocalizedEquipmentCatalog(locale);

    for (const item of catalog) {
      pushIfBroken(findings, {
        itemId: item.id,
        locale,
        field: 'name',
        value: item.name,
      });
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

main().catch((error) => {
  console.error('[EQUIPMENT I18N GUARD] Error executant validació:', error);
  process.exit(1);
});
