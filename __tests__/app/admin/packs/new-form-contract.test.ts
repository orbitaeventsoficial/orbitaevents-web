import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/new form contract', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/new/NewPackForm.tsx'), 'utf8');

  it('consumeix serveis canonics i evita opcions locals', () => {
    expect(source).toContain("import { PACK_SERVICE_OPTIONS } from '@/lib/constants';");
    expect(source).toContain("type PackServiceValue = (typeof PACK_SERVICE_OPTIONS)[number]['value'];");
    expect(source).toContain('PACK_SERVICE_OPTIONS.map((option)');
    expect(source).toContain('<option key={option.value} value={option.value}>{option.label}</option>');
    expect(source).not.toContain('<option value="fiestas">Festes</option>');
    expect(source).not.toContain('<option value="discomovil">Discomòbil</option>');
    expect(source).not.toContain('<option value="bodas">Bodes</option>');
    expect(source).not.toContain('<option value="empresas">Empreses</option>');
  });

  it('alinea validacio i feedback amb el servei de creacio', () => {
    expect(source).toContain("price: '',");
    expect(source).toContain("djHours: '3',");
    expect(source).toContain('price: Number(form.price)');
    expect(source).toContain('djHours: Number(form.djHours)');
    expect(source).toContain('min={1}');
    expect(source).toContain('step={1}');
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).toContain('Error: {error}');
  });

  it('usa jerarquia canonica per accions principals', () => {
    expect(source).toContain('className="ap-btn ap-btn--primary disabled:opacity-60"');
    expect(source).toContain('className="ap-btn ap-btn--secondary"');
    expect(source).not.toContain('className="ap-btn disabled:opacity-60"');
    expect(source).not.toContain('className="rounded-xl border px-4 py-2 text-sm"');
  });
});
