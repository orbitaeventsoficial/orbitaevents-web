import { promises as fs } from 'fs';
import path from 'path';
import { AdminPage } from '../../components/AdminPage';
import { MarkdownView } from '../MarkdownView';
import '../docs-view.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Esquema absolut | Òrbita Admin' };

async function readDoc(): Promise<string | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'docs', 'admin-esquema-absolut.md'), 'utf-8');
  } catch {
    return null;
  }
}

export default async function EsquemaPage() {
  const markdown = await readDoc();

  return (
    <AdminPage
      title="Esquema absolut"
      subtitle="Radiografia de cables i funcions: cada òrgan amb alçada, prioritat, temps i les seves connexions reals."
    >
      {markdown ? (
        <article className="dmd__doc">
          <MarkdownView markdown={markdown} />
        </article>
      ) : (
        <div className="dmd__empty">
          <p>No s&apos;ha trobat <code>docs/admin-esquema-absolut.md</code>.</p>
        </div>
      )}
    </AdminPage>
  );
}
