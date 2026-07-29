import { promises as fs } from 'fs';
import path from 'path';
import { AdminPage, AdminEmptyState } from '../../components/AdminPage';
import { MarkdownView } from '../MarkdownView';

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
        <article className="ap-card mx-auto max-w-[64rem]">
          <div className="ap-card-body">
            <MarkdownView markdown={markdown} />
          </div>
        </article>
      ) : (
        <AdminEmptyState
          title="Esquema no disponible"
          description="No s'ha trobat el fitxer docs/admin-esquema-absolut.md."
        />
      )}
    </AdminPage>
  );
}
