import { promises as fs } from 'fs';
import path from 'path';
import { AdminPage } from '../../components/AdminPage';
import { MarkdownView } from '../MarkdownView';
import '../docs-view.css';

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
        <article className="dmd__doc">
          <MarkdownView markdown={markdown} />
        </article>
      ) : (
        <div className="dmd__empty">
          <p>No s&apos;ha trobat <code>docs/producte-zenit-full-de-ruta.md</code>.</p>
        </div>
      )}
    </AdminPage>
  );
}
