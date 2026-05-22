import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ExportCsvButton typed row contract', () => {
  const buttonSource = readFileSync(
    join(process.cwd(), 'app', 'admin', 'components', 'ExportCsvButton.tsx'),
    'utf8',
  );
  const economySource = readFileSync(
    join(process.cwd(), 'app', 'admin', 'economia', 'EconomiaClient.tsx'),
    'utf8',
  );

  it('accepts typed rows without forcing EconomiaClient through unknown casts', () => {
    expect(buttonSource).toContain('type Column<TData>');
    expect(buttonSource).toContain('accessor: (row: TData) => string | number');
    expect(buttonSource).toContain('function ExportCsvButton<TData>');
    expect(economySource).toContain('data={[...props.topProfitability, ...props.riskProfitability]}');
    expect(economySource).not.toContain('as unknown as Record<string, unknown>[]');
  });
});
