import { Fragment, type ReactNode } from 'react';

/**
 * Renderitzador de Markdown mínim (zero-dependency) compartit pels documents
 * tècnics interns de l'admin (`/admin/docs/*`). Cobreix el subconjunt que usen
 * els atles/full de ruta del repo: headings (#–###), taules, llistes (- i 1.),
 * blockquote, code fence, hr, paràgrafs, i inline **negreta** + `codi`.
 * Contingut sempre propi (docs/), per això es renderitza com a React (no HTML cru).
 */

// Tipografia i superfícies 100% de token (canon admin). Sense classes pròpies.
const CODE_CLS =
  'font-[family-name:var(--mono)] text-[0.85em] bg-[var(--ax-raised)] border border-[var(--ax-line)] rounded-[var(--o-r-sm)] px-1.5 py-0.5 text-[var(--ax-gold-bright,var(--ax-gold))]';
const PRE_CLS =
  'bg-[var(--ax-raised)] border border-[var(--ax-line)] rounded-[var(--o-r-md)] p-4 overflow-x-auto mb-4 font-[family-name:var(--mono)] text-[length:var(--o-text-xs)] leading-relaxed text-[var(--ax-t2)] [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 [&_code]:text-inherit';
const HR_CLS = 'border-0 border-t border-[var(--ax-line)] my-7';
const QUOTE_CLS =
  'border-l-2 border-[var(--ax-gold)] bg-[var(--ax-raised)] px-4 py-3 mb-4 text-[var(--ax-t3)] italic';
const TABLEWRAP_CLS = 'mb-5 overflow-hidden border border-[var(--ax-line)] rounded-[var(--o-r-md)]';
const TABLE_CLS =
  'hidden sm:table w-full border-collapse text-[length:var(--o-text-xs)] min-w-[32rem] [&_tr:last-child_td]:border-b-0';
const TH_CLS =
  'text-left px-3 py-2 border-b border-[var(--ax-line)] align-top text-[var(--ax-gold)] font-semibold whitespace-nowrap bg-[var(--ax-raised)]';
const TD_CLS = 'text-left px-3 py-2 border-b border-[var(--ax-line)] align-top text-[var(--ax-t2)]';
const MOBILE_TABLE_CLS = 'sm:hidden divide-y divide-[var(--ax-line)]';
const MOBILE_TABLE_ROW_CLS = 'grid gap-3 p-3';
const MOBILE_TABLE_CELL_CLS = 'grid min-w-0 gap-1';
const MOBILE_TABLE_LABEL_CLS = 'font-mono text-[0.68rem] uppercase tracking-normal text-[var(--ax-gold)]';
const MOBILE_TABLE_VALUE_CLS =
  'min-w-0 text-[var(--ax-t2)] break-words [&_code]:whitespace-normal [&_code]:break-words';
const P_CLS = 'mb-3.5';
const LIST_CLS = 'mb-4 pl-5 [&_li]:mb-1.5';
const HEAD_CLS: Record<number, string> = {
  1: 'text-[length:var(--o-text-2xl)] font-bold leading-tight text-[var(--ax-t)] mb-4',
  2: 'mt-8 mb-3 pt-5 border-t border-[var(--ax-line)] text-[length:var(--o-text-xl)] font-bold leading-tight text-[var(--ax-t)]',
  3: 'mt-6 mb-2 text-[length:var(--o-text-lg)] font-bold leading-snug text-[var(--ax-gold)]',
  4: 'mt-4 mb-2 text-[length:var(--o-text-base)] font-bold leading-snug text-[var(--ax-t)]',
};

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(<code key={`${keyBase}-c${i}`} className={CODE_CLS}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<strong key={`${keyBase}-b${i}`}>{token.slice(2, -2)}</strong>);
    }
    last = match.index + token.length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function splitRow(line: string): string[] {
  return line.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

function renderTable(header: string[], rows: string[][], tableKey: number) {
  return (
    <div key={tableKey} className={TABLEWRAP_CLS}>
      <table className={TABLE_CLS}>
        <thead>
          <tr>{header.map((cell, c) => <th key={c} scope="col" className={TH_CLS}>{renderInline(cell, `th${tableKey}-${c}`)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>{row.map((cell, c) => <td key={c} className={TD_CLS}>{renderInline(cell, `td${tableKey}-${r}-${c}`)}</td>)}</tr>
          ))}
        </tbody>
      </table>

      <div className={MOBILE_TABLE_CLS}>
        {rows.map((row, r) => (
          <div key={r} className={MOBILE_TABLE_ROW_CLS}>
            {row.map((cell, c) => (
              <div key={c} className={MOBILE_TABLE_CELL_CLS}>
                <span className={MOBILE_TABLE_LABEL_CLS}>{renderInline(header[c] ?? `Columna ${c + 1}`, `tmh${tableKey}-${r}-${c}`)}</span>
                <span className={MOBILE_TABLE_VALUE_CLS}>{renderInline(cell, `tmc${tableKey}-${r}-${c}`)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(<pre key={key++} className={PRE_CLS}><code>{buf.join('\n')}</code></pre>);
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      blocks.push(<hr key={key++} className={HR_CLS} />);
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2], `h${key}`);
      const cls = HEAD_CLS[level];
      blocks.push(
        level === 1 ? <h1 key={key++} className={cls}>{content}</h1>
        : level === 2 ? <h2 key={key++} className={cls}>{content}</h2>
        : level === 3 ? <h3 key={key++} className={cls}>{content}</h3>
        : <h4 key={key++} className={cls}>{content}</h4>,
      );
      i += 1;
      continue;
    }

    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?[\s:-]*-[\s:|-]*$/.test(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push(renderTable(header, rows, key++));
      continue;
    }

    if (line.trim().startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push(<blockquote key={key++} className={QUOTE_CLS}>{renderInline(buf.join(' '), `q${key}`)}</blockquote>);
      continue;
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
        i += 1;
      }
      const inner = items.map((it, idx) => <li key={idx}>{renderInline(it, `li${key}-${idx}`)}</li>);
      blocks.push(ordered ? <ol key={key++} className={`list-decimal ${LIST_CLS}`}>{inner}</ol> : <ul key={key++} className={`list-disc ${LIST_CLS}`}>{inner}</ul>);
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i]) &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('|')
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(<p key={key++} className={P_CLS}>{renderInline(para.join(' '), `p${key}`)}</p>);
  }

  return (
    <div className="text-[length:var(--o-text-sm)] leading-[1.7] text-[var(--ax-t2)]">
      {blocks.map((b, idx) => <Fragment key={idx}>{b}</Fragment>)}
    </div>
  );
}
