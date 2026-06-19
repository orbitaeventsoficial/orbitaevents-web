// app/admin/settings/page.tsx
import { log } from '@/lib/logger';
// Pàgina de configuració - Settings i estadístiques
import { SETTINGS_CATEGORY_CONFIG } from '@/lib/constants';
import { SETTINGS_SENSITIVE_KEY_FRAGMENTS, formatDateTimeFull } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SettingsClient from './SettingsClient';
import DbReconnectButton from './DbReconnectButton';
import { EditorControlStrip } from '../components/EditorControlStrip';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configuració | Òrbita Admin',
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
  const allSettings = Object.values(settings).flat();
  const totalCategories = Object.keys(settings).length;
  const sensitiveCount = allSettings.filter((setting) =>
    SETTINGS_SENSITIVE_KEY_FRAGMENTS.some((fragment) => setting.key.toLowerCase().includes(fragment.toLowerCase()))
  ).length;
  const latestUpdate = allSettings.reduce<string | null>((latest, setting) => {
    if (!latest) return setting.updatedAt;
    return new Date(setting.updatedAt).getTime() > new Date(latest).getTime() ? setting.updatedAt : latest;
  }, null);

  return (
    <AdminPage
      title="Configuració"
      subtitle="Gestiona les configuracions del sistema i estadístiques públiques"
      actions={<DbReconnectButton />}
    >
      <EditorControlStrip
        overview={{
          eyebrow: 'Configuració viva',
          title: 'Què controla aquest espai',
          description: 'Aquí no vens a inspeccionar claus una per una, sinó a governar el sistema: dades públiques, copy, integracions i paràmetres sensibles.',
          stats: [
            { label: 'Categories', value: totalCategories },
            { label: 'Settings', value: allSettings.length },
            { label: 'Sensibles', value: sensitiveCount, tone: 'warning' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què vigilar abans d’editar',
          items: [
            'Les estadístiques públiques s’actualitzen automàticament quan una reserva passa a COMPLETED.',
            'Les claus sensibles queden ofuscades a la vista, però segueixen sent editables: toca-les només quan hi ha canvi real.',
            latestUpdate ? `Últim canvi registrat: ${formatDateTimeFull(latestUpdate)}` : 'Sense actualitzacions registrades encara.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: 'Entra per la configuració que canvia comportament',
          description: 'Si has de tocar negoci real, el millor primer pas sol ser empresa, pressupostos, catàleg o textos. No perdis temps navegant categories a cegues.',
          primaryAction: { href: '/admin/settings/company', label: 'Obrir empresa i Holded' },
          secondaryAction: { href: '/admin/settings/quotes', label: 'Obrir plantilla' },
          secondaryPills: ['Catàleg de packs i preus', 'Textos i contingut públic'],
        }}
      />

      {Object.keys(settings).length === 0 ? (
        <AdminEmptyState
          icon="⚙️"
          title="No hi ha configuracions"
          description="Executa el seed per carregar dades inicials"
        />
      ) : (
        <SettingsClient groupedSettings={settings} categoryConfig={SETTINGS_CATEGORY_CONFIG} />
      )}

      <section className="rounded-2xl border admin-card-glass p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Accessos directes</p>
            <h2 className="mt-1 text-lg font-semibold text-white/90">Canvis que acostumen a tenir més impacte</h2>
            <p className="mt-1 text-sm text-white/65">Entrades ràpides a les peces de configuració que més afecten venda, marca i operativa.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/presupuestos"
          className="ap-card p-6 transition-all adm-row-hover"
        >
          <div className="text-2xl mb-2">🧾</div>
          <h3 className="font-semibold">Editor PDF de pressupost</h3>
          <p className="text-sm text-white/70">Personalitza client, pack, extres i descarrega el PDF a l’instant</p>
        </Link>

        <Link
          href="/admin/settings/quotes"
          className="ap-card p-6 transition-all adm-row-hover"
        >
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-semibold">Plantilla de pressupostos</h3>
          <p className="text-sm text-white/70">Text, condicions i còpia interna dels pressupostos</p>
        </Link>

        <Link
          href="/admin/catalog?tab=packs"
          className="ap-card p-6 transition-all adm-row-hover"
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold">Catàleg</h3>
          <p className="text-sm text-white/70">Packs, extres, inventari i regles de preu</p>
        </Link>

        <Link
          href="/admin/text-manager"
          className="ap-card p-6 transition-all adm-row-hover"
        >
          <div className="text-2xl mb-2">🌐</div>
          <h3 className="font-semibold">Traduccions</h3>
          <p className="text-sm text-white/70">Gestiona el contingut multiidioma</p>
        </Link>

        <Link
          href="/admin/settings/company"
          className="ap-card p-6 transition-all adm-row-hover"
        >
          <div className="text-2xl mb-2">🏢</div>
          <h3 className="font-semibold">Empresa i Holded</h3>
          <p className="text-sm text-white/70">Dades fiscals, IBAN, NIF i integració Holded</p>
        </Link>

        <Link
          href="/admin/faq"
          className="ap-card p-6 transition-all adm-row-hover"
        >
          <div className="text-2xl mb-2">❓</div>
          <h3 className="font-semibold">FAQs</h3>
          <p className="text-sm text-white/70">Edita les preguntes freqüents</p>
        </Link>
        </div>
      </section>
    </AdminPage>
  );
}






