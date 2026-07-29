import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/[id] tab query contract', () => {
  const editorSource = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');
  const hrefSource = readFileSync(join(process.cwd(), 'lib/admin/packWorkspaceHref.ts'), 'utf8');

  it('llegeix ?tab=content i arrenca a la pestanya demanada', () => {
    expect(hrefSource).toContain("export type PackWorkspaceTab = 'content';");
    expect(hrefSource).toContain('`/admin/packs/${packId}`');
    expect(hrefSource).toContain('`${base}?tab=${tab}`');

    expect(editorSource).toContain("import { useRouter, useSearchParams } from 'next/navigation';");
    expect(editorSource).toContain('function resolvePackEditorTab(value?: string | null): EditorTab');
    expect(editorSource).toContain("case 'content':");
    expect(editorSource).toContain("const tabParam = searchParams?.get('tab');");
    expect(editorSource).toContain('useState<EditorTab>(() => resolvePackEditorTab(tabParam))');
    expect(editorSource).toContain('setActiveTab(resolvePackEditorTab(tabParam));');
    expect(editorSource).toContain('}, [tabParam]);');
    expect(editorSource).not.toContain('}, [searchParams]);');
  });
});
