// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { openAPISchema } from '@/lib/api/openapi';

describe('openAPISchema', () => {
  it('té la versió OpenAPI 3.1 i camps obligatoris', () => {
    expect(openAPISchema.openapi).toBe('3.1.0');
    expect(openAPISchema.info.title).toBeTruthy();
    expect(openAPISchema.info.version).toBeTruthy();
    expect(openAPISchema.paths).toBeDefined();
    expect(openAPISchema.components).toBeDefined();
  });

  it('declara rutes públiques i admin essencials', () => {
    expect(openAPISchema.paths['/api/health']).toBeDefined();
    expect(openAPISchema.paths['/api/contact']).toBeDefined();
    expect(openAPISchema.paths['/api/admin/bookings']).toBeDefined();
  });
});
