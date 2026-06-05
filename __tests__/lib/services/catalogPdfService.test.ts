import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logo-lockup-light-base64', () => ({
  ORBITA_LOGO_LOCKUP_LIGHT_BASE64: 'data:image/png;base64,fake',
}));

import { generateServiceBrochure } from '@/lib/services/catalogPdfService';

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
});
