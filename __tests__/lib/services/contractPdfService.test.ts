import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logo-lockup-light-base64', () => ({
  ORBITA_LOGO_LOCKUP_LIGHT_BASE64: 'data:image/png;base64,fake',
}));

import { generateContractPDF, type ContractPdfData } from '@/lib/services/contractPdfService';

function pdfText(doc: Awaited<ReturnType<typeof generateContractPDF>>): string {
  return String((doc as unknown as { internal: { pages: unknown[][] } }).internal.pages.flat().join('\n'));
}

function makeContractData(overrides: Partial<ContractPdfData> = {}): ContractPdfData {
  return {
    contractReference: 'CT-2026-001',
    contractDate: '2026-06-05',

    companyName: 'Òrbita Events',
    companyLegalName: 'Òrbita Events SL',
    companyNIF: 'B12345678',
    companyAddress: 'Carrer Major, 1, Granollers',
    companyIBAN: 'ES91 2100 0418 4502 0005 1332',
    companyPhone: '93 800 00 00',
    companyEmail: 'info@orbitaevents.com',

    clientName: 'Joan Puig',
    clientNIF: '12345678Z',
    clientAddress: 'Carrer de la Pau, 5, Barcelona',
    clientEmail: 'joan@example.com',
    clientPhone: '600 000 000',

    eventType: 'Casament',
    eventDate: '2026-09-20',
    eventTime: '18:00',
    eventEndTime: '02:00',
    eventLocation: 'Masia Can Roca, Granollers',
    guestCount: 150,
    packName: 'Pack Premium Casament',
    packPrice: 1800,
    djHours: 8,
    extras: [
      { name: 'Cabina fotogràfica', price: 300, quantity: 1 },
    ],

    subtotal: 2100,
    discount: 100,
    vatRate: 21,
    vatAmount: 420,
    total: 2420,

    depositAmount: 500,
    depositDueDate: '2026-07-01',
    finalPaymentDue: '2026-09-15',

    cancellationPolicy: 'Cancel·lació amb menys de 30 dies: 50% del total. Cancel·lació amb menys de 7 dies: 100% del total.',
    additionalClauses: 'El DJ disposa d\'espai per a muntatge 2 hores abans de l\'inici.',

    signedBy: 'Joan Puig',
    signedAt: new Date('2026-06-05T10:00:00Z'),
    ...overrides,
  };
}

describe('generateContractPDF', () => {
  it('retorna un doc jsPDF vàlid per a un contracte complet', async () => {
    const doc = await generateContractPDF(makeContractData());
    expect(doc).toBeDefined();
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
    const header = new Uint8Array(output.slice(0, 5));
    expect(String.fromCharCode(...header)).toBe('%PDF-');
  });

  it('funciona en espanyol', async () => {
    const doc = await generateContractPDF(makeContractData(), 'es');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('funciona en anglès', async () => {
    const doc = await generateContractPDF(makeContractData(), 'en');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('funciona sense camps opcionals (clientNIF, clientAddress, eventEndTime, extras, additionalClauses)', async () => {
    const doc = await generateContractPDF(makeContractData({
      clientNIF: undefined,
      clientAddress: undefined,
      clientPhone: undefined,
      eventTime: undefined,
      eventEndTime: undefined,
      extras: undefined,
      additionalClauses: undefined,
      signedBy: undefined,
      signedAt: null,
    }));
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('funciona sense descompte', async () => {
    const doc = await generateContractPDF(makeContractData({ discount: 0 }));
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('usa llenguatge comercial clar per la paga i senyal en català', async () => {
    const doc = await generateContractPDF(makeContractData(), 'ca');
    const text = pdfText(doc);
    expect(text).toContain('Paga i senyal');
    expect(text).toContain('Venciment paga i senyal');
    expect(text).not.toContain('Aval (dipòsit)');
  });
});
