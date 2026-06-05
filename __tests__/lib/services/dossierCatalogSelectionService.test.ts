import { describe, expect, it } from 'vitest';
import {
  isCatalogServiceSlug,
  resolveDossierCatalogServices,
} from '@/lib/services/dossierCatalogSelectionService';

describe('resolveDossierCatalogServices', () => {
  it('mapeja productes d animacio al servei animacion', () => {
    expect(resolveDossierCatalogServices(['bingo-musical', 'batalla-musical'])).toEqual(['animacion']);
  });

  it('conserva slugs directes de serveis de cataleg', () => {
    expect(resolveDossierCatalogServices(['discomovil', 'bodas'])).toEqual(['bodas', 'discomovil']);
  });

  it('accepta prefixos explicits per futures seleccions', () => {
    expect(resolveDossierCatalogServices(['service:empresas', 'catalog:fiestas'])).toEqual(['fiestas', 'empresas']);
  });

  it('deduplica i ignora ids desconeguts', () => {
    expect(resolveDossierCatalogServices(['bingo-musical', 'animacion', 'bogus', 'bingo-musical'])).toEqual(['animacion']);
  });

  it('ignora packs de col·laborador perquè tenen annex comercial propi', () => {
    expect(resolveDossierCatalogServices(['collab:masquerade-pirates', 'service:fiestas'])).toEqual(['fiestas']);
  });
});

describe('isCatalogServiceSlug', () => {
  it('detecta slugs i prefixos de servei', () => {
    expect(isCatalogServiceSlug('bodas')).toBe(true);
    expect(isCatalogServiceSlug('service:discomovil')).toBe(true);
    expect(isCatalogServiceSlug('bingo-musical')).toBe(false);
  });
});
