import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { chromium, type Page } from 'playwright';

loadEnvConfig(process.cwd());

type ZenitReport = {
  outputDir: string;
  created: {
    primaryLeadId?: string;
    customerId?: string;
    dossierId?: string;
    proposalId?: string;
    bookingId?: string;
    invoiceId?: string;
    portalUrl?: string;
  };
};

async function readLatestReport(): Promise<ZenitReport> {
  const root = path.join(process.cwd(), '.codex-captures', 'zenit-e2e-1850');
  const entries = await readdir(root, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const dir of dirs) {
    try {
      const raw = await readFile(path.join(root, dir, 'report.json'), 'utf8');
      const parsed = JSON.parse(raw) as ZenitReport;
      if (parsed.created?.primaryLeadId && parsed.created?.bookingId) return parsed;
    } catch {
      // keep looking
    }
  }
  throw new Error('No Zenit E2E report found');
}

function cleanSlug(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

async function capturePage(page: Page, input: {
  baseUrl: string;
  path: string;
  slug: string;
  outDir: string;
  viewport: { width: number; height: number };
}) {
  await page.setViewportSize(input.viewport);
  const url = new URL(input.path, input.baseUrl).toString();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(900);
  const status = response?.status() ?? null;
  const file = path.join(input.outDir, `${cleanSlug(input.slug)}-${input.viewport.width}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return { slug: input.slug, url, status, file };
}

async function main() {
  const report = await readLatestReport();
  const outDir = path.join(report.outputDir, 'screenshots');
  await mkdir(outDir, { recursive: true });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
  const adminUser = process.env.ADMIN_USER || 'orbita';
  const adminPass = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
  const { primaryLeadId, customerId, proposalId, bookingId, portalUrl } = report.created;
  if (!primaryLeadId || !bookingId) throw new Error('Report missing lead or booking id');
  const portalPath = portalUrl ? new URL(portalUrl).pathname : null;

  const pages = [
    { slug: 'lead-detail', path: `/admin/leads/${primaryLeadId}` },
    { slug: 'dossiers-from-lead', path: `/admin/dossiers?leadId=${primaryLeadId}` },
    { slug: 'presupuestos-from-lead', path: `/admin/presupuestos?leadId=${primaryLeadId}` },
    ...(customerId && proposalId ? [{ slug: 'presupuesto-proposal', path: `/admin/presupuestos?customerId=${customerId}&proposalId=${proposalId}` }] : []),
    { slug: 'booking-detail', path: `/admin/bookings/${bookingId}` },
    ...(portalPath ? [
      { slug: 'portal-hub', path: portalPath },
      { slug: 'portal-invoice', path: `${portalPath}/invoice` },
    ] : []),
    { slug: 'calendar', path: '/admin/calendario' },
    { slug: 'post-event-surveys', path: '/admin/post-event/surveys' },
    { slug: 'collaborators', path: '/admin/collaborators' },
    { slug: 'inventory', path: '/admin/inventory' },
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    httpCredentials: { username: adminUser, password: adminPass },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const results = [];

  for (const item of pages) {
    results.push(await capturePage(page, {
      baseUrl,
      path: item.path,
      slug: item.slug,
      outDir,
      viewport: { width: 1440, height: 1100 },
    }));
  }

  for (const item of pages.filter((p) => ['lead-detail', 'presupuestos-from-lead', 'booking-detail', 'portal-hub', 'portal-invoice'].includes(p.slug))) {
    results.push(await capturePage(page, {
      baseUrl,
      path: item.path,
      slug: `${item.slug}-mobile`,
      outDir,
      viewport: { width: 390, height: 844 },
    }));
  }

  await browser.close();
  await writeFile(path.join(outDir, 'captures.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outDir, count: results.length, results }, null, 2));
}

main()
  .then(() => {
    setImmediate(() => process.exit(0));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
