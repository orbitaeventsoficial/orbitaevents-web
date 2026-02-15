// app/admin/settings/page.tsx
import { log } from '@/lib/logger';
// Pàgina de configuració - Settings i estadístiques
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SettingsClient from './SettingsClient';
import DbReconnectButton from './DbReconnectButton';

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
    icon: '🏢',
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
    label: 'Xarxes Socials',
    icon: '📱',
    description: 'Perfils socials i enllaços',
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Configuració</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona les configuracions del sistema i estadístiques públiques
          </p>
        </div>
        <DbReconnectButton />
      </header>

      {/* Info Alert */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-4">
        <p className="text-sm text-amber-200">
          <strong>Nota:</strong> Les estadístiques públiques (events, persones) s&apos;actualitzen
          automàticament quan una reserva passa a <span className="font-semibold text-amber-300">COMPLETED</span>.
          Pots editar-les manualment si cal ajustar els números inicials.
        </p>
      </div>
      {Object.keys(settings).length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-12 text-center">
          <span className="text-4xl">⚙️</span>
          <p className="mt-4 text-slate-300">No hi ha configuracions</p>
          <p className="text-sm text-slate-500">Executa el seed per carregar dades inicials</p>
        </div>
      ) : (
        <SettingsClient groupedSettings={settings} categoryConfig={CATEGORY_CONFIG} />
      )}

      {/* Quick Links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/presupuestos"
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm p-6 hover:border-emerald-400/40 hover:bg-emerald-500/15 transition-all"
        >
          <div className="text-2xl mb-2">🧾</div>
          <h3 className="font-semibold text-slate-100">Editor PDF presupuesto</h3>
          <p className="text-sm text-slate-300">Personaliza cliente, pack, extras y descarga el PDF al instante</p>
        </Link>

        <Link
          href="/admin/settings/quotes"
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 hover:border-slate-600/50 hover:bg-slate-700/40 transition-all"
        >
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-semibold text-slate-100">Plantilla presupuestos</h3>
          <p className="text-sm text-slate-400">Texto, condiciones y copia interna de presupuestos</p>
        </Link>

        <Link
          href="/admin/catalog?tab=packs"
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 hover:border-slate-600/50 hover:bg-slate-700/40 transition-all"
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold text-slate-100">Catàleg</h3>
          <p className="text-sm text-slate-400">Packs, extres, inventari i regles de preu</p>
        </Link>

        <Link
          href="/admin/text-manager"
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 hover:border-slate-600/50 hover:bg-slate-700/40 transition-all"
        >
          <div className="text-2xl mb-2">🌐</div>
          <h3 className="font-semibold text-slate-100">Traduccions</h3>
          <p className="text-sm text-slate-400">Gestiona el contingut multiidioma</p>
        </Link>

        <Link
          href="/admin/faq"
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 hover:border-slate-600/50 hover:bg-slate-700/40 transition-all"
        >
          <div className="text-2xl mb-2">❓</div>
          <h3 className="font-semibold text-slate-100">FAQs</h3>
          <p className="text-sm text-slate-400">Edita les preguntes freqüents</p>
        </Link>
      </section>
    </div>
  );
}
