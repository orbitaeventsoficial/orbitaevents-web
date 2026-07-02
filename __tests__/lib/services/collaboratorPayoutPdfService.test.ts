import { describe, expect, it } from 'vitest';
import { generateCollaboratorPayoutPDF } from '@/lib/services/collaboratorPayoutPdfService';
import type { CollaboratorPayoutSummary } from '@/lib/services/collaboratorPayoutService';

function summary(): CollaboratorPayoutSummary {
  return {
    collaboratorId: 'masquerade',
    collaboratorName: 'Masquerade Events',
    totals: { previ: 342, aPagar: 200, pagat: 160 },
    months: [{ month: '2026-09', previ: 342, aPagar: 0, pagat: 0 }],
    bolos: [
      {
        origin: 'booking', parentId: 'B1', parentRef: 'Alba Orna',
        dateKey: '2026-09-05', eventDate: new Date('2026-09-05'), status: 'PREVI',
        amount: 342, paidAt: null, paymentId: null, paymentMethod: null,
        eventStartTime: '17:00', eventEndTime: '18:30', eventLocation: 'l\'Aldosa',
        jornada: { departureTime: '13:12', arrivalTime: '16:15', teardownEndTime: '19:15', returnTime: '22:18', workHours: 9.1 },
      },
    ],
  };
}

describe('generateCollaboratorPayoutPDF', () => {
  it('genera un PDF vàlid amb bolos i logística', async () => {
    const doc = await generateCollaboratorPayoutPDF(summary());
    const out = doc.output('arraybuffer');
    expect(out.byteLength).toBeGreaterThan(1000);
    // Capçalera %PDF
    const head = Buffer.from(out.slice(0, 5)).toString('latin1');
    expect(head).toBe('%PDF-');
  });

  it('no peta amb un col·laborador sense bolos', async () => {
    const empty = { ...summary(), bolos: [], totals: { previ: 0, aPagar: 0, pagat: 0 }, months: [] };
    const doc = await generateCollaboratorPayoutPDF(empty);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(500);
  });
});
