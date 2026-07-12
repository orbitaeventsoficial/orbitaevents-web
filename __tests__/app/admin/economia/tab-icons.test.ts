import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const economiaDir = join(process.cwd(), 'app/admin/economia');
const TAB_EMOJI = /📊|💶|📈|💰|🔮|⚙️/u;

describe('Economia tab icons', () => {
  it('no exposa emoji com a icones de pestanya', () => {
    const typesSource = readFileSync(join(economiaDir, 'economia-types.ts'), 'utf8');
    const clientSource = readFileSync(join(economiaDir, 'EconomiaClient.tsx'), 'utf8');

    expect(typesSource).not.toMatch(TAB_EMOJI);
    expect(typesSource).toContain("export type TabIcon = 'dashboard' | 'banknote' | 'trend' | 'wallet' | 'forecast' | 'settings';");
    expect(clientSource).toContain('const TAB_ICON_MAP');
    expect(clientSource).toContain('<TabIcon className={TAB_ICON} aria-hidden="true" />');
    expect(clientSource).not.toContain('<span aria-hidden="true">{tab.icon}</span>');
  });
});
