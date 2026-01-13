// app/admin/inbox/settings/page.tsx
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configurar Correu | Òrbita Admin',
};

export default function InboxSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          Configurar correu (IMAP)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          L&apos;inbox del panel mostra els emails reals quan les variables IMAP estan configurades.
        </p>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-sm font-semibold uppercase">Variables requerides</h2>
        <code className="mt-3 block rounded-md bg-amber-100 p-3 text-xs text-amber-900">
          IMAP_HOST
          <br />
          IMAP_PORT
          <br />
          IMAP_USER
          <br />
          IMAP_PASS
        </code>
        <p className="mt-3 text-sm">
          Configura-les a Vercel (Project Settings → Environment Variables) i fes un redeploy.
        </p>
      </div>
    </div>
  );
}
