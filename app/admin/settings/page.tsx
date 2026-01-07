// app/admin/settings/page.tsx
import { log } from '@/lib/logger';
// Pàgina de configuració - Settings i estadístiques
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configuració | Òrbita Admin',
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; description: string }> = {
  stats: {
    label: 'Estadístiques Públiques',
    icon: '📊',
    description: 'Números que apareixen a la web (events, persones, etc.)',
  },
  company: {
    label: 'Empresa',
    icon: '??',
    description: 'Dades legals i nom comercial',
  },
  contact: {
    label: 'Contacte',
    icon: '📞',
    description: 'Telèfon, email, horaris...',
  },
  pricing: {
    label: 'Preus',
    icon: '💰',
    description: 'Preus base, hora extra, descomptes...',
  },
  config: {
    label: 'Configuració General',
    icon: '⚙️',
    description: 'Altres configuracions del sistema',
  },
  social: {
    label: 'Social',
    icon: '??',
    description: 'Perfils socials',
  },
};

async function getSettings() {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const normalized = settings.map((s) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      type: s.type,
      category: s.category,
      label: s.label,
      description: s.description,
      updatedAt: s.updatedAt.toISOString(),
    }));

    // Agrupar per categoria
    const grouped = normalized.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {} as Record<string, typeof normalized>);

    return grouped;
  } catch (error) {
    log.error('Error obtenint settings:', error);
    return {};
  }
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">Configuració</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona les configuracions del sistema i estadístiques públiques
          </p>
        </div>
      </header>

      {/* Info Alert */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> Les estadístiques públiques (events, persones) s&apos;actualitzen
          automàticament quan una reserva passa a <span className="font-semibold">COMPLETED</span>.
          Pots editar-les manualment si cal ajustar els números inicials.
        </p>
      </div>
      {Object.keys(settings).length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl">⚙️</span>
          <p className="mt-4 text-slate-600">No hi ha configuracions</p>
          <p className="text-sm text-slate-400">Executa el seed per carregar dades inicials</p>
        </div>
      ) : (
        <SettingsClient groupedSettings={settings} categoryConfig={CATEGORY_CONFIG} />
      )}

      {/* Quick Links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/packs"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold text-black">Gestionar Packs</h3>
          <p className="text-sm text-slate-500">Edita preus, traduccions i contingut dels packs</p>
        </Link>

        <Link
          href="/admin/translations"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">🌐</div>
          <h3 className="font-semibold text-black">Traduccions</h3>
          <p className="text-sm text-slate-500">Gestiona el contingut multiidioma</p>
        </Link>

        <Link
          href="/admin/faqs"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">❓</div>
          <h3 className="font-semibold text-black">FAQs</h3>
          <p className="text-sm text-slate-500">Edita les preguntes freqüents</p>
        </Link>
      </section>
    </div>
  );
}
