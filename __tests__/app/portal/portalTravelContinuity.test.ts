import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal travel continuity', () => {
  it('recalcula transport amb les metadades de la reserva, no amb defaults amputats', () => {
    const pagePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const pageSource = readFileSync(pagePath, 'utf8');
    const accessPath = path.join(process.cwd(), 'lib', 'services', 'clientPortalAccess.ts');
    const accessSource = readFileSync(accessPath, 'utf8');
    const travelStart = pageSource.indexOf('const travel = computeBoloTransport({');
    const travelBlock = pageSource.slice(travelStart, pageSource.indexOf('});', travelStart));

    expect(accessSource).toContain('notes: true');
    expect(travelBlock).toContain('serviceLines: booking.serviceLines ?? []');
    expect(travelBlock).toContain('hasOrbitaPack: (booking.pack.price ?? 0) > 0');
    expect(travelBlock).toContain('vehicleCostPerKm: typeof booking.fuelCostPerKm === \'number\' ? booking.fuelCostPerKm : null');
  });
});
