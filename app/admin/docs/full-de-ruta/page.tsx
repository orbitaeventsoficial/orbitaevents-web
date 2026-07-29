import { promises as fs } from 'fs';
import path from 'path';
import { AdminPage, AdminEmptyState } from '../../components/AdminPage';
import { MarkdownView } from '../MarkdownView';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Meta + Full de ruta | Òrbita Admin' };

async function readDoc(): Promise<string | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'docs', 'producte-zenit-full-de-ruta.md'), 'utf-8');
  } catch {
    return null;
  }
}

export default async function FullDeRutaPage() {
  const markdown = await readDoc();

  return (
    <AdminPage
      title="Meta + Full de ruta"
      subtitle="La idealització del producte (zenit) i el camí per fases per arribar-hi, segons els ingredients reals."
    >
      {markdown ? (
        <article className="ap-card mx-auto max-w-[64rem]">
          <div className="ap-card-body">
            <MarkdownView markdown={markdown} />
          </div>
        </article>
      ) : (
        <AdminEmptyState
          title="Document no disponible"
          description="No s'ha trobat el fitxer docs/producte-zenit-full-de-ruta.md."
        />
      )}
    </AdminPage>
  );
}
