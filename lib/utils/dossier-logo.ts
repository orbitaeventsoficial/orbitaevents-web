import 'server-only';

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * El logo del dossier, incrustat com a data URI.
 *
 * Autoritat única. Abans en vivien dues còpies idèntiques —la pàgina de
 * dossiers i la ruta del PDF compost— i cadascuna podia quedar-se enrere per
 * separat. El document ha de sortir sempre amb el mateix logo, vingui d'on
 * vingui la petició.
 */
export function readLogoDataUri(): string {
  try {
    const svgPath = join(process.cwd(), 'public', 'img', 'logoplanetatextdreta.svg');
    const svg = readFileSync(svgPath, 'utf-8');
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    return '';
  }
}
