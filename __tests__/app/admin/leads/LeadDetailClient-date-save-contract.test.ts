import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('LeadDetailClient date save contract', () => {
  const detailSource = readFileSync(
    join(process.cwd(), 'app/admin/leads/[id]/LeadDetailClient.tsx'),
    'utf8',
  );
  const leadsPageSource = readFileSync(join(process.cwd(), 'app/admin/leads/page.tsx'), 'utf8');

  it('consumeix la resposta canonica del PATCH abans de refrescar la ruta', () => {
    expect(detailSource).toContain('export function fieldValueFromLeadPatchResponse');
    expect(detailSource).toContain('const data = await res.json().catch(() => ({}));');
    expect(detailSource).toContain('fieldValueFromLeadPatchResponse(data?.lead, field, editValue)');
    expect(detailSource).toContain('startTransition(() => router.refresh());');
    expect(detailSource).not.toContain('setFields((f) => ({ ...f, [field]: editValue }));');
  });

  it('rehidrata camps editables amb la veritat del servidor', () => {
    expect(detailSource).toContain('useState(() => editableFieldsFromLeadSource(lead))');
    expect(detailSource).toContain('setFields(editableFieldsFromLeadSource(lead));');
    expect(detailSource).toContain('fields.eventDate && <span className="ap-ledger-fact-wxdate"');
  });

  it('la temporada de leads no queda cachejada entre mutacions', () => {
    expect(leadsPageSource).toContain("export const dynamic = 'force-dynamic';");
  });

  it('el rail financer pot saltar al repartiment del lead', () => {
    // El pacte és lectura comercial, no una validació persistent (#1755).
    expect(detailSource).toContain('href="#lead-repartiment"');
    expect(detailSource).toContain('Veure cost col·laborador');
    expect(detailSource).not.toContain('Pacte validat');
    expect(detailSource).not.toContain('Validar partner');
  });
});
