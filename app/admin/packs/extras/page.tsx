import Link from 'next/link';
import ExtrasConfiguratorClient from './ExtrasConfiguratorClient';

export const metadata = {
  title: 'Extres Configurador | Òrbita Admin',
};

export default function PacksExtrasPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Packs</h1>
          <p className="mt-1 text-sm">
            Gestiona extres del configurador per família
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link
            href="/admin/packs"
            className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium"
          >
            Packs
          </Link>
          <Link
            href="/admin/packs/extras"
            className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold"
          >
            Extres
          </Link>
        </nav>
      </header>

      <ExtrasConfiguratorClient />
    </div>
  );
}
