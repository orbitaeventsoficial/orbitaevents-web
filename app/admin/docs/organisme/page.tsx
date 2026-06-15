import { promises as fs } from 'fs';
import path from 'path';
import { AdminPage } from '../../components/AdminPage';
import { MarkdownView } from '../MarkdownView';
import '../docs-view.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Atles de l\'organisme | Òrbita Admin' };

async function readAtles(): Promise<string | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'docs', 'admin-organisme-atles.md'), 'utf-8');
  } catch {
    return null;
  }
}

export default async function OrganismeAtlesPage() {
  const markdown = await readAtles();

  return (
    <AdminPage
      title="Atles de l'organisme"
      subtitle="Mapa viu del sistema sencer (front + back): òrgans, connexions i estudi de dinamització."
    >
      {markdown ? (
        <article className="dmd__doc">
          <MarkdownView markdown={markdown} />
        </article>
      ) : (
        <div className="dmd__empty">
          <p>No s&apos;ha trobat <code>docs/admin-organisme-atles.md</code>.</p>
        </div>
      )}
    </AdminPage>
  );
}
