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

const protocol = readFile(PROTOCOL_PATH).normalize('NFC');
const diario = readFile(DIARIO_PATH).normalize('NFC');
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
// String.fromCharCode(0xE7) = U+00E7 = NFC 'ç'. Avoids NFD/NFC source encoding drift.
const c_cedilla = String.fromCharCode(0xE7);
const OWN_COMMENCED = `- Comen${c_cedilla}at per:`;
const OWN_WORKING   = '- Treballant per:';
const OWN_CLOSED    = '- Tancat per:';
const ownershipMissing = changeEntries
  .filter(({ number }) => number >= OWNERSHIP_REQUIRED_FROM_CHANGE)
  .filter(({ body }) => !body.includes(OWN_COMMENCED) || !body.includes(OWN_WORKING) || !body.includes(OWN_CLOSED))
  .map(({ number }) => number)
  .sort((a, b) => a - b);

if (ownershipMissing.length > 0) {
  fail(
    `missing ownership fields from changes: ${ownershipMissing.map((number) => `#${number}`).join(', ')}. `
    + `Required fields: ${OWN_COMMENCED}, ${OWN_WORKING}, ${OWN_CLOSED}`
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

  const currentProtocolEntry = changeEntries.find(({ number }) => number === counter);
  if (
    currentProtocolEntry
    && (
      !currentProtocolEntry.body.includes('- Validació tècnica:')
      || !currentProtocolEntry.body.includes('- Validació funcional:')
      || !currentProtocolEntry.body.includes('- Validació humana/UX:')
    )
  ) {
    fail(
      `protocol current entry #${counter} missing validation layers. `
      + 'Required fields: - Validació tècnica:, - Validació funcional:, - Validació humana/UX:'
    );
  }

  const diarioCurrentChangeRegex = new RegExp(`^## [^\\n]*Canvi #${counter}\\b`, 'm');
  const diarioCurrentMatch = diarioCurrentChangeRegex.exec(diario);
  if (!diarioCurrentMatch) {
    fail(`docs/diario.md missing entry for current change #${counter}`);
  } else {
    const nextDiarioEntryRegex = /^## [^\n]*Canvi #\d+\b/mg;
    nextDiarioEntryRegex.lastIndex = diarioCurrentMatch.index + diarioCurrentMatch[0].length;
    const nextDiarioEntry = nextDiarioEntryRegex.exec(diario);
    const currentDiarioBody = diario.slice(
      diarioCurrentMatch.index,
      nextDiarioEntry ? nextDiarioEntry.index : diario.length,
    );
    if (
      !currentDiarioBody.includes(OWN_COMMENCED)
      || !currentDiarioBody.includes(OWN_WORKING)
      || !currentDiarioBody.includes(OWN_CLOSED)
    ) {
      fail(
        `docs/diario.md current entry #${counter} missing ownership fields. `
        + `Required fields: ${OWN_COMMENCED}, ${OWN_WORKING}, ${OWN_CLOSED}`
      );
    }

    if (
      !currentDiarioBody.includes('- Validació tècnica:')
      || !currentDiarioBody.includes('- Validació funcional:')
      || !currentDiarioBody.includes('- Validació humana/UX:')
    ) {
      fail(
        `docs/diario.md current entry #${counter} missing validation layers. `
        + 'Required fields: - Validació tècnica:, - Validació funcional:, - Validació humana/UX:'
      );
    }
  }

}

if (process.exitCode) {
  process.exit();
}

console.log(`Admin change-log check clean. Changes: ${changeNumbers.length}. Current: #${Math.max(...changeNumbers)}.`);


