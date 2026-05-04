import fs from 'node:fs';
import path from 'node:path';

const PROTOCOL_PATH = path.join(process.cwd(), 'docs', 'protocol-producte-admin-ca.md');
const DIARIO_PATH = path.join(process.cwd(), 'docs', 'diario.md');
const ADMIN_CONSTANTS_PATH = path.join(process.cwd(), 'lib', 'constants', 'admin.ts');

function fail(message) {
  console.error(`Admin change-log check failed: ${message}`);
  process.exitCode = 1;
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing file: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

const protocol = readFile(PROTOCOL_PATH);
const diario = readFile(DIARIO_PATH);
const adminConstants = readFile(ADMIN_CONSTANTS_PATH);


const forbiddenProtocolArtifacts = [
  { label: 'literal PowerShell newline artifact `r`n', pattern: /`r`n/ },
  { label: 'literal escaped CRLF \\r\\n', pattern: /\\r\\n/ },
];

for (const artifact of forbiddenProtocolArtifacts) {
  if (artifact.pattern.test(protocol)) {
    fail(`protocol contains ${artifact.label}`);
  }
}
const changeNumbers = [];
const changeEntries = [];
const changeRegex = /^### Canvi #(\d+)\b.*$/gm;
let match;
while ((match = changeRegex.exec(protocol)) !== null) {
  const number = Number.parseInt(match[1], 10);
  const start = match.index;
  const nextMatch = /^### Canvi #\d+\b.*$/gm;
  nextMatch.lastIndex = changeRegex.lastIndex;
  const next = nextMatch.exec(protocol);
  const end = next ? next.index : protocol.length;

  changeNumbers.push(number);
  changeEntries.push({ number, body: protocol.slice(start, end) });
}

if (changeNumbers.length === 0) {
  fail('no numbered changes found in protocol');
}

const counts = new Map();
for (const number of changeNumbers) {
  counts.set(number, (counts.get(number) || 0) + 1);
}

const duplicates = Array.from(counts.entries())
  .filter(([, count]) => count > 1)
  .map(([number]) => number)
  .sort((a, b) => a - b);

if (duplicates.length > 0) {
  fail(`duplicate change numbers: ${duplicates.map((number) => `#${number}`).join(', ')}`);
}


const OWNERSHIP_REQUIRED_FROM_CHANGE = 57;
const ownershipMissing = changeEntries
  .filter(({ number }) => number >= OWNERSHIP_REQUIRED_FROM_CHANGE)
  .filter(({ body }) => !body.includes('- Començat per:') || !body.includes('- Treballant per:') || !body.includes('- Tancat per:'))
  .map(({ number }) => number)
  .sort((a, b) => a - b);

if (ownershipMissing.length > 0) {
  fail(
    `missing ownership fields from changes: ${ownershipMissing.map((number) => `#${number}`).join(', ')}. `
    + 'Required fields: - Començat per:, - Treballant per:, - Tancat per:'
  );
}
const counterMatch = adminConstants.match(/export const ADMIN_CHANGE_COUNTER = (\d+);/);
if (!counterMatch) {
  fail('ADMIN_CHANGE_COUNTER not found in lib/constants/admin.ts');
} else {
  const counter = Number.parseInt(counterMatch[1], 10);
  const maxChange = Math.max(...changeNumbers);
  if (counter !== maxChange) {
    fail(`ADMIN_CHANGE_COUNTER=${counter} but protocol max is #${maxChange}`);
  }

  const diarioCurrentChangeRegex = new RegExp(`^## [^\\n]*Canvi #${counter}\\b`, 'm');
  if (!diarioCurrentChangeRegex.test(diario)) {
    fail(`docs/diario.md missing entry for current change #${counter}`);
  }
}

if (process.exitCode) {
  process.exit();
}

console.log(`Admin change-log check clean. Changes: ${changeNumbers.length}. Current: #${Math.max(...changeNumbers)}.`);




