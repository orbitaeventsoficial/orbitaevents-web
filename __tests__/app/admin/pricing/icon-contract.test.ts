import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const pagePath = join(process.cwd(), 'app/admin/pricing/page.tsx');
const constantsPath = join(process.cwd(), 'lib/constants/admin.ts');
const TAB_EMOJI = /📊|🎯|✨|📦|🔧/u;
const LOCAL_PRICING_EMOJI = /💰|🏆|💡|✅|❌|🔒|⚠|✏️|⭐|✓/u;

describe('Pricing icon contract', () => {
  it('renderitza pestanyes i icones locals amb lucide en lloc d emoji inline', () => {
    const pageSource = readFileSync(pagePath, 'utf8');
    const constantsSource = readFileSync(constantsPath, 'utf8');
    const pricingTabsBlock = constantsSource.slice(
      constantsSource.indexOf('// ─── Pricing Tabs'),
      constantsSource.indexOf('// ─── Health Status'),
    );

    expect(pricingTabsBlock).not.toMatch(TAB_EMOJI);
    expect(pricingTabsBlock).toContain("export type PricingTabIcon = 'chart' | 'target' | 'sparkles' | 'package' | 'wrench';");
    expect(pageSource).not.toMatch(LOCAL_PRICING_EMOJI);
    expect(pageSource).toContain('const TAB_ICON_MAP');
    expect(pageSource).toContain('<TabIcon className={TAB_ICON} aria-hidden="true" />');
    expect(pageSource).toContain('<StatCard icon={Banknote}');
    expect(pageSource).toContain('<CheckCircle2 className={SECTION_ICON} aria-hidden="true" />');
  });
});
