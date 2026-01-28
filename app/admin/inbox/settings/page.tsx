// app/admin/inbox/settings/page.tsx

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configurar Inbox | Òrbita Admin',
};

function isImapConfigured() {
  return Boolean(
    process.env.IMAP_HOST &&
    process.env.IMAP_PORT &&
    process.env.IMAP_USER &&
    process.env.IMAP_PASS
  );
}

export default async function InboxSettingsPage() {
  const configured = isImapConfigured();
  const imapHost = process.env.IMAP_HOST || '';
  const imapPort = process.env.IMAP_PORT || '';
  const imapUser = process.env.IMAP_USER || '';
  const imapSecure = process.env.IMAP_SECURE || (imapPort === '993' ? 'true' : 'false');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">Configurar Inbox</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inbox simplificada: solo emails de <strong>orbitaevents.com</strong>.
        </p>
      </header>

      <section className={`rounded-xl border p-6 shadow-sm ${
        configured ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
      }`}>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Estado de conexión</h2>
        <p className={`text-sm ${configured ? 'text-emerald-700' : 'text-amber-700'}`}>
          {configured ? 'IMAP configurado y operativo' : 'IMAP no configurado'}
        </p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Configuración actual</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 uppercase text-xs">IMAP_HOST</span>
            <span className="text-slate-700">{imapHost || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 uppercase text-xs">IMAP_PORT</span>
            <span className="text-slate-700">{imapPort || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 uppercase text-xs">IMAP_USER</span>
            <span className="text-slate-700">{imapUser || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 uppercase text-xs">IMAP_SECURE</span>
            <span className="text-slate-700">{imapSecure}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 uppercase text-xs">IMAP_PASS</span>
            <span className="text-slate-700">{process.env.IMAP_PASS ? '••••••••' : '—'}</span>
          </div>
        </div>
      </section>

      {!configured && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">Variables requeridas</h2>
          <div className="bg-white rounded-lg p-4 font-mono text-xs text-amber-900">
            <div>IMAP_HOST=imap.dondominio.com</div>
            <div>IMAP_PORT=993</div>
            <div>IMAP_USER=info@orbitaevents.com</div>
            <div>IMAP_PASS=tu_password</div>
            <div>IMAP_SECURE=true</div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Cómo funciona</h2>
        <ul className="text-sm text-slate-600 space-y-2">
          <li>• Solo se muestran emails enviados o recibidos por <strong>orbitaevents.com</strong>.</li>
          <li>• No se usa Gmail ni servicios de Google.</li>
          <li>• El panel se actualiza con IMAP de DonDominio.</li>
        </ul>
      </section>
    </div>
  );
}
