import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const roadmapPath = path.join(repoRoot, 'lib', 'constants', 'adminManual.ts');
const protocolPath = fs.existsSync(path.join(repoRoot, 'docs', 'admin-protocol.md'))
  ? path.join(repoRoot, 'docs', 'admin-protocol.md')
  : path.join(repoRoot, 'docs', 'protocol-producte-admin-ca.md');

function readFileOrFail(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[roadmap-canvis] ERROR: ${label} not found at ${filePath}`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function extractDoneCanvis(roadmapSource) {
  const matches = [];
  const blockPattern = /id:\s*'([^']+)'[\s\S]*?(?=\n\s*\{|\n\s*\];)/g;
  let blockMatch;
  while ((blockMatch = blockPattern.exec(roadmapSource)) !== null) {
    const block = blockMatch[0];
    const id = blockMatch[1];
    const doneCanviMatch = block.match(/doneCanvi:\s*(\d+)/);
    if (doneCanviMatch) {
      matches.push({ id, canvi: Number(doneCanviMatch[1]) });
    }
  }
  return matches;
}

function extractProtocolCanvis(protocolSource) {
  const set = new Set();
  const headerPattern = /^### Canvi #(\d+)\s+—\s+\d{4}-\d{2}-\d{2}\s+—\s+[^\s(]+\s*\(([^)]+)\)/gm;
  let headerMatch;
  while ((headerMatch = headerPattern.exec(protocolSource)) !== null) {
    const n = Number(headerMatch[1]);
    const status = headerMatch[2].trim().toUpperCase();
    if (status === 'FET') {
      set.add(n);
    }
  }
  return set;
}

const roadmapSource = readFileOrFail(roadmapPath, 'lib/constants/adminManual.ts');
const protocolSource = readFileOrFail(protocolPath, 'docs/admin-protocol.md');

const doneEntries = extractDoneCanvis(roadmapSource);
const fetCanvis = extractProtocolCanvis(protocolSource);

const orphans = doneEntries.filter((entry) => !fetCanvis.has(entry.canvi));

if (orphans.length > 0) {
  console.error('[roadmap-canvis] FAIL: doneCanvi references with no matching ### Canvi #N (FET) at §9 of the protocol:');
  for (const orphan of orphans) {
    console.error(`  - ${orphan.id}: doneCanvi=${orphan.canvi} not registered as FET`);
  }
  console.error('Update either ADMIN_MANUAL_ROADMAP or §9 so they stay in sync.');
  process.exit(1);
}

console.log(`[roadmap-canvis] OK: ${doneEntries.length} doneCanvi references all match registered FET canvis (${fetCanvis.size} canvis FET total at §9).`);
