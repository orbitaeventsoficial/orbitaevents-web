import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const packsDir = join(process.cwd(), 'app/admin/packs');
const PACKS_LOCAL_EMOJI = /ℹ️|🔄|⭐|🎵|🔊|🌫️|🎤|👥|✏️|📦|✓|✗/u;

describe('Packs icon contract', () => {
  it('renderitza icones locals amb lucide en lloc d emoji o simbols inline', () => {
    const pageSource = readFileSync(join(packsDir, 'page.tsx'), 'utf8');
    const syncSource = readFileSync(join(packsDir, 'SyncButton.tsx'), 'utf8');

    expect(pageSource).not.toMatch(PACKS_LOCAL_EMOJI);
    expect(syncSource).not.toMatch(PACKS_LOCAL_EMOJI);
    expect(pageSource).toContain("import { Cloud, Info, Mic, Music, Package, Pencil, Star, Users, Volume2 } from 'lucide-react';");
    expect(pageSource).toContain('<Info className={PACK_ICON} aria-hidden="true" />');
    expect(pageSource).toContain('<Pencil className={PACK_ICON} aria-hidden="true" />');
    expect(syncSource).toContain("import { Check, Package, RefreshCw, X } from 'lucide-react';");
    expect(syncSource).toContain('<RefreshCw className={SYNC_ICON} aria-hidden="true" />');
  });
});
