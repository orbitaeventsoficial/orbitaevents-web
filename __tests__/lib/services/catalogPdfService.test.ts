import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logo-lockup-light-base64', () => ({
  ORBITA_LOGO_LOCKUP_LIGHT_BASE64: 'data:image/png;base64,fake',
}));

import { generateServiceBrochure, generateFullCatalogPDF } from '@/lib/services/catalogPdfService';

function pdfText(doc: Awaited<ReturnType<typeof generateServiceBrochure>>): string {
  return String((doc as unknown as { internal: { pages: unknown[][] } }).internal.pages.flat().join('\n'));
}

describe('generateServiceBrochure', () => {
  it('retorna un doc jsPDF vàlid per al servei bodas en català', async () => {
    const doc = await generateServiceBrochure('bodas', 'ca');
    expect(doc).toBeDefined();
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
    const header = new Uint8Array(output.slice(0, 5));
    expect(String.fromCharCode(...header)).toBe('%PDF-');
  });

  it('funciona per a fiestas en espanyol', async () => {
    const doc = await generateServiceBrochure('fiestas', 'es');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('funciona per a discomovil en anglès', async () => {
    const doc = await generateServiceBrochure('discomovil', 'en');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('funciona per a empresas', async () => {
    const doc = await generateServiceBrochure('empresas', 'ca');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('tanca amb una CTA de decisió en lloc de dubtes sense compromís', async () => {
    const doc = await generateServiceBrochure('bodas', 'ca');
    const text = pdfText(doc);

    expect(text).toContain('Quan tingueu clara la direcció, ajustem proposta, data i detalls.');
    expect(text).not.toContain('Tens dubtes? Escriu-nos sense compromís!');
  });

  it('manté la CTA de decisió en castellà i anglès', async () => {
    const esDoc = await generateServiceBrochure('fiestas', 'es');
    const enDoc = await generateServiceBrochure('discomovil', 'en');

    expect(pdfText(esDoc)).toContain('Cuando tengáis clara la dirección, ajustamos propuesta, fecha y detalles.');
    expect(pdfText(esDoc)).not.toContain('¿Tienes dudas? ¡Escríbenos sin compromiso!');
    expect(pdfText(enDoc)).toContain('When the direction is clear, we tailor the proposal, date, and details.');
    expect(pdfText(enDoc)).not.toContain('Have questions? Contact us with no obligation!');
  });
});

describe('generateFullCatalogPDF', () => {
  it('genera un PDF amb tots els serveis (5 pàgines mínim)', async () => {
    const doc = await generateFullCatalogPDF();
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
    const header = new Uint8Array(output.slice(0, 5));
    expect(String.fromCharCode(...header)).toBe('%PDF-');
    // 5 serveis = mínim 5 pàgines
    expect(doc.internal.pages.length - 1).toBeGreaterThanOrEqual(5);
  });

  it('accepta un subconjunt de serveis', async () => {
    const doc = await generateFullCatalogPDF(['bodas', 'fiestas'], 'es');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
    expect(doc.internal.pages.length - 1).toBeGreaterThanOrEqual(2);
  });
});
