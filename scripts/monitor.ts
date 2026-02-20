#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// SCRIPT DE MONITORATGE - ÒRBITA EVENTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Execució: npx ts-node scripts/monitor.ts
// O: node scripts/monitor.js (després de compilar)
//
// Funcionalitats:
// - Verifica l'estat del servidor (health check)
// - Mesura temps de resposta de múltiples endpoints
// - Mostra l'estat de les pàgines principals
// - Alerta si hi ha problemes
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = process.env.SITE_URL || 'https://orbitaevents.com';

interface EndpointCheck {
  url: string;
  name: string;
  expectedStatus: number;
}

interface CheckResult {
  name: string;
  url: string;
  status: 'ok' | 'warn' | 'fail';
  statusCode: number;
  responseTime: number;
  message: string;
}

const ENDPOINTS: EndpointCheck[] = [
  { url: '/', name: 'Homepage', expectedStatus: 200 },
  { url: '/es', name: 'Homepage ES', expectedStatus: 200 },
  { url: '/contacto', name: 'Contacte', expectedStatus: 200 },
  { url: '/servicios/bodas', name: 'Serveis Bodes', expectedStatus: 200 },
  { url: '/portfolio', name: 'Portfolio', expectedStatus: 200 },
  { url: '/api/health', name: 'Health API', expectedStatus: 200 },
  { url: '/api/public/stats', name: 'Stats API', expectedStatus: 200 },
];

async function checkEndpoint(endpoint: EndpointCheck): Promise<CheckResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint.url}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'OrbitaMonitor/1.0',
      },
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    let status: 'ok' | 'warn' | 'fail' = 'ok';
    let message = 'OK';

    if (statusCode !== endpoint.expectedStatus) {
      status = 'fail';
      message = `Expected ${endpoint.expectedStatus}, got ${statusCode}`;
    } else if (responseTime > 3000) {
      status = 'warn';
      message = `Slow response (${responseTime}ms)`;
    } else if (responseTime > 1500) {
      status = 'warn';
      message = `Moderate response time`;
    }

    return {
      name: endpoint.name,
      url: endpoint.url,
      status,
      statusCode,
      responseTime,
      message,
    };
  } catch (error) {
    return {
      name: endpoint.name,
      url: endpoint.url,
      status: 'fail',
      statusCode: 0,
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

function getStatusEmoji(status: 'ok' | 'warn' | 'fail'): string {
  switch (status) {
    case 'ok': return '✅';
    case 'warn': return '⚠️';
    case 'fail': return '❌';
  }
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function runMonitor() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🛰️  ÒRBITA EVENTS - MONITOR DE SERVEI');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📍 URL Base: ${BASE_URL}`);
  console.log(`  🕐 Data: ${new Date().toLocaleString('ca-ES')}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const results: CheckResult[] = [];

  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`  Verificant ${endpoint.name}... `);
    const result = await checkEndpoint(endpoint);
    results.push(result);
    console.log(`${getStatusEmoji(result.status)} ${formatTime(result.responseTime)}`);
  }

  // Summary
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  📊 RESUM');
  console.log('───────────────────────────────────────────────────────────\n');

  const okCount = results.filter(r => r.status === 'ok').length;
  const warnCount = results.filter(r => r.status === 'warn').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length);

  console.log(`  ✅ OK: ${okCount}/${results.length}`);
  if (warnCount > 0) console.log(`  ⚠️  Warnings: ${warnCount}`);
  if (failCount > 0) console.log(`  ❌ Errors: ${failCount}`);
  console.log(`  ⏱️  Temps mitjà: ${formatTime(avgResponseTime)}`);

  // Show problems
  const problems = results.filter(r => r.status !== 'ok');
  if (problems.length > 0) {
    console.log('\n  ⚠️  PROBLEMES DETECTATS:');
    problems.forEach(p => {
      console.log(`     ${getStatusEmoji(p.status)} ${p.name}: ${p.message}`);
    });
  }

  // Overall status
  console.log('\n───────────────────────────────────────────────────────────');
  if (failCount > 0) {
    console.log('  🔴 ESTAT: PROBLEMES CRÍTICS');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('  🟡 ESTAT: FUNCIONAL AMB AVISOS');
    process.exit(0);
  } else {
    console.log('  🟢 ESTAT: TOT CORRECTE');
    process.exit(0);
  }
}

// Check for health endpoint details
async function checkHealthEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      const health = await response.json();
      console.log('\n  📋 DETALLS HEALTH CHECK:');
      console.log(`     Estat: ${health.status}`);
      console.log(`     Versió: ${health.version}`);
      console.log(`     Uptime: ${health.uptime}s`);
      console.log(`     DB: ${health.checks?.database?.status || 'N/A'}`);
      console.log(`     Sentry: ${health.checks?.sentry?.status || 'N/A'}`);
    }
  } catch {
    // Silently ignore if health endpoint doesn't exist yet
  }
}

// Run
runMonitor().then(() => checkHealthEndpoint());
