/**
 * i18n smoke test for CI/deploy pipelines.
 *
 * Usage:
 *   node scripts/smoke-i18n.mjs --baseUrl=http://localhost:3000
 *   SCAN_BASE_URL=https://orbitaevents.com node scripts/smoke-i18n.mjs
 */

import { spawnSync } from 'node:child_process';

const argBase = process.argv.find((arg) => arg.startsWith('--baseUrl='))?.split('=')[1];
const baseUrl = argBase || process.env.SCAN_BASE_URL || 'http://localhost:3000';

console.log(`[smoke:i18n] Running leak scan against ${baseUrl}`);

const scan = spawnSync(
  process.execPath,
  ['scripts/scan-i18n-leaks.mjs', `--baseUrl=${baseUrl}`],
  {
    stdio: 'inherit',
    env: { ...process.env, SCAN_BASE_URL: baseUrl },
  }
);

if (scan.status !== 0) {
  console.error('[smoke:i18n] FAIL: i18n leak scan detected issues.');
  process.exit(scan.status || 1);
}

console.log('[smoke:i18n] PASS: no i18n key leaks detected.');
