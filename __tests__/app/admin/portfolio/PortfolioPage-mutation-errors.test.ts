import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/portfolio/page.tsx'), 'utf8');
const mediaServiceSource = readFileSync(join(process.cwd(), 'lib/services/portfolioMediaService.ts'), 'utf8');

describe('Portfolio admin mutation errors', () => {
  it('verifica res.ok i propaga error/message abans de refrescar o actualitzar estat local', () => {
    expect(source).toContain('async function readPortfolioMutationError');
    expect(source).toContain('const record = data as { error?: unknown; message?: unknown };');
    expect(source).toContain("throw new Error(await readPortfolioMutationError(response, \"No s'ha pogut guardar el caption\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(response, \"No s'ha pogut assignar l'event\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(response, \"No s'ha pogut actualitzar la portada\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(response, \"No s'ha pogut eliminar la media\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(response, \"No s'ha pogut actualitzar l'event\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(response, \"No s'ha pogut eliminar l'event\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(response, \"No s'ha pogut guardar el nou ordre\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(uploadResponse, 'Error pujant fitxer'));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(updateResponse, \"No s'ha pogut conservar les dades de la media substituida\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(coverResponse, \"No s'ha pogut actualitzar la portada vinculada\"));");
    expect(source).toContain("throw new Error(await readPortfolioMutationError(deleteResponse, \"No s'ha pogut eliminar la media substituida\"));");
    expect(source).not.toMatch(/^\s*await fetchWithCsrf\((['`])\/api\/admin\/portfolio/m);
  });

  it('exposa un drop-in per categoria i no mostra comptadors buits abans de carregar media', () => {
    expect(source).toContain("const [loaded, setLoaded] = useState(false);");
    expect(source).toContain('const visibleCountItems = loaded ? media : buildStaticMediaItems(slug);');
    expect(source).toContain("Drop-in d'imatges · {name}");
    expect(source).toContain('onDrop={handleDropZoneUpload}');
    expect(mediaServiceSource).toContain('buildPortfolioUploadImagePath(slug, fileName)');
    expect(mediaServiceSource).toContain('normalizePortfolioImageBuffer(fileBuffer)');
  });

  it('crea events amb selector de portada existent, no amb URL manual', () => {
    expect(source).toContain('const [coverOptions, setCoverOptions] = useState<MediaItem[]>([]);');
    expect(source).toContain("fetchWithCsrf(`/api/admin/portfolio/media?slug=${categorySlug}`");
    expect(source).toContain("coverOptions.filter((item) => item.mediaType === 'image')");
    expect(source).toContain("categorySlug: event.target.value, coverImage: ''");
    expect(source).toContain('Tria una imatge existent');
    expect(source).toContain('Portada del portfolio, no URL manual de producte.');
    expect(source).toContain("Els vídeos poden anar a galeria, però la portada pública ha de ser una imatge.");
    expect(source).not.toContain('placeholder="URL de portada"');
  });
});
