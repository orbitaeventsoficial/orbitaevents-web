import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx'), 'utf8');

describe('SummaryPanel tag mutation errors', () => {
  it('verifica resposta backend abans de refrescar tags del Customer Hub', () => {
    const start = source.indexOf('function CrmStatusBar');
    const end = source.indexOf('/* ── Contactes addicionals');
    const crmBlock = source.slice(start, end);

    expect(source).toContain('function readCustomerTagMutationError');
    expect(crmBlock).toContain('const [tagError, setTagError] = useState(\'\');');
    expect(crmBlock).toContain('throw new Error(readCustomerTagMutationError(data, "No s\'ha pogut afegir el tag"));');
    expect(crmBlock).toContain('throw new Error(readCustomerTagMutationError(data, "No s\'ha pogut eliminar el tag"));');
    expect(crmBlock).toContain('setTagError(err instanceof Error ? err.message : "No s\'ha pogut afegir el tag");');
    expect(crmBlock).toContain('setTagError(err instanceof Error ? err.message : "No s\'ha pogut eliminar el tag");');
    expect(crmBlock).toContain('role="alert"');
    expect(crmBlock).not.toMatch(/^\s*await fetchWithCsrf\(`\/api\/admin\/customers\/\$\{customer\.id\}\/tags`/m);
  });
});
