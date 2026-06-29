import { prisma } from '@/lib/prisma';
import QuickCreateForm from './QuickCreateForm';
import { AdminPage } from '@/app/admin/components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Creació ràpida | Òrbita Events',
};

export default async function QuickCreatePage() {
  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, code: true, price: true },
    orderBy: { price: 'asc' },
  });

  return (
    <AdminPage
      title="Creació ràpida"
      subtitle="Una pantalla, una decisió. Pots crear només el lead, lead + pressupost, o tot d'un cop (lead + pressupost + reserva)."
    >
      <div className="space-y-6 max-w-3xl">
        <QuickCreateForm
          packs={packs.map((p) => ({ id: p.id, slug: p.slug, code: p.code ?? p.slug, price: p.price }))}
        />
      </div>
    </AdminPage>
  );
}
