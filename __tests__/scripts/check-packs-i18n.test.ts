import { describe, expect, it } from 'vitest';
import {
  BROKEN_KEY_RE,
  LOCALES,
  analyzePackI18n,
  isBroken,
  pushIfBroken,
  type Finding,
  type Locale,
  type PackI18nInput,
  type PackI18nResolvers,
} from '../../scripts/check-packs-i18n';

const echoResolvers: PackI18nResolvers = {
  resolveKey: (raw) => raw,
  resolveFeatures: (raws) => raws,
};

function makePack(overrides: Partial<PackI18nInput> = {}): PackI18nInput {
  return {
    id: 'p1',
    slug: 'pack-1',
    name: 'Pack net',
    tagline: 'Tagline neta',
    badge: '',
    features: [],
    ...overrides,
  };
}

describe('check-packs-i18n', () => {
  describe('BROKEN_KEY_RE / isBroken', () => {
    it('marca claus configurator.* com a trencades', () => {
      expect(isBroken('configurator.label')).toBe(true);
      expect(isBroken('Configurator.Other')).toBe(true);
    });

    it('marca claus pages.* i services.* com a trencades', () => {
      expect(isBroken('pages.home.title')).toBe(true);
      expect(isBroken('services.weddings.name')).toBe(true);
    });

    it('NO marca textos humans normals com a trencats', () => {
      expect(isBroken('Pack Premium')).toBe(false);
      expect(isBroken('Bodes especials')).toBe(false);
      expect(isBroken('Tagline amb punt.')).toBe(false);
    });

    it('NO marca string buit ni només-whitespace', () => {
      expect(isBroken('')).toBe(false);
      expect(isBroken('   ')).toBe(false);
      expect(isBroken('\t\n')).toBe(false);
    });

    it('regex és case-insensitive i fa match parcial', () => {
      expect(BROKEN_KEY_RE.test('foo configurator.x bar')).toBe(true);
      expect(BROKEN_KEY_RE.test('PAGES.home')).toBe(true);
    });
  });

  describe('pushIfBroken', () => {
    it('afegeix només els findings amb valor trencat', () => {
      const findings: Finding[] = [];
      pushIfBroken(findings, {
        packId: 'p1',
        slug: 's',
        locale: 'ca',
        field: 'name',
        value: 'configurator.x',
      });
      pushIfBroken(findings, {
        packId: 'p1',
        slug: 's',
        locale: 'ca',
        field: 'tagline',
        value: 'Tagline neta',
      });
      expect(findings).toHaveLength(1);
      expect(findings[0].field).toBe('name');
    });
  });

  describe('analyzePackI18n', () => {
    it('retorna 0 findings amb pack net resolt en les 3 locales', () => {
      const findings = analyzePackI18n([makePack()], echoResolvers);
      expect(findings).toEqual([]);
    });

    it('detecta name trencat en totes les locales (3 findings)', () => {
      const findings = analyzePackI18n(
        [makePack({ name: 'configurator.pack.name' })],
        echoResolvers,
      );
      expect(findings).toHaveLength(3);
      expect(findings.map((f) => f.locale).sort()).toEqual(['ca', 'en', 'es']);
      expect(findings.every((f) => f.field === 'name')).toBe(true);
    });

    it('detecta name trencat només en una locale quan el resolver torna text net en les altres', () => {
      const resolvers: PackI18nResolvers = {
        resolveKey: (raw, locale) => (locale === 'es' ? raw : 'Pack net'),
        resolveFeatures: (raws) => raws,
      };
      const findings = analyzePackI18n(
        [makePack({ name: 'configurator.pack.name' })],
        resolvers,
      );
      expect(findings).toHaveLength(1);
      expect(findings[0].locale).toBe('es');
    });

    it('detecta features trencades indexades correctament', () => {
      const findings = analyzePackI18n(
        [
          makePack({
            features: ['Feature OK', 'pages.feature.broken', 'services.also.broken'],
          }),
        ],
        echoResolvers,
        ['ca'],
      );
      expect(findings).toHaveLength(2);
      expect(findings.map((f) => f.field).sort()).toEqual([
        'features[1]',
        'features[2]',
      ]);
    });

    it('badge buit no genera finding', () => {
      const findings = analyzePackI18n(
        [makePack({ badge: '' })],
        echoResolvers,
      );
      expect(findings.filter((f) => f.field === 'badge')).toEqual([]);
    });

    it('badge trencat genera finding per locale', () => {
      const findings = analyzePackI18n(
        [makePack({ badge: 'configurator.badge.x' })],
        echoResolvers,
        ['ca', 'es'],
      );
      expect(findings).toHaveLength(2);
      expect(findings.every((f) => f.field === 'badge')).toBe(true);
    });

    it('respecta la llista de locales rebudes (no força LOCALES per defecte)', () => {
      const calls: Locale[] = [];
      const resolvers: PackI18nResolvers = {
        resolveKey: (raw, locale) => {
          calls.push(locale);
          return raw;
        },
        resolveFeatures: (raws) => raws,
      };
      analyzePackI18n([makePack()], resolvers, ['en']);
      expect(new Set(calls)).toEqual(new Set(['en']));
    });

    it('LOCALES exposa exactament ca/es/en', () => {
      expect(LOCALES).toEqual(['ca', 'es', 'en']);
    });

    it('multi-pack: agrega findings de tots els packs amb camps packId/slug correctes', () => {
      const findings = analyzePackI18n(
        [
          makePack({ id: 'a', slug: 'pack-a', tagline: 'configurator.a.tagline' }),
          makePack({ id: 'b', slug: 'pack-b', name: 'pages.b.name' }),
        ],
        echoResolvers,
        ['ca'],
      );
      expect(findings).toHaveLength(2);
      const a = findings.find((f) => f.packId === 'a');
      const b = findings.find((f) => f.packId === 'b');
      expect(a?.field).toBe('tagline');
      expect(a?.slug).toBe('pack-a');
      expect(b?.field).toBe('name');
      expect(b?.slug).toBe('pack-b');
    });
  });
});
