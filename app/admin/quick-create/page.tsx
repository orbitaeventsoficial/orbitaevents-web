import { prisma } from '@/lib/prisma';
import QuickCreateForm from './QuickCreateForm';

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
    <div className="ap-page">
      <div className="space-y-6 max-w-3xl">
        <header>
          <h1 className="text-2xl font-semibold">Creació ràpida</h1>
          <p className="text-sm text-white/60 mt-1">
            Una pantalla, una decisió. Pots crear només el lead, lead + pressupost, o tot
            d&apos;un cop (lead + pressupost + reserva).
          </p>
        </header>

        <QuickCreateForm
          packs={packs.map((p) => ({ id: p.id, slug: p.slug, code: p.code ?? p.slug, price: p.price }))}
        />
      </div>
    </div>
  );
}
