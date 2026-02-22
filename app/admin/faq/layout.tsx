import Link from 'next/link';
import { cookies } from 'next/headers';
import { canManageContent, normalizeAdminRole } from '@/lib/admin-role';

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  const role = normalizeAdminRole(cookies().get('admin_role')?.value);
  const allowed = canManageContent(role);

  if (!allowed) {
    return (
      <section className="rounded-2xl border p-6">
        <h1 className="text-xl font-semibold">Accés restringit</h1>
        <p className="mt-1 text-sm">
          El rol actual ({role}) no pot editar Contingut.
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold"
        >
          Tornar al tauler
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
