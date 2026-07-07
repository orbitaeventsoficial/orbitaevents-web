import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('QuestionnaireTemplateActions backend errors', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/questionnaires/QuestionnaireTemplateActions.tsx'), 'utf8');

  it('mostra errors de backend i no refresca sense comprovar PATCH/DELETE', () => {
    expect(source).toContain('async function readQuestionnaireActionError');
    expect(source).toContain('return payload.error || payload.message || fallback;');
    expect(source).toContain("if (!res.ok) throw new Error(await readQuestionnaireActionError(res, \"No s'ha pogut actualitzar la plantilla\"));");
    expect(source).toContain("if (!res.ok) throw new Error(await readQuestionnaireActionError(res, \"No s'ha pogut eliminar la plantilla\"));");
    expect(source).toContain("setError(err instanceof Error ? err.message : \"No s'ha pogut actualitzar la plantilla\");");
    expect(source).toContain("setError(err instanceof Error ? err.message : \"No s'ha pogut eliminar la plantilla\");");
    expect(source).toContain('role="alert"');
    expect(source).toContain('{error}');
    expect(source).not.toContain("await fetchWithCsrf(`/api/admin/questionnaires/${id}`, { method: 'DELETE' });\n    router.refresh();");
  });
});
