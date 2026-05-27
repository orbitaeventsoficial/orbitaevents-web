import { describe, it, expect, vi } from 'vitest';

vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: {
      phoneDisplay: '654 46 70 87',
      email: 'info@orbitaevents.com',
    },
  },
}));

import { buildDossierHtml, type DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';

const client: DossierClientInfo = {
  nom: 'Joan Pla',
  email: 'joan@example.com',
  telefon: '600123456',
};

const productWithTrams: AnimacioProduct = {
  id: 'bingo-musical',
  nom: 'Bingo Musical',
  descripcio: ['Descripció del bingo.'],
  inclou: ['DJ professional', 'Cartrons'],
  noInclou: 'No inclou desplaçament',
  trams: [
    { participants: '50-100', team: '2 persones', price: 900 },
    { participants: '100-200', team: '3 persones', price: 1200 },
  ],
};

const productWithDjOptions: AnimacioProduct = {
  id: 'discomobil',
  nom: 'Discomòbil',
  descripcio: ['Sessió DJ professional.'],
  inclou: ['So', 'Llums'],
  djOptions: [
    { label: '3 hores', price: 600, sublabel: 'Bàsic' },
    { label: '5 hores', price: 900, sublabel: 'Estàndard' },
    { label: '8 hores', price: 1200, sublabel: 'Premium' },
  ],
};

describe('buildDossierHtml', () => {
  it('genera HTML vàlid amb DOCTYPE', () => {
    const html = buildDossierHtml(client, [productWithTrams]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="ca">');
  });

  it('inclou el nom del client', () => {
    const html = buildDossierHtml(client, [productWithTrams]);
    expect(html).toContain('Joan Pla');
  });

  it('inclou el nom del producte', () => {
    const html = buildDossierHtml(client, [productWithTrams]);
    expect(html).toContain('Bingo Musical');
  });

  it('inclou taula de preus si hi ha trams', () => {
    const html = buildDossierHtml(client, [productWithTrams]);
    expect(html).toContain('50-100');
    expect(html).toContain('900€');
  });

  it('inclou grid DJ si hi ha djOptions', () => {
    const html = buildDossierHtml(client, [productWithDjOptions]);
    expect(html).toContain('dj-grid');
    expect(html).toContain('600€');
  });

  it('inclou noInclou si existeix', () => {
    const html = buildDossierHtml(client, [productWithTrams]);
    expect(html).toContain('No inclou desplaçament');
  });

  it('mostra empresa si es proporciona', () => {
    const html = buildDossierHtml({ ...client, empresa: 'Empresa SA' }, [productWithTrams]);
    expect(html).toContain('Empresa SA');
  });

  it('mostra eventDesc si es proporciona', () => {
    const html = buildDossierHtml({ ...client, eventDesc: 'Aniversari 50è' }, [productWithTrams]);
    expect(html).toContain('Aniversari 50è');
  });

  it('usa salutació personalitzada si es proporciona', () => {
    const html = buildDossierHtml(
      { ...client, salutacio: 'Benvingut al dossier exclusiu.' },
      [productWithTrams],
    );
    expect(html).toContain('Benvingut al dossier exclusiu.');
  });

  it('escapeja caràcters HTML perillosos', () => {
    const html = buildDossierHtml({ ...client, nom: '<script>alert("xss")</script>' }, [productWithTrams]);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('inclou telèfon i email de contacte de SITE_CONFIG', () => {
    const html = buildDossierHtml(client, [productWithTrams]);
    expect(html).toContain('654 46 70 87');
    expect(html).toContain('info@orbitaevents.com');
  });

  it('numera les propostes des de 01', () => {
    const html = buildDossierHtml(client, [productWithTrams, productWithDjOptions]);
    expect(html).toContain('Proposta 01');
    expect(html).toContain('Proposta 02');
  });

  it('inclou portada si es proporciona logoDataUri', () => {
    const html = buildDossierHtml(client, [productWithTrams], {
      logoDataUri: 'data:image/png;base64,abc',
    });
    expect(html).toContain('portada');
    expect(html).toContain('data:image/png;base64,abc');
  });

  it('no inclou portada sense logoDataUri', () => {
    const html = buildDossierHtml(client, [productWithTrams]);
    expect(html).not.toContain('portada-logo');
  });

  it('afegeix script autoPrint si cal', () => {
    const html = buildDossierHtml(client, [productWithTrams], { autoPrint: true });
    expect(html).toContain('window.print()');
  });

  it('funciona amb llista de productes buida', () => {
    const html = buildDossierHtml(client, []);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Joan Pla');
  });
});
