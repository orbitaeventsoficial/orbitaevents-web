import Link from 'next/link';
import { cookies } from 'next/headers';
import { canManageContent, normalizeAdminRole } from '@/lib/admin-role';

export default function TextManagerLayout({ children }: { children: React.ReactNode }) {
  const role = normalizeAdminRole(cookies().get('admin_role')?.value);
  const allowed = canManageContent(role);

  if (!allowed) {
    return (
      <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
        <h1 className="text-xl font-semibold text-amber-200">Accés restringit</h1>
        <p className="mt-1 text-sm text-amber-100/90">
          El rol actual ({role}) no pot editar Textos PRO.
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-flex rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-300/20"
        >
          Tornar al tauler
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
