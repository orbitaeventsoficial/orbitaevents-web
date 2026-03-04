// app/admin/settings/page.tsx
import { log } from '@/lib/logger';
// Pàgina de configuració - Settings i estadístiques
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SettingsClient from './SettingsClient';
import DbReconnectButton from './DbReconnectButton';
import { AdminPage } from '../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configuració | Òrbita Admin',
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; description: string }> = {
  stats: {
    label: 'Estadístiques Públiques',
    icon: '📊',
    description: 'Números que apareixen a la web (esdeveniments, persones, etc.)',
  },
  company: {
    label: 'Empresa',
    icon: '🏢',
    description: 'Dades legals i nom comercial (edita a Configuració empresa)',
  },
  holded: {
    label: 'Holded',
    icon: '🧾',
    description: 'Integració amb Holded per facturació',
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
    <AdminPage
      title="Configuració"
      subtitle="Gestiona les configuracions del sistema i estadístiques públiques"
      actions={<DbReconnectButton />}
    >

      {/* Info Alert */}
      <div className="rounded-2xl border admin-card-glass p-4">
        <p className="text-sm">
          <strong>Nota:</strong> Les estadístiques públiques (esdeveniments, persones) s&apos;actualitzen
          automàticament quan una reserva passa a <span className="font-semibold">COMPLETED</span>.
          Pots editar-les manualment si cal ajustar els números inicials.
        </p>
      </div>
      {Object.keys(settings).length === 0 ? (
        <div className="rounded-2xl border admin-card-glass p-12 text-center">
          <span className="text-4xl">⚙️</span>
          <p className="mt-4">No hi ha configuracions</p>
          <p className="text-sm">Executa el seed per carregar dades inicials</p>
        </div>
      ) : (
        <SettingsClient groupedSettings={settings} categoryConfig={CATEGORY_CONFIG} />
      )}

      {/* Quick Links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/presupuestos"
          className="rounded-2xl border admin-card-glass p-6 transition-all"
        >
          <div className="text-2xl mb-2">🧾</div>
          <h3 className="font-semibold">Editor PDF de pressupost</h3>
          <p className="text-sm">Personalitza client, pack, extres i descarrega el PDF a l’instant</p>
        </Link>

        <Link
          href="/admin/settings/quotes"
          className="rounded-2xl border admin-card-glass p-6 transition-all"
        >
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-semibold">Plantilla de pressupostos</h3>
          <p className="text-sm">Text, condicions i còpia interna dels pressupostos</p>
        </Link>

        <Link
          href="/admin/catalog?tab=packs"
          className="rounded-2xl border admin-card-glass p-6 transition-all"
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold">Catàleg</h3>
          <p className="text-sm">Packs, extres, inventari i regles de preu</p>
        </Link>

        <Link
          href="/admin/text-manager"
          className="rounded-2xl border admin-card-glass p-6 transition-all"
        >
          <div className="text-2xl mb-2">🌐</div>
          <h3 className="font-semibold">Traduccions</h3>
          <p className="text-sm">Gestiona el contingut multiidioma</p>
        </Link>

        <Link
          href="/admin/settings/company"
          className="rounded-2xl border admin-card-glass p-6 transition-all"
        >
          <div className="text-2xl mb-2">🏢</div>
          <h3 className="font-semibold">Empresa i Holded</h3>
          <p className="text-sm">Dades fiscals, IBAN, NIF i integració Holded</p>
        </Link>

        <Link
          href="/admin/faq"
          className="rounded-2xl border admin-card-glass p-6 transition-all"
        >
          <div className="text-2xl mb-2">❓</div>
          <h3 className="font-semibold">FAQs</h3>
          <p className="text-sm">Edita les preguntes freqüents</p>
        </Link>
      </section>
    </AdminPage>
  );
}
