import { describe, expect, it } from 'vitest';
import { formatLocalDateInputValue } from '@/lib/date-input';

describe('formatLocalDateInputValue', () => {
  it('formata YYYY-MM-DD amb el dia local', () => {
    expect(formatLocalDateInputValue(new Date(2026, 6, 5, 0, 30))).toBe('2026-07-05');
  });

  it('afegeix zeros a mes i dia', () => {
    expect(formatLocalDateInputValue(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
