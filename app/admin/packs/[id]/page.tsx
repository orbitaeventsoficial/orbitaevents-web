// app/admin/packs/[id]/page.tsx
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditPackForm from './EditPackForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Editar Pack | Òrbita Admin',
};

async function getPack(id: string) {
  try {
    const pack = await prisma.pack.findUnique({
      where: { id },
      include: {
        translations: true,
        inventory: {
          include: { item: { select: { code: true, name: true } } },
        },
      },
    });

    return pack;
  } catch (error) {
    log.error('Error obtenint pack:', error);
    return null;
  }
}

export default async function EditPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getPack(id);

  if (!pack) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/packs"
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-flex items-center gap-1"
          >
            ← Tornar a Packs
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Editar Pack
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Modifica els detalls del pack {pack.slug}
          </p>
        </div>
      </header>

      {/* Form */}
      <EditPackForm pack={pack} />
    </div>
  );
}
