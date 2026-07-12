#!/usr/bin/env node
// Neteja acotada de LeadDocument QUOTE legacy sense fitxer real. Dry-run per defecte.
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;

const args = new Set(process.argv.slice(2));
const LEGACY_QUOTE_PREFIX = 'quote-email:';
const MAX_PREVIEW_ROWS = 100;

function printHelp() {
  console.log([
    'Us:',
    '  pnpm run zenit:clean:legacy-quotes',
    '  pnpm run zenit:clean:legacy-quotes -- --apply',
    '',
    'Per defecte es DRY-RUN: llista LeadDocument QUOTE amb fileUrl quote-email:* i filePath null.',
    'Amb --apply elimina nomes aquest subconjunt acotat.',
  ].join('\n'));
}

function serialize(value) {
  return JSON.stringify(value, (_key, inner) => {
    if (inner instanceof Date) return inner.toISOString();
    return inner;
  }, 2);
}

if (args.has('--help') || args.has('-h')) {
  printHelp();
  process.exit(0);
}

const apply = args.has('--apply');

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const legacyQuoteWhere = {
  type: 'QUOTE',
  fileUrl: { startsWith: LEGACY_QUOTE_PREFIX },
  filePath: null,
};

async function main() {
  const rows = await prisma.leadDocument.findMany({
    where: legacyQuoteWhere,
    orderBy: { createdAt: 'desc' },
    take: MAX_PREVIEW_ROWS,
    select: {
      id: true,
      leadId: true,
      title: true,
      fileUrl: true,
      filePath: true,
      createdAt: true,
    },
  });

  const beforeCount = await prisma.leadDocument.count({ where: legacyQuoteWhere });

  if (!apply) {
    console.log(serialize({
      mode: 'DRY-RUN',
      legacyQuotePrefix: LEGACY_QUOTE_PREFIX,
      matchedCount: beforeCount,
      preview: rows,
      applied: false,
      message: "DRY-RUN: no s'ha eliminat res. Reexecuta amb -- --apply nomes si aquesta llista es correcta.",
    }));
    return;
  }

  const deleted = await prisma.leadDocument.deleteMany({ where: legacyQuoteWhere });
  const afterCount = await prisma.leadDocument.count({ where: legacyQuoteWhere });

  console.log(serialize({
    mode: 'APPLY',
    legacyQuotePrefix: LEGACY_QUOTE_PREFIX,
    beforeCount,
    deletedCount: deleted.count,
    afterCount,
    previewDeleted: rows,
    applied: true,
  }));
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
