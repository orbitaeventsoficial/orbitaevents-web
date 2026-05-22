import { describe, expect, it } from 'vitest';
import {
  BROKEN_KEY_RE,
  LOCALES,
  analyzeEquipmentI18n,
  isBroken,
  pushIfBroken,
  type EquipmentI18nItem,
  type Finding,
  type Locale,
} from '../../scripts/check-equipment-i18n';

function makeItem(overrides: Partial<EquipmentI18nItem> = {}): EquipmentI18nItem {
  return {
    id: 'item-1',
    name: 'Cadira plegable',
    description: 'Cadira blanca per esdeveniments',
    specs: {},
    ...overrides,
  };
}

describe('check-equipment-i18n', () => {
  describe('BROKEN_KEY_RE / isBroken', () => {
    it('marca claus equipmentCatalog.* com a trencades', () => {
      expect(isBroken('equipmentCatalog.chair.name')).toBe(true);
      expect(isBroken('equipmentCatalog.lighting.spec.power')).toBe(true);
    });

    it('és case-insensitive', () => {
      expect(isBroken('EquipmentCatalog.x')).toBe(true);
      expect(isBroken('EQUIPMENTCATALOG.y')).toBe(true);
    });

    it('NO marca textos humans normals com a trencats', () => {
      expect(isBroken('Cadira blanca')).toBe(false);
      expect(isBroken('Taula rodona 180 cm')).toBe(false);
      expect(isBroken('LED RGB 200 W')).toBe(false);
    });

    it('NO marca string buit ni només-whitespace', () => {
      expect(isBroken('')).toBe(false);
      expect(isBroken('   ')).toBe(false);
    });

    it('NO marca claus diferents (configurator/pages/services NO afecten equipment)', () => {
      expect(isBroken('configurator.label')).toBe(false);
      expect(isBroken('pages.home.title')).toBe(false);
    });
  });

  describe('pushIfBroken', () => {
    it('afegeix només findings trencats', () => {
      const findings: Finding[] = [];
      pushIfBroken(findings, {
        itemId: 'i',
        locale: 'ca',
        field: 'name',
        value: 'equipmentCatalog.x',
      });
      pushIfBroken(findings, {
        itemId: 'i',
        locale: 'ca',
        field: 'description',
        value: 'Descripció normal',
      });
      expect(findings).toHaveLength(1);
      expect(findings[0].field).toBe('name');
    });
  });

  describe('analyzeEquipmentI18n', () => {
    it('retorna 0 findings amb catàleg net en les 3 locales', () => {
      const findings = analyzeEquipmentI18n(() => [makeItem()]);
      expect(findings).toEqual([]);
    });

    it('detecta name trencat per cada locale', () => {
      const findings = analyzeEquipmentI18n(() => [
        makeItem({ name: 'equipmentCatalog.chair.name' }),
      ]);
      expect(findings).toHaveLength(3);
      expect(findings.every((f) => f.field === 'name')).toBe(true);
      expect(findings.map((f) => f.locale).sort()).toEqual(['ca', 'en', 'es']);
    });

    it('detecta description trencada', () => {
      const findings = analyzeEquipmentI18n(
        () => [makeItem({ description: 'equipmentCatalog.chair.description' })],
        ['ca'],
      );
      expect(findings).toHaveLength(1);
      expect(findings[0].field).toBe('description');
    });

    it('detecta specs trencats amb el path "specs.<key>"', () => {
      const findings = analyzeEquipmentI18n(
        () => [
          makeItem({
            specs: {
              power: 'equipmentCatalog.spec.power',
              size: 'equipmentCatalog.spec.size',
              color: 'White',
            },
          }),
        ],
        ['ca'],
      );
      expect(findings).toHaveLength(2);
      expect(findings.map((f) => f.field).sort()).toEqual([
        'specs.power',
        'specs.size',
      ]);
    });

    it('catàleg pot variar per locale (resolver retorna catàleg diferent per cada idioma)', () => {
      const catalogByLocale: Record<Locale, EquipmentI18nItem[]> = {
        ca: [makeItem({ id: 'c-ok', name: 'Cadira' })],
        es: [makeItem({ id: 'c-bad', name: 'equipmentCatalog.chair' })],
        en: [makeItem({ id: 'c-ok', name: 'Chair' })],
      };
      const findings = analyzeEquipmentI18n((locale) => catalogByLocale[locale]);
      expect(findings).toHaveLength(1);
      expect(findings[0].locale).toBe('es');
      expect(findings[0].itemId).toBe('c-bad');
    });

    it('specs amb valor null/undefined no genera finding (es coerceix a string buit)', () => {
      const findings = analyzeEquipmentI18n(
        () => [
          makeItem({
            specs: { brand: undefined, model: null as unknown as string, color: '' },
          }),
        ],
        ['ca'],
      );
      expect(findings).toEqual([]);
    });

    it('respecta locales rebudes per paràmetre', () => {
      const seen: Locale[] = [];
      analyzeEquipmentI18n((locale) => {
        seen.push(locale);
        return [makeItem()];
      }, ['en']);
      expect(seen).toEqual(['en']);
    });

    it('LOCALES exposa exactament ca/es/en', () => {
      expect(LOCALES).toEqual(['ca', 'es', 'en']);
    });

    it('verifica que el regex coincideix amb una clau parcial dins un text', () => {
      expect(BROKEN_KEY_RE.test('Some prefix equipmentCatalog.chair suffix')).toBe(true);
    });
  });
});
