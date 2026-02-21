import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mapa Admin | Òrbita Admin',
};

type MapItem = {
  href: string;
  label: string;
  note?: string;
};

type MapSection = {
  title: string;
  icon: string;
  items: MapItem[];
};

const SECTIONS: MapSection[] = [
  {
    title: 'Comercial',
    icon: '💼',
    items: [
      { href: '/admin/leads', label: 'Entrades' },
      { href: '/admin/intake', label: 'Entrada ràpida' },
      { href: '/admin/clientes', label: 'Clients' },
      { href: '/admin/contactes', label: 'Contactes' },
      { href: '/admin/sales-ops', label: 'Operativa de vendes' },
      { href: '/admin/mensajes', label: 'Missatges' },
    ],
  },
  {
    title: 'Reserves i Operativa',
    icon: '📋',
    items: [
      { href: '/admin/bookings', label: 'Reserves' },
      { href: '/admin/bookings/new', label: 'Nova reserva' },
      { href: '/admin/calendario', label: 'Calendari' },
      { href: '/admin/tasks', label: 'Tasques' },
      { href: '/admin/tasks/new', label: 'Nova tasca' },
      { href: '/admin/inbox', label: 'Safata (IMAP)' },
      { href: '/admin/inbox/compose', label: 'Redactar correu' },
      { href: '/admin/emails', label: 'Correus automàtics' },
      { href: '/admin/post-event', label: 'Post-esdeveniment' },
      { href: '/admin/post-event/reports', label: 'Informes post-event' },
      { href: '/admin/post-event/surveys', label: 'Enquestes post-event' },
      { href: '/admin/post-event/feedback', label: 'Feedback post-event' },
    ],
  },
  {
    title: 'Catàleg i Producte',
    icon: '🧩',
    items: [
      { href: '/admin/packs', label: 'Packs' },
      { href: '/admin/packs/new', label: 'Nou pack' },
      { href: '/admin/packs/extras', label: 'Extres de packs' },
      { href: '/admin/catalog', label: 'Catàleg' },
      { href: '/admin/inventory', label: 'Inventari' },
      { href: '/admin/inventory/new', label: 'Nou element inventari' },
      { href: '/admin/pricing', label: 'Preus' },
      { href: '/admin/presupuestos', label: 'Editor PDF pressupost' },
      { href: '/admin/canvas', label: 'Canvas' },
    ],
  },
  {
    title: 'Control i Configuració',
    icon: '⚙️',
    items: [
      { href: '/admin', label: 'Tauler principal' },
      { href: '/admin/analytics', label: 'Analítica' },
      { href: '/admin/analytics#google-ads', label: 'Google Ads' },
      { href: '/admin/economia', label: 'Economia' },
      { href: '/admin/finanzas', label: 'Finances' },
      { href: '/admin/rentabilidad', label: 'Rendibilitat' },
      { href: '/admin/stats', label: 'Estadístiques' },
      { href: '/admin/discount-codes', label: 'Codis descompte' },
      { href: '/admin/coverage', label: 'Cobertura' },
      { href: '/admin/features', label: 'Funcionalitats' },
      { href: '/admin/theme', label: 'Tema' },
      { href: '/admin/translations', label: 'Traduccions' },
      { href: '/admin/text-manager', label: 'Textos PRO' },
      { href: '/admin/google-reviews', label: 'Google Reviews' },
      { href: '/admin/ressenyes', label: 'Ressenyes' },
      { href: '/admin/blog', label: 'Blog' },
      { href: '/admin/faq', label: 'FAQ' },
      { href: '/admin/settings', label: 'Configuració' },
      { href: '/admin/settings/quotes', label: 'Plantilles pressupost' },
      { href: '/admin/settings/integrations', label: 'Integracions' },
      { href: '/admin/settings/notifications', label: 'Notificacions' },
      { href: '/admin/inbox/settings', label: 'Configuració IMAP' },
    ],
  },
];

export default function AdminMapaPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/12 to-cyan-500/10 p-5">
        <h1 className="text-2xl font-bold text-slate-100">🧭 Mapa Admin</h1>
        <p className="mt-2 text-sm text-slate-300">
          Accés directe a totes les pantalles útils del panell. Cap secció queda orfe.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-100">
              {section.icon} {section.title}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-700/70 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-amber-400/40 hover:bg-slate-700/70"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
