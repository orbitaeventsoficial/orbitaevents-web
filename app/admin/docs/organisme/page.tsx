import { promises as fs } from 'fs';
import path from 'path';
import { AdminPage, AdminEmptyState } from '../../components/AdminPage';
import { MarkdownView } from '../MarkdownView';

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
        <article className="ap-card mx-auto max-w-[64rem]">
          <div className="ap-card-body">
            <MarkdownView markdown={markdown} />
          </div>
        </article>
      ) : (
        <AdminEmptyState
          title="Atles no disponible"
          description="No s'ha trobat el fitxer docs/admin-organisme-atles.md."
        />
      )}
    </AdminPage>
  );
}
