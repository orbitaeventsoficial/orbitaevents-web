export type ProtocolCanviStatus = 'FET' | 'EN MARXA' | 'PENDENT' | 'UNKNOWN';

export interface ProtocolCanviMeta {
  n: number;
  date: string;
  author: string;
  status: ProtocolCanviStatus;
  headline: string;
  body: string;
  anchorId: string;
}

const HEADER_PATTERN = /^### Canvi #(\d+)\s+—\s+(\d{4}-\d{2}-\d{2})\s+—\s+([^\s(]+)\s*\(([^)]+)\)/;

function normalizeStatus(raw: string): ProtocolCanviStatus {
  const upper = raw.trim().toUpperCase();
  if (upper === 'FET' || upper.startsWith('FET;') || upper.startsWith('FET ')) return 'FET';
  if (upper === 'EN MARXA' || upper.startsWith('EN MARXA;') || upper.startsWith('EN MARXA ')) return 'EN MARXA';
  if (upper === 'PENDENT' || upper.startsWith('PENDENT;') || upper.startsWith('PENDENT ')) return 'PENDENT';
  return 'UNKNOWN';
}

export function parseProtocolCanvis(rawMarkdown: string): ProtocolCanviMeta[] {
  if (!rawMarkdown) return [];
  const lines = rawMarkdown.split(/\r?\n/);
  const matches: Array<{ index: number; meta: Omit<ProtocolCanviMeta, 'body'> }> = [];

  lines.forEach((line, index) => {
    const match = line.match(HEADER_PATTERN);
    if (!match) return;
    const [, nRaw, date, author, statusRaw] = match;
    const n = Number(nRaw);
    if (!Number.isInteger(n) || n <= 0) return;
    const headlineLine = lines[index + 1] ?? '';
    const headline = headlineLine.replace(/^\*\*|\*\*$/g, '').trim();
    matches.push({
      index,
      meta: {
        n,
        date,
        author,
        status: normalizeStatus(statusRaw),
        headline,
        anchorId: `canvi-${n}`,
      },
    });
  });

  const result: ProtocolCanviMeta[] = matches.map((entry, position) => {
    const start = entry.index;
    const next = matches[position + 1];
    const end = next ? next.index : lines.length;
    const body = lines.slice(start, end).join('\n');
    return { ...entry.meta, body };
  });

  return result;
}

export function indexProtocolCanvisByNumber(canvis: ProtocolCanviMeta[]): Map<number, ProtocolCanviMeta> {
  const index = new Map<number, ProtocolCanviMeta>();
  for (const canvi of canvis) {
    index.set(canvi.n, canvi);
  }
  return index;
}

export interface ProtocolSectionMeta {
  id: string;
  title: string;
  body: string;
  anchorId: string;
}

const SECTION_PATTERN = /^##\s+(\d+(?:\.\d+)*)(?:\s+|\.\s*)(.+)$/;

export function parseProtocolSections(rawMarkdown: string): ProtocolSectionMeta[] {
  if (!rawMarkdown) return [];
  const lines = rawMarkdown.split(/\r?\n/);
  const matches: Array<{ index: number; meta: Omit<ProtocolSectionMeta, 'body'> }> = [];

  lines.forEach((line, index) => {
    const match = line.match(SECTION_PATTERN);
    if (!match) return;
    const [, id, titleRaw] = match;
    const title = titleRaw.trim();
    matches.push({
      index,
      meta: {
        id,
        title,
        anchorId: `seccio-${id.replace(/\./g, '-')}`,
      },
    });
  });

  return matches.map((entry, position) => {
    const start = entry.index;
    const next = matches[position + 1];
    const end = next ? next.index : lines.length;
    const body = lines.slice(start, end).join('\n');
    return { ...entry.meta, body };
  });
}
