import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-admin-toFixed-currency.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catfc-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  const result = spawnSync('node', [SCRIPT], { cwd: tmpDir, encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-admin-toFixed-currency', () => {
  it('passa quan usa formatCurrencyExact()', () => {
    const result = runGuard({
      'app/admin/bookings/Summary.tsx': `
        <span>{formatCurrencyExact(pricing.total)}</span>
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta .toFixed(2)}€ directe', () => {
    const result = runGuard({
      'app/admin/bookings/Summary.tsx': `
        <span>{pricing.total.toFixed(2)}€</span>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('Summary.tsx');
  });

  it('detecta .toFixed(2)} € amb espai', () => {
    const result = runGuard({
      'app/admin/bookings/panel.tsx': `
        <span>{travelCharge.toFixed(2)} €</span>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('detecta .toFixed(0)}€ (0 dècimes)', () => {
    const result = runGuard({
      'app/admin/economia/Editor.tsx': `
        <p>{form.fixedCost.toFixed(0)}€</p>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('no detecta .toFixed(2)} €/km (taxa vehicular)', () => {
    const result = runGuard({
      'app/admin/bookings/MarginCard.tsx': `
        <p>{vehicleCostPerKm.toFixed(2)} €/km</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no detecta .toFixed(3)} €/L (combustible)', () => {
    const result = runGuard({
      'app/admin/economia/Config.tsx': `
        <p>{fuelPrice.toFixed(3)} €/L</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no detecta .toFixed(1)}% (percentatge)', () => {
    const result = runGuard({
      'app/admin/analytics/page.tsx': `
        <p>{conversionPct.toFixed(1)}%</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora comentaris de línia', () => {
    const result = runGuard({
      'app/admin/bookings/Summary.tsx': `
        // {pricing.total.toFixed(2)}€
        <span>{formatCurrencyExact(pricing.total)}</span>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora fitxers de canvas (allowlist)', () => {
    const result = runGuard({
      'app/admin/canvas/CanvasEditor.tsx': `
        <span>{value.toFixed(2)}€</span>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard({
      'app/admin/bookings/Summary.tsx': `
        <span>{pricing.packPrice.toFixed(2)}€</span>
        <span>{pricing.total.toFixed(2)}€</span>
      `,
      'app/admin/bookings/TravelSection.tsx': `
        <span>{travelCharge.toFixed(2)} €</span>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('3 toFixed+€');
  });

  it('detecta .toFixed(2)}€ en lib/services/', () => {
    const result = runGuard({
      'lib/services/adminQuoteEmailService.ts': `
        content: \`💰 Total: \${quoteData.total.toFixed(2)}€\`,
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('adminQuoteEmailService.ts');
  });

  it('ignora lib/services/documentService.ts (HTML de pressupost)', () => {
    const result = runGuard({
      'lib/services/documentService.ts': `
        <td>\${data.packPrice.toFixed(2)}€</td>
        <td>\${data.total.toFixed(2)}€</td>
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta .toLocaleString(locale)€ en lib/services/', () => {
    const result = runGuard({
      'lib/services/customerInsightsService.ts': `
        label: \`Cobrament pendent: \${pendingPaymentTotal.toLocaleString('ca-ES')}€\`,
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('customerInsightsService.ts');
  });

  it('ignora lib/services/executiveReportDispatchService.ts (HTML informe)', () => {
    const result = runGuard({
      'lib/services/executiveReportDispatchService.ts': `
        <li>Ingressos tancats: <strong>\${report.revenueClosed.toLocaleString('ca-ES')}€</strong></li>
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it("detecta .toLocaleString(locale) + '€' (concatenació directa)", () => {
    const result = runGuard({
      'lib/services/bookingCommunicationService.ts': `
        booking.depositAmount.toLocaleString(intlLocale) + '€',
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('bookingCommunicationService.ts');
  });

  it("detecta .toFixed(2) + '€' (concatenació directa)", () => {
    const result = runGuard({
      'app/admin/bookings/Summary.tsx': `
        <span>{pricing.total.toFixed(2) + '€'}</span>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('detecta Math.round(value)} € en app/admin/', () => {
    const result = runGuard({
      'app/admin/page.tsx': `
        value={\`\${Math.round(d.pendingPayments)} €\`}
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('page.tsx');
  });

  it('detecta Math.round(value)}€ en lib/services/', () => {
    const result = runGuard({
      'lib/services/dashboardInsightsService.ts': `
        text: \`\${Math.round(input.pendingPayments)}€ pendents de cobrar.\`,
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('dashboardInsightsService.ts');
  });
});
