// app/admin/settings/page.tsx
// Pàgina de configuració - Settings i estadístiques
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
};

async function getSettings() {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Agrupar per categoria
    const grouped = settings.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {} as Record<string, typeof settings>);

    return grouped;
  } catch (error) {
    console.error('Error obtenint settings:', error);
    return {};
  }
}

function getDisplayValue(setting: { value: string; type: string }): string {
  switch (setting.type) {
    case 'NUMBER':
      return parseFloat(setting.value).toLocaleString('ca-ES');
    case 'BOOLEAN':
      return setting.value === 'true' ? 'Sí' : 'No';
    case 'JSON':
      return '[JSON]';
    default:
      return setting.value;
  }
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Configuració</h1>
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

      {/* Settings by Category */}
      {Object.entries(settings).map(([category, categorySettings]) => {
        const config = CATEGORY_CONFIG[category] || {
          label: category,
          icon: '⚙️',
          description: '',
        };

        return (
          <section
            key={category}
            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <h2 className="font-semibold text-slate-900">{config.label}</h2>
                  <p className="text-sm text-slate-500">{config.description}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {categorySettings.map((setting) => (
                <div
                  key={setting.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                          {setting.key}
                        </code>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            setting.type === 'NUMBER'
                              ? 'bg-blue-100 text-blue-700'
                              : setting.type === 'BOOLEAN'
                              ? 'bg-purple-100 text-purple-700'
                              : setting.type === 'JSON'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {setting.type}
                        </span>
                      </div>
                      {setting.label && (
                        <p className="mt-1 font-medium text-slate-900">{setting.label}</p>
                      )}
                      {setting.description && (
                        <p className="text-sm text-slate-500">{setting.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        {getDisplayValue(setting)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Actualitzat: {new Date(setting.updatedAt).toLocaleDateString('ca-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {Object.keys(settings).length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl">⚙️</span>
          <p className="mt-4 text-slate-600">No hi ha configuracions</p>
          <p className="text-sm text-slate-400">Executa el seed per carregar dades inicials</p>
        </div>
      )}

      {/* Quick Links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/packs"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold text-slate-900">Gestionar Packs</h3>
          <p className="text-sm text-slate-500">Edita preus, traduccions i contingut dels packs</p>
        </Link>

        <Link
          href="/admin/translations"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">🌐</div>
          <h3 className="font-semibold text-slate-900">Traduccions</h3>
          <p className="text-sm text-slate-500">Gestiona el contingut multiidioma</p>
        </Link>

        <Link
          href="/admin/faqs"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">❓</div>
          <h3 className="font-semibold text-slate-900">FAQs</h3>
          <p className="text-sm text-slate-500">Edita les preguntes freqüents</p>
        </Link>
      </section>
    </div>
  );
}
