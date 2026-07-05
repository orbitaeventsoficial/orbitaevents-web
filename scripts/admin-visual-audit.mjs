#!/usr/bin/env node
/**
 * audit:visual:admin
 *
 * Runtime visual audit for the real admin surface.
 *
 * Unlike qa:smoke this is not only a pass/fail guard: it discovers admin routes,
 * captures screenshots per viewport, records browser/runtime evidence and writes
 * an incremental JSON + Markdown report that can be used by humans and agents.
 *
 * Environment:
 *   VISUAL_AUDIT_BASE=http://127.0.0.1:3001
 *   VISUAL_AUDIT_OUT=.codex-captures/visual-audit-1416
 *   VISUAL_AUDIT_ROUTE_MATCH="/admin|/admin/leads"
 *   VISUAL_AUDIT_ROUTE_LIMIT=25
 *   VISUAL_AUDIT_VIEWPORTS=desktop,tablet,mobile
 *   VISUAL_AUDIT_FULL_PAGE=0
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const BASE = process.env.VISUAL_AUDIT_BASE || process.env.SMOKE_BASE || 'http://localhost:3000';
const OUT_DIR = path.resolve(ROOT, process.env.VISUAL_AUDIT_OUT || '.codex-captures/visual-audit-admin');
const REPORT_JSON = path.join(OUT_DIR, 'visual-audit-results.json');
const REPORT_MD = path.join(OUT_DIR, 'visual-audit-report.md');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const ROUTE_LIMIT = Number.parseInt(process.env.VISUAL_AUDIT_ROUTE_LIMIT || '0', 10);
const ROUTE_MATCH_RAW = process.env.VISUAL_AUDIT_ROUTE_MATCH || '';
const ROUTE_MATCH = ROUTE_MATCH_RAW ? new RegExp(ROUTE_MATCH_RAW) : null;
const FULL_PAGE = process.env.VISUAL_AUDIT_FULL_PAGE !== '0';

const VIEWPORT_PRESETS = {
  desktop: { id: 'desktop', width: 1440, height: 1000, isMobile: false },
  tablet: { id: 'tablet', width: 768, height: 1024, isMobile: false },
  mobile: { id: 'mobile', width: 390, height: 844, isMobile: true },
};

const REQUEST_FAILURE_LIMIT = 16;
const CONSOLE_ERROR_LIMIT = 16;
const RESPONSE_FAILURE_LIMIT = 16;

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const filePath = path.join(ROOT, file);
    if (!fsSync.existsSync(filePath)) continue;
    for (const raw of fsSync.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

function authToken() {
  return Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || ''}`).toString('base64');
}

function sanitizeSegment(value) {
  return value
    .replace(/^\/+/, '')
    .replace(/\[|\]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || 'admin';
}

function routeToId(route) {
  if (route === '/admin') return 'admin-root';
  return sanitizeSegment(route.replace('/admin/', 'admin-'));
}

function classifyRoute(route) {
  if (route === '/admin' || route.startsWith('/admin/control') || route.startsWith('/admin/salut') || route.startsWith('/admin/reporting') || route.startsWith('/admin/analytics')) return 'Comandament';
  if (route.startsWith('/admin/leads') || route.startsWith('/admin/intake') || route.startsWith('/admin/sales-ops') || route.startsWith('/admin/dossiers') || route.startsWith('/admin/presupuestos')) return 'Comercial/Documents';
  if (route.startsWith('/admin/bookings') || route.startsWith('/admin/calendario') || route.startsWith('/admin/cuadrant') || route.startsWith('/admin/tasks')) return 'Operativa';
  if (route.startsWith('/admin/clientes')) return 'Clients';
  if (route.startsWith('/admin/collaborators')) return 'Partners';
  if (route.startsWith('/admin/packs') || route.startsWith('/admin/inventory') || route.startsWith('/admin/pricing') || route.startsWith('/admin/catalog') || route.startsWith('/admin/cost-calculator')) return 'Cataleg';
  if (route.startsWith('/admin/post-event')) return 'Post-event';
  if (route.startsWith('/admin/inbox') || route.startsWith('/admin/emails') || route.startsWith('/admin/email-templates') || route.startsWith('/admin/mensajes')) return 'Comunicacions';
  if (route.startsWith('/admin/portfolio') || route.startsWith('/admin/blog') || route.startsWith('/admin/social') || route.startsWith('/admin/marketing') || route.startsWith('/admin/google-reviews') || route.startsWith('/admin/campaigns') || route.startsWith('/admin/ressenyes')) return 'Web/Marketing';
  return 'Sistema';
}

async function discoverStaticRoutes(dir, base, out = []) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('[') || entry.name.startsWith('_') || entry.name.startsWith('(')) continue;
    const full = path.join(dir, entry.name);
    const route = `${base}/${entry.name}`;
    try {
      await fs.access(path.join(full, 'page.tsx'));
      out.push({ route, kind: 'static', pattern: route, group: classifyRoute(route) });
    } catch {
      // Directory without a page.
    }
    await discoverStaticRoutes(full, route, out);
  }
  return out;
}

async function discoverDynamicRoutes() {
  const fileUrl = pathToFileURL(path.join(ROOT, 'scripts', 'smoke-render-detail.mjs')).href;
  try {
    const mod = await import(fileUrl);
    if (typeof mod.resolveTargets !== 'function') return [];
    const targets = await mod.resolveTargets();
    return targets.map(([pattern, route]) => ({
      route,
      kind: 'dynamic',
      pattern,
      group: route ? classifyRoute(route) : classifyRoute(pattern),
      skipped: !route,
      skipReason: route ? '' : 'sense id de dades de prova',
    }));
  } catch (error) {
    return [{
      route: null,
      kind: 'dynamic',
      pattern: '[dynamic-resolver]',
      group: 'Sistema',
      skipped: true,
      skipReason: `no s'han pogut resoldre rutes dinamiques: ${error.message}`,
    }];
  }
}

async function discoverRoutes() {
  const staticRoutes = [
    { route: '/admin', kind: 'static', pattern: '/admin', group: classifyRoute('/admin') },
    ...(await discoverStaticRoutes(path.join(ROOT, 'app', 'admin'), '/admin')),
  ];
  const dynamicRoutes = await discoverDynamicRoutes();
  const byRoute = new Map();
  for (const item of [...staticRoutes, ...dynamicRoutes]) {
    const key = item.route || item.pattern;
    if (!byRoute.has(key)) byRoute.set(key, item);
  }
  let routes = [...byRoute.values()].sort((a, b) => (a.route || a.pattern).localeCompare(b.route || b.pattern));
  if (ROUTE_MATCH) routes = routes.filter((item) => ROUTE_MATCH.test(item.route || item.pattern));
  if (Number.isFinite(ROUTE_LIMIT) && ROUTE_LIMIT > 0) routes = routes.slice(0, ROUTE_LIMIT);
  return routes;
}

function selectedViewports() {
  const raw = process.env.VISUAL_AUDIT_VIEWPORTS || 'desktop,tablet,mobile';
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => VIEWPORT_PRESETS[id])
    .filter(Boolean);
}

function isAssetUrl(url) {
  return /\/_next\/|\.css(?:\?|$)|\.js(?:\?|$)|\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)(?:\?|$)/i.test(url);
}

function topIssues(results) {
  const issues = [];
  for (const result of results) {
    if (result.skipped) continue;
    for (const check of result.checks) {
      if (check.ok) continue;
      issues.push({
        route: result.route,
        viewport: result.viewport,
        severity: check.severity,
        check: check.id,
        message: check.message,
      });
    }
  }
  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  return issues.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9)).slice(0, 80);
}

function summarize(results, routes, viewports) {
  const rendered = results.filter((r) => !r.skipped);
  const screenshots = rendered.filter((r) => r.screenshotCreated);
  const skipped = routes.filter((r) => r.skipped);
  const checks = rendered.flatMap((r) => r.checks);
  const failedChecks = checks.filter((c) => !c.ok);
  const routesWithProblems = new Set(rendered.filter((r) => r.checks.some((c) => !c.ok)).map((r) => r.route));
  return {
    generatedAt: new Date().toISOString(),
    base: BASE,
    routeCount: routes.filter((r) => !r.skipped).length,
    skippedRouteCount: skipped.length,
    viewportCount: viewports.length,
    expectedCaptures: routes.filter((r) => !r.skipped).length * viewports.length,
    completedRenders: rendered.length,
    completedCaptures: screenshots.length,
    failedChecks: failedChecks.length,
    routesWithProblems: routesWithProblems.size,
    skipped: skipped.map((r) => ({ pattern: r.pattern, reason: r.skipReason })),
  };
}

function markdownEscape(value) {
  return String(value).replace(/\|/g, '\\|');
}

async function writeArtifacts({ routes, viewports, results }) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const summary = summarize(results, routes, viewports);
  const issues = topIssues(results);
  const payload = { summary, routes, viewports, issues, results };
  await fs.writeFile(REPORT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const byGroup = new Map();
  for (const route of routes.filter((r) => !r.skipped)) {
    if (!byGroup.has(route.group)) byGroup.set(route.group, []);
    byGroup.get(route.group).push(route);
  }

  const lines = [];
  lines.push('# Auditoria visual admin runtime');
  lines.push('');
  lines.push(`Generada: ${summary.generatedAt}`);
  lines.push(`Base: \`${BASE}\``);
  lines.push(`Sortida: \`${path.relative(ROOT, OUT_DIR)}\``);
  lines.push('');
  lines.push('## Resum');
  lines.push('');
  lines.push(`- Rutes auditables: ${summary.routeCount}`);
  lines.push(`- Rutes omeses: ${summary.skippedRouteCount}`);
  lines.push(`- Viewports: ${viewports.map((v) => v.id).join(', ')}`);
  lines.push(`- Captures completades: ${summary.completedCaptures}/${summary.expectedCaptures}`);
  lines.push(`- Checks fallits: ${summary.failedChecks}`);
  lines.push(`- Rutes amb problemes: ${summary.routesWithProblems}`);
  lines.push('');
  if (issues.length) {
    lines.push('## Incidencies principals');
    lines.push('');
    lines.push('| Severitat | Ruta | Viewport | Check | Missatge |');
    lines.push('|---|---|---|---|---|');
    for (const issue of issues) {
      lines.push(`| ${issue.severity} | \`${markdownEscape(issue.route)}\` | ${issue.viewport} | ${issue.check} | ${markdownEscape(issue.message)} |`);
    }
    lines.push('');
  }
  if (summary.skipped.length) {
    lines.push('## Rutes omeses');
    lines.push('');
    for (const skipped of summary.skipped) lines.push(`- \`${skipped.pattern}\`: ${skipped.reason}`);
    lines.push('');
  }
  lines.push('## Matriu de captures');
  lines.push('');
  for (const [group, groupRoutes] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`### ${group}`);
    lines.push('');
    lines.push('| Ruta | Viewport | HTTP | Overflow | Errors JS | Assets fallits | Captura |');
    lines.push('|---|---|---:|---|---:|---:|---|');
    for (const route of groupRoutes) {
      for (const viewport of viewports) {
        const result = results.find((r) => r.route === route.route && r.viewport === viewport.id);
        if (!result) {
          lines.push(`| \`${route.route}\` | ${viewport.id} | - | - | - | - | pendent |`);
          continue;
        }
        const overflow = result.checks.find((c) => c.id === 'horizontal-overflow');
        const assetProblemCount = [
          ...result.failedAssets,
          ...result.failedRequests.filter((request) => isAssetUrl(request.url) && !String(request.failure || '').includes('ERR_ABORTED')),
        ].length;
        const screenshot = result.screenshotCreated && result.screenshot ? path.relative(OUT_DIR, result.screenshot).replace(/\\/g, '/') : '';
        const screenshotLink = screenshot ? `[png](${screenshot})` : '';
        lines.push(`| \`${markdownEscape(route.route)}\` | ${viewport.id} | ${result.status || 0} | ${overflow?.ok ? 'OK' : 'FAIL'} | ${result.consoleErrors.length} | ${assetProblemCount} | ${screenshotLink} |`);
      }
    }
    lines.push('');
  }
  await fs.writeFile(REPORT_MD, `${lines.join('\n')}\n`, 'utf8');
}

function buildChecks({ status, metrics, consoleErrors, pageErrors, failedRequests, failedResponses, failedAssets, screenshot }) {
  const actionableFailedRequests = failedRequests.filter((request) => !String(request.failure || '').includes('ERR_ABORTED'));
  const failedAssetRequests = failedRequests.filter((request) => isAssetUrl(request.url) && !String(request.failure || '').includes('ERR_ABORTED'));
  const allFailedAssets = [...failedAssets, ...failedAssetRequests];
  const checks = [];
  checks.push({
    id: 'http-status',
    ok: status >= 200 && status < 400,
    severity: 'critical',
    message: status >= 200 && status < 400 ? 'HTTP OK' : `HTTP ${status || 0}`,
  });
  checks.push({
    id: 'admin-shell',
    ok: metrics.adminShell,
    severity: 'high',
    message: metrics.adminShell ? 'shell admin present' : 'falta shell admin real',
  });
  checks.push({
    id: 'horizontal-overflow',
    ok: !metrics.horizontalOverflow,
    severity: 'high',
    message: metrics.horizontalOverflow ? `scrollWidth ${metrics.scrollWidth} > viewport ${metrics.innerWidth}` : 'sense overflow horitzontal',
  });
  checks.push({
    id: 'blank-screen',
    ok: metrics.textLength > 80 && metrics.bodyHeight > 100,
    severity: 'critical',
    message: metrics.textLength > 80 && metrics.bodyHeight > 100 ? 'contingut present' : `possible pantalla buida: text=${metrics.textLength}, height=${metrics.bodyHeight}`,
  });
  checks.push({
    id: 'next-error-overlay',
    ok: !metrics.nextError,
    severity: 'critical',
    message: metrics.nextError ? 'text de Next/runtime error detectat' : 'sense error overlay detectable',
  });
  checks.push({
    id: 'console-errors',
    ok: consoleErrors.length === 0 && pageErrors.length === 0,
    severity: 'medium',
    message: consoleErrors.length || pageErrors.length ? `${consoleErrors.length} console errors, ${pageErrors.length} page errors` : 'sense errors JS',
  });
  checks.push({
    id: 'failed-assets',
    ok: allFailedAssets.length === 0,
    severity: 'high',
    message: allFailedAssets.length ? `${allFailedAssets.length} assets fallits` : 'assets carregats',
  });
  checks.push({
    id: 'failed-requests',
    ok: actionableFailedRequests.length === 0 && failedResponses.length === 0,
    severity: 'medium',
    message: actionableFailedRequests.length || failedResponses.length ? `${actionableFailedRequests.length} requestfailed accionables, ${failedResponses.length} responses >=400` : 'sense requests fallides accionables',
  });
  checks.push({
    id: 'screenshot',
    ok: Boolean(screenshot?.created),
    severity: 'medium',
    message: screenshot?.created ? 'captura creada' : 'captura no creada',
  });
  return checks;
}

async function auditRoute(context, route, viewport, index, total) {
  const page = await context.newPage();
  const started = Date.now();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const failedResponses = [];
  const failedAssets = [];
  let status = 0;
  let screenshot = '';
  let screenshotCreated = false;

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (consoleErrors.length >= CONSOLE_ERROR_LIMIT) return;
    consoleErrors.push(message.text().slice(0, 500));
  });
  page.on('pageerror', (error) => {
    if (pageErrors.length >= CONSOLE_ERROR_LIMIT) return;
    pageErrors.push(error.message.split('\n')[0].slice(0, 500));
  });
  page.on('requestfailed', (request) => {
    if (failedRequests.length >= REQUEST_FAILURE_LIMIT) return;
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'request failed',
    });
  });
  page.on('response', (response) => {
    const responseStatus = response.status();
    if (responseStatus < 400) return;
    const item = { status: responseStatus, url: response.url() };
    if (failedResponses.length < RESPONSE_FAILURE_LIMIT) failedResponses.push(item);
    if (isAssetUrl(response.url()) && failedAssets.length < RESPONSE_FAILURE_LIMIT) failedAssets.push(item);
  });

  try {
    const response = await page.goto(`${BASE}${route.route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = response?.status() || 0;
    try {
      await page.waitForLoadState('load', { timeout: 9000 });
    } catch {
      // Some admin screens keep dev/HMR or third-party requests open.
    }
    await page.waitForTimeout(viewport.id === 'mobile' ? 900 : 700);
  } catch (error) {
    consoleErrors.push(`navigation: ${error.message.slice(0, 500)}`);
  }

  const metrics = await page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    const html = document.documentElement;
    const body = document.body;
    const text = bodyText.toLowerCase();
    return {
      adminMode: html.classList.contains('admin-mode') || body.classList.contains('admin-mode'),
      adminShell: Boolean(document.querySelector('.ax-root, #admin-main-content')),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: html.scrollWidth,
      scrollHeight: html.scrollHeight,
      bodyHeight: Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight),
      textLength: bodyText.trim().length,
      horizontalOverflow: html.scrollWidth > window.innerWidth + 2,
      nextError: text.includes('application error') || text.includes('unhandled runtime error') || text.includes('hydration failed') || text.includes('this page could not be found'),
      title: document.title,
    };
  }).catch((error) => ({
    adminMode: false,
    adminShell: false,
    innerWidth: viewport.width,
    innerHeight: viewport.height,
    scrollWidth: 0,
    scrollHeight: 0,
    bodyHeight: 0,
    textLength: 0,
    horizontalOverflow: true,
    nextError: true,
    title: `metrics failed: ${error.message}`,
  }));

  try {
    const file = `${index.toString().padStart(3, '0')}__${routeToId(route.route)}__${viewport.id}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, file);
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: FULL_PAGE });
    screenshot = screenshotPath;
    screenshotCreated = true;
  } catch (error) {
    consoleErrors.push(`screenshot: ${error.message.slice(0, 500)}`);
  }

  await page.close();

  const elapsed = Date.now() - started;
  const checks = buildChecks({ status, metrics, consoleErrors, pageErrors, failedRequests, failedResponses, failedAssets, screenshot: { path: screenshot, created: screenshotCreated } });
  const ok = checks.every((check) => check.ok);
  const prefix = ok ? 'OK' : 'FAIL';
  process.stdout.write(`[visual-audit] ${prefix} ${index}/${total} ${viewport.id.padEnd(7)} ${String(status || 0).padStart(3)} ${route.route} ${elapsed}ms\n`);
  if (!ok) {
    const failed = checks.filter((check) => !check.ok).map((check) => check.id).join(', ');
    process.stdout.write(`  checks: ${failed}\n`);
  }

  return {
    route: route.route,
    pattern: route.pattern,
    kind: route.kind,
    group: route.group,
    viewport: viewport.id,
    status,
    elapsed,
    screenshot,
    screenshotCreated,
    metrics,
    consoleErrors,
    pageErrors,
    failedRequests,
    failedResponses,
    failedAssets,
    checks,
  };
}

async function run() {
  loadEnv();
  if (!process.env.ADMIN_PASS) {
    process.stderr.write('[visual-audit] ADMIN_PASS no definit. Revisa .env.local.\n');
    process.exit(1);
  }

  const viewports = selectedViewports();
  if (viewports.length === 0) {
    process.stderr.write('[visual-audit] cap viewport valid. Usa VISUAL_AUDIT_VIEWPORTS=desktop,tablet,mobile.\n');
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const routes = await discoverRoutes();
  const activeRoutes = routes.filter((route) => !route.skipped);
  const total = activeRoutes.length * viewports.length;
  const results = [];

  process.stdout.write(`[visual-audit] base=${BASE}\n`);
  process.stdout.write(`[visual-audit] out=${path.relative(ROOT, OUT_DIR)}\n`);
  process.stdout.write(`[visual-audit] routes=${activeRoutes.length} skipped=${routes.length - activeRoutes.length} viewports=${viewports.map((v) => v.id).join(',')} fullPage=${FULL_PAGE}\n`);

  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        hasTouch: viewport.isMobile,
        locale: 'ca-ES',
        colorScheme: 'dark',
        extraHTTPHeaders: { Authorization: `Basic ${authToken()}` },
        userAgent: viewport.isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : undefined,
      });
      let routeIndex = 0;
      for (const route of activeRoutes) {
        routeIndex += 1;
        const index = results.length + 1;
        const result = await auditRoute(context, route, viewport, index, total);
        results.push(result);
        await writeArtifacts({ routes, viewports, results });
        if (routeIndex % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 300));
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  await writeArtifacts({ routes, viewports, results });
  const summary = summarize(results, routes, viewports);
  process.stdout.write(`[visual-audit] report=${path.relative(ROOT, REPORT_MD)}\n`);
  process.stdout.write(`[visual-audit] json=${path.relative(ROOT, REPORT_JSON)}\n`);
  process.stdout.write(`[visual-audit] captures=${summary.completedCaptures}/${summary.expectedCaptures} failedChecks=${summary.failedChecks} routesWithProblems=${summary.routesWithProblems}\n`);
  if (summary.failedChecks > 0) process.exitCode = 2;
}

run().catch((error) => {
  process.stderr.write(`[visual-audit] fatal: ${error.stack || error.message}\n`);
  process.exit(1);
});
