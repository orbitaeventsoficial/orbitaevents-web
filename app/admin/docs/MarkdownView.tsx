import { Fragment, type ReactNode } from 'react';

/**
 * Renderitzador de Markdown mínim (zero-dependency) compartit pels documents
 * tècnics interns de l'admin (`/admin/docs/*`). Cobreix el subconjunt que usen
 * els atles/full de ruta del repo: headings (#–###), taules, llistes (- i 1.),
 * blockquote, code fence, hr, paràgrafs, i inline **negreta** + `codi`.
 * Contingut sempre propi (docs/), per això es renderitza com a React (no HTML cru).
 */

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
      nodes.push(<code key={`${keyBase}-c${i}`} className="dmd__code">{token.slice(1, -1)}</code>);
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
      blocks.push(<pre key={key++} className="dmd__pre"><code>{buf.join('\n')}</code></pre>);
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="dmd__hr" />);
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2], `h${key}`);
      const cls = `dmd__h dmd__h${level}`;
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
      blocks.push(
        <div key={key++} className="dmd__tablewrap">
          <table className="dmd__table">
            <thead>
              <tr>{header.map((cell, c) => <th key={c} scope="col">{renderInline(cell, `th${key}-${c}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => <td key={c}>{renderInline(cell, `td${key}-${r}-${c}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (line.trim().startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push(<blockquote key={key++} className="dmd__quote">{renderInline(buf.join(' '), `q${key}`)}</blockquote>);
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
      blocks.push(ordered ? <ol key={key++} className="dmd__list">{inner}</ol> : <ul key={key++} className="dmd__list">{inner}</ul>);
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
    blocks.push(<p key={key++} className="dmd__p">{renderInline(para.join(' '), `p${key}`)}</p>);
  }

  return <div className="dmd">{blocks.map((b, idx) => <Fragment key={idx}>{b}</Fragment>)}</div>;
}
