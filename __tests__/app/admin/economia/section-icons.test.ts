import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const clientPath = join(process.cwd(), 'app/admin/economia/EconomiaClient.tsx');
const SECTION_EMOJI = /⚠️|📉|🏆|📊|⏰/u;

describe('Economia section icons', () => {
  it('renderitza indicadors amb lucide en lloc d emoji inline', () => {
    const source = readFileSync(clientPath, 'utf8');

    expect(source).not.toMatch(SECTION_EMOJI);
    expect(source).toContain('TriangleAlert');
    expect(source).toContain('TrendingDown');
    expect(source).toContain('Trophy');
    expect(source).toContain('Clock3');
    expect(source).toContain('ChartBar');
    expect(source).toContain('const CARD_ICON');
    expect(source).toContain('const ALERT_CARD_ICON');
  });
});
