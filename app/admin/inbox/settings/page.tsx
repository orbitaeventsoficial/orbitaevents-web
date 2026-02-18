// app/admin/inbox/settings/page.tsx

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Configurar safata d'entrada | Òrbita Admin",
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Configurar safata d'entrada</h1>
        <p className="mt-1 text-sm text-slate-300">
          Safata simplificada: només correus de <strong>orbitaevents.com</strong>.
        </p>
      </header>

      <section className={`rounded-xl border p-6 shadow-sm ${
        configured ? 'border-emerald-400/30 bg-emerald-950/30' : 'border-amber-400/30 bg-amber-950/30'
      }`}>
        <h2 className="mb-2 text-lg font-semibold text-slate-100">Estat de connexió</h2>
        <p className={`text-sm ${configured ? 'text-emerald-300' : 'text-amber-300'}`}>
          {configured ? 'IMAP configurat i operatiu' : 'IMAP no configurat'}
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Configuració actual</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-xs uppercase text-slate-400">IMAP_HOST</span>
            <span className="text-slate-200">{imapHost || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-xs uppercase text-slate-400">IMAP_PORT</span>
            <span className="text-slate-200">{imapPort || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-xs uppercase text-slate-400">IMAP_USER</span>
            <span className="text-slate-200">{imapUser || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-xs uppercase text-slate-400">IMAP_SECURE</span>
            <span className="text-slate-200">{imapSecure}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs uppercase text-slate-400">IMAP_PASS</span>
            <span className="text-slate-200">{process.env.IMAP_PASS ? '••••••••' : '—'}</span>
          </div>
        </div>
      </section>

      {!configured && (
        <section className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-amber-200">Variables requerides</h2>
          <div className="rounded-lg bg-slate-950/70 p-4 font-mono text-xs text-amber-200">
            <div>IMAP_HOST=imap.dondominio.com</div>
            <div>IMAP_PORT=993</div>
            <div>IMAP_USER=info@orbitaevents.com</div>
            <div>IMAP_PASS=tu_password</div>
            <div>IMAP_SECURE=true</div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-100">Com funciona</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• Només es mostren correus enviats o rebuts per <strong>orbitaevents.com</strong>.</li>
          <li>• No es fa servir Gmail ni serveis de Google.</li>
          <li>• El panell s&apos;actualitza via IMAP de DonDominio.</li>
        </ul>
      </section>
    </div>
  );
}
