#!/usr/bin/env node
/**
 * Smoke test contra producció.
 *
 * Verifica que els endpoints crítics responen amb HTTP correcte i sota un
 * temps màxim. NO usa mocks. Es dispara automàticament després de cada
 * deploy (GitHub Actions) per detectar regressions com:
 *
 * - L'API està morta
 * - Redirects trencats (cas #492 www. → :8080)
 * - Endpoints admin que peguen 502 per timeout (cas #496 inbox source: true)
 * - Auth basic deixa de funcionar
 * - Respostes amb status diferent de l'esperat
 *
 * Configuració via env:
 *   SMOKE_BASE_URL    URL base (default https://orbitaevents.com)
 *   SMOKE_AUTH        Basic auth en format "user:pass" (sense base64)
 *   SMOKE_MAX_MS      Temps màxim per check, default 5000ms
 *
 * Surt amb codi:
 *   0 → tots els checks OK
 *   1 → algun check ha fallat
 */

const BASE_URL = (process.env.SMOKE_BASE_URL || 'https://orbitaevents.com').replace(/\/$/, '');
const MAX_MS = Number.parseInt(process.env.SMOKE_MAX_MS || '5000', 10);
const AUTH_RAW = process.env.SMOKE_AUTH || '';
const AUTH_HEADER = AUTH_RAW ? `Basic ${Buffer.from(AUTH_RAW).toString('base64')}` : '';

/**
 * @typedef {Object} SmokeCheck
 * @property {string} name        — etiqueta llegible
 * @property {string} url         — path absolut o URL completa
 * @property {number} expectStatus — status HTTP esperat
 * @property {boolean} requireAuth — afegir header Basic
 * @property {boolean} expectJson — verificar que retorna JSON
 * @property {(body: any) => string | null} expectBody — verificació opcional del cos. Retorna missatge d'error o null.
 */

/** @type {SmokeCheck[]} */
const CHECKS = [
  {
    name: 'Health endpoint públic',
    url: '/api/health',
    expectStatus: 200,
    requireAuth: false,
    expectJson: true,
    expectBody: (body) => {
      // Accepta status "ok" o "degraded" sempre que database+api passen.
      // "degraded" pot venir de checks no crítics (Sentry warn, etc.) i
      // no és motiu de pànic. Però si database o api fallen, alarma.
      const dbStatus = body?.checks?.database?.status;
      const apiStatus = body?.checks?.api?.status;
      if (dbStatus && dbStatus !== 'pass') {
        return `Database status=${dbStatus} (${body?.checks?.database?.message || 'sense missatge'})`;
      }
      if (apiStatus && apiStatus !== 'pass') {
        return `API status=${apiStatus} (${body?.checks?.api?.message || 'sense missatge'})`;
      }
      if (body?.status === 'down' || body?.status === 'fail') {
        return `Health status=${body.status}`;
      }
      return null;
    },
  },
  {
    name: 'Home pública (sense www)',
    url: '/',
    expectStatus: 200,
    requireAuth: false,
    expectJson: false,
    expectBody: () => null,
  },
  {
    name: 'Admin login challenge (sense auth → 401)',
    url: '/api/admin/leads',
    expectStatus: 401,
    requireAuth: false,
    expectJson: false,
    expectBody: () => null,
  },
  {
    name: 'Admin leads (amb auth)',
    url: '/api/admin/leads?limit=1',
    expectStatus: 200,
    requireAuth: true,
    expectJson: true,
    expectBody: (body) => (body?.ok === true && Array.isArray(body?.leads) ? null : 'Resposta sense leads array'),
  },
  {
    name: 'Admin inbox count (amb auth)',
    url: '/api/admin/inbox/messages?action=count',
    expectStatus: 200,
    requireAuth: true,
    expectJson: true,
    expectBody: (body) => (typeof body?.unread === 'number' ? null : 'Resposta sense unread:number'),
  },
];

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const GRAY = '\x1b[90m';
const BOLD = '\x1b[1m';

function line(color, text) {
  process.stdout.write(`${color}${text}${RESET}\n`);
}

async function runCheck(check) {
  const fullUrl = check.url.startsWith('http') ? check.url : `${BASE_URL}${check.url}`;
  const headers = { 'User-Agent': 'orbita-smoke-test/1.0' };
  if (check.requireAuth) {
    if (!AUTH_HEADER) {
      return { ok: false, error: 'SMOKE_AUTH no configurat', status: 0, ms: 0 };
    }
    headers.Authorization = AUTH_HEADER;
  }

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(fullUrl, {
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(MAX_MS + 1000),
    });
  } catch (error) {
    const ms = Date.now() - startedAt;
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      status: 0,
      ms,
    };
  }
  const ms = Date.now() - startedAt;

  if (response.status !== check.expectStatus) {
    return {
      ok: false,
      error: `Status ${response.status}, esperat ${check.expectStatus}`,
      status: response.status,
      ms,
    };
  }

  if (ms > MAX_MS) {
    return {
      ok: false,
      error: `Lentitud: ${ms}ms (límit ${MAX_MS}ms)`,
      status: response.status,
      ms,
    };
  }

  if (check.expectJson) {
    try {
      const body = await response.json();
      const bodyError = check.expectBody?.(body);
      if (bodyError) {
        return { ok: false, error: bodyError, status: response.status, ms };
      }
    } catch (error) {
      return {
        ok: false,
        error: `JSON invàlid: ${error instanceof Error ? error.message : String(error)}`,
        status: response.status,
        ms,
      };
    }
  }

  return { ok: true, status: response.status, ms };
}

async function main() {
  line(BOLD, `\n🔍 Smoke test — ${BASE_URL}`);
  line(GRAY, `   Max temps per check: ${MAX_MS}ms`);
  line(GRAY, `   Auth: ${AUTH_HEADER ? 'configurat' : 'NO configurat (els checks amb auth s\'ometeran)'}\n`);

  let okCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const failures = [];

  for (const check of CHECKS) {
    if (check.requireAuth && !AUTH_HEADER) {
      line(YELLOW, `  ⊘  ${check.name} — saltat (sense auth)`);
      skippedCount += 1;
      continue;
    }

    const result = await runCheck(check);
    const msStr = `${result.ms}ms`;
    if (result.ok) {
      line(GREEN, `  ✓  ${check.name} — HTTP ${result.status}, ${msStr}`);
      okCount += 1;
    } else {
      line(RED, `  ✗  ${check.name} — ${result.error} (HTTP ${result.status}, ${msStr})`);
      failures.push({ name: check.name, error: result.error });
      failCount += 1;
    }
  }

  line(BOLD, `\n📊 Resum: ${GREEN}${okCount} OK${RESET}${BOLD}, ${failCount > 0 ? RED : GRAY}${failCount} fallits${RESET}${BOLD}, ${YELLOW}${skippedCount} saltats${RESET}\n`);

  if (failCount > 0) {
    line(RED, '🚨 Producció té problemes:');
    for (const f of failures) {
      line(RED, `   - ${f.name}: ${f.error}`);
    }
    process.exit(1);
  }

  line(GREEN, '✅ Producció verda.');
  process.exit(0);
}

main().catch((error) => {
  line(RED, `\n💥 Error inesperat al smoke test: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(2);
});
