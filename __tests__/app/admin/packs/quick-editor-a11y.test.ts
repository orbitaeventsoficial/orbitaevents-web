import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const editorPath = join(process.cwd(), 'app/admin/packs/PackPriceQuickEditor.tsx');

describe('PackPriceQuickEditor accessibility', () => {
  it('usa labels reals i anuncia el feedback de desat', () => {
    const source = readFileSync(editorPath, 'utf8');

    expect(source).toContain("import { useId, useMemo, useState } from 'react';");
    expect(source).toContain('htmlFor={`${fieldId}-pack-price`}');
    expect(source).toContain('id={`${fieldId}-pack-price`}');
    expect(source).toContain('htmlFor={`${fieldId}-extra-hour-price`}');
    expect(source).toContain('id={`${fieldId}-extra-hour-price`}');
    expect(source).toContain("role={msg.type === 'success' ? 'status' : 'alert'}");
    expect(source).toContain("setMsg({ type: 'success', text: 'PVP desat' })");
    expect(source).toContain("setMsg({ type: 'error', text: error instanceof Error ? error.message : 'Error en desar' })");
  });
});
