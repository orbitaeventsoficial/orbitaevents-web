// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-pdf-preview-real-data.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-preview-real-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  const result = spawnSync('node', [SCRIPT], { cwd: tmpDir, encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-pdf-preview-real-data', () => {
  it('passa quan les previews deleguen a servei real', () => {
    const result = runGuard({
      'app/api/admin/studio/preview/pressupost/route.ts': `import { renderLatestRealQuotePreview } from '@/lib/services/pdfPreviewService';`,
      'lib/services/pdfPreviewService.ts': `export async function renderLatestRealQuotePreview() { return Buffer.from([]); }`,
    });
    expect(result.status).toBe(0);
  });

  it('detecta clients i imports ficticis dins previews PDF', () => {
    const result = runGuard({
      'app/api/admin/studio/preview/factura/route.ts': `const clientName = 'Marta Soler i Jordi Vila'; const iban = 'ES00 0000 0000 0000 0000 0000';`,
      'lib/services/pdfPreviewService.ts': '',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Marta');
    expect(result.stderr).toContain('ES00 0000');
  });
});
