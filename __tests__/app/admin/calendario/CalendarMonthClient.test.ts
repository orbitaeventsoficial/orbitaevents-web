import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CalendarMonthClient month cells dependencies', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', 'admin', 'calendario', 'CalendarMonthClient.tsx'),
    'utf8',
  );

  it('builds month cells from primitive deps without suppressing exhaustive deps', () => {
    expect(source).toContain('getMonthDays({ year: monthYear.year, month: monthYear.month })');
    expect(source).toContain('[monthYear.year, monthYear.month]');
    expect(source).not.toContain('eslint-disable-next-line react-hooks/exhaustive-deps');
  });
});
