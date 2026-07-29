import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/[id] tab icons', () => {
  const constantsSource = readFileSync(join(process.cwd(), 'lib/constants/admin.ts'), 'utf8');
  const editorSource = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');
  const packTabsSource = constantsSource.slice(
    constantsSource.indexOf('// ─── Pack Editor Tabs'),
    constantsSource.indexOf('// ─── PDF Studio Defaults')
  );

  it('usa claus semantiques i Lucide en lloc d emojis als tabs', () => {
    expect(packTabsSource).toContain("export type PackEditorTabIcon = 'banknote' | 'sliders' | 'languages' | 'check';");
    expect(packTabsSource).toContain("icon: 'banknote'");
    expect(packTabsSource).toContain("icon: 'sliders'");
    expect(packTabsSource).toContain("icon: 'languages'");
    expect(packTabsSource).toContain("icon: 'check'");
    expect(packTabsSource).not.toContain("icon: '💰'");
    expect(packTabsSource).not.toContain("icon: '🎛️'");
    expect(packTabsSource).not.toContain("icon: '🌐'");
    expect(packTabsSource).not.toContain("icon: '✅'");

    expect(editorSource).toContain("import type { LucideIcon } from 'lucide-react';");
    expect(editorSource).toContain('const TAB_ICON_MAP: Record<(typeof ADMIN_PACK_EDITOR_TABS)[number][\'icon\'], LucideIcon>');
    expect(editorSource).toContain('<Icon className={TAB_ICON} aria-hidden="true" />');
    expect(editorSource).not.toContain('{t.icon} {t.label}');
  });
});
