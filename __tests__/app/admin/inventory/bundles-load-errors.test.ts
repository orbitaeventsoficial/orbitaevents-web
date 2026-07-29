import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('inventory bundles load errors', () => {
  const inventorySource = readFileSync(join(process.cwd(), 'app/admin/inventory/InventoryListClient.tsx'), 'utf8');
  const packEditorSource = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');

  it('fa visibles els errors de lots a inventari', () => {
    expect(inventorySource).toContain("throw new Error(data.error || data.message || 'No s\\'han pogut carregar els lots.');");
    expect(inventorySource).toContain("log.error('[Inventory] Error carregant lots'");
    expect(inventorySource).toContain("setBundleMessage(error instanceof Error ? error.message : 'No s\\'han pogut carregar els lots.');");
    expect(inventorySource).not.toContain('if (!res.ok) return;');
  });

  it('fa visibles els errors de lots a l editor de packs', () => {
    expect(packEditorSource).toContain("const [bundleLoadError, setBundleLoadError] = useState('');");
    expect(packEditorSource).toContain("throw new Error(data.error || data.message || 'No s\\'han pogut carregar els lots.');");
    expect(packEditorSource).toContain("setBundleLoadError(error instanceof Error ? error.message : 'No s\\'han pogut carregar els lots.');");
    expect(packEditorSource).toContain('bundleLoadError && (');
    expect(packEditorSource).not.toContain('if (!res.ok) return;');
  });
});
