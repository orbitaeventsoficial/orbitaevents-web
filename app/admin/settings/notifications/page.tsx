'use client';
import { log } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { formatDateTimeFull } from '@/lib/constants';
import { AdminPage } from '../../components/AdminPage';
import { EditorControlStrip } from '../../components/EditorControlStrip';
import { fetchWithCsrf } from '@/lib/csrf';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';
import { RecipientsManager } from './RecipientsManager';

interface NotificationConfig {
  smtp: {
    host: string;
    user: string;
    pass: string;
    port: string;
    from: string;
    secure: string;
  };
  recipients: {
    contactTo: string;
    adminWhatsApp: string;
  };
  webhooks: {
    whatsappWebhook: string;
    leadWebhook: string;
  };
  whatsappApi: {
    url: string;
    token: string;
  };
  status: {
    emailReady: boolean;
    whatsappReady: boolean;
  };
  automation: {
    cronSecretConfigured: boolean;
    lastRun: string | null;
    lastStatus: string | null;
    lastMessage: string | null;
    lastSummary: {
      sequences?: { executed?: number; sentEmail?: number; sentWhatsapp?: number };
      sla?: { createdTasks?: number };
      kpi24h?: { responseRate?: number; commSent?: number; commResponded?: number };
    } | null;
  };
}

function StatusCard({ title, ready, warning = false, successText, pendingText }: { title: string; ready: boolean; warning?: boolean; successText: string; pendingText: string }) {
  const tone = ready
    ? 'ap-card ap-card--success'
    : warning
      ? 'ap-card ap-card--warning'
      : 'ap-card ap-card--danger';
  const textTone = ready ? 'admin-tone-text-success' : warning ? 'admin-tone-text-warning' : 'admin-tone-text-danger';
  const icon = ready ? '✅' : warning ? '⚠️' : '❌';

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${tone}`}>
      <div className="mb-2 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className={`text-sm ${textTone}`}>{ready ? successText : pendingText}</p>
    </div>
  );
}

function ResultBox({ success, message }: { success: boolean; message: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        success
          ? 'admin-tone-soft-success admin-tone-border-success admin-tone-text-success'
          : 'admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger'
      }`}
      role={success ? 'status' : 'alert'}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{success ? '✅' : '❌'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

function DeliveryPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`ap-badge ${active ? 'ap-badge--success' : 'ap-badge--danger'}`}>
      {active ? 'OK' : 'OFF'} · {label}
    </span>
  );
}

function NextAction({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm text-white/70">Acció següent: {children}</p>;
}

export default function SettingsNotificationsPage() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [runningAutopilot, setRunningAutopilot] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [autopilotResult, setAutopilotResult] = useState<{ success: boolean; message: string } | null>(null);
  const { newLeadsCount, inboxUnreadCount, packPriceAlertsCount, financeAlertsCount, totalCount } = useAdminAlerts();

  const shellReady = totalCount >= 0;
  const emailReady = Boolean(config?.status.emailReady);
  const whatsappReady = Boolean(config?.status.whatsappReady);
  const leadWebhookReady = config?.webhooks.leadWebhook.includes('✅') ?? false;
  const whatsappWebhookReady = config?.webhooks.whatsappWebhook.includes('✅') ?? false;
  const automationReady = Boolean(config?.automation.cronSecretConfigured);
  const weakestLink = !emailReady
    ? 'SMTP'
    : !leadWebhookReady && !whatsappReady
      ? 'Lead webhook / WhatsApp'
      : !automationReady
        ? 'Cron secret'
        : !whatsappWebhookReady && !whatsappReady
          ? 'Sortida mòbil'
          : null;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetchWithCsrf('/api/admin/test-notifications');
      const data = await res.json();
      setConfig(data.config);
      setInstructions(data.instructions);
    } catch (error) {
      log.error('Error carregant configuració:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetchWithCsrf('/api/admin/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      setTestResult({ success: data.success, message: data.success ? data.message : data.error });
    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : 'Error desconegut' });
    } finally {
      setTesting(false);
    }
  };

  const handleRunAutopilotNow = async () => {
    setRunningAutopilot(true);
    setAutopilotResult(null);
    try {
      const res = await fetchWithCsrf('/api/admin/automation/daily-summary/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s’ha pogut executar el resum diari');
      }
      setAutopilotResult({ success: true, message: 'Resum diari executat i enviat correctament' });
      await fetchConfig();
    } catch (error) {
      setAutopilotResult({ success: false, message: error instanceof Error ? error.message : 'Error desconegut' });
    } finally {
      setRunningAutopilot(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p>Carregant configuració...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPage
      title="Configuració de notificacions"
      subtitle="Gestiona com reps alertes quan entra una nova entrada"
      back={{ href: '/admin/settings', label: 'Configuració' }}
    >
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura de canals',
          title: 'Què tens operatiu ara mateix',
          stats: [
            { label: 'Email', value: emailReady ? 'OK' : 'Pendent', tone: emailReady ? 'success' : 'warning' },
            { label: 'WhatsApp', value: whatsappReady ? 'OK' : 'Pendent', tone: whatsappReady ? 'success' : 'warning' },
            { label: 'Autopilot', value: automationReady ? 'OK' : 'Pendent', tone: automationReady ? 'success' : 'warning' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans de tocar res',
          items: [
            weakestLink ? `${weakestLink} és ara mateix el punt més feble de la cadena de notificacions.` : 'La cadena principal de notificacions sembla coberta.',
            config?.automation.lastRun ? `Última execució del resum diari: ${formatDateTimeFull(config.automation.lastRun)}` : 'Encara no hi ha cap execució registrada del resum diari.',
            `Radar viu actual: ${totalCount} senyals oberts entre leads, inbox i risc operatiu.`,
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: weakestLink ? `Regularitzar ${weakestLink} abans d’ampliar canals` : 'Validar el recorregut complet i mantenir redundància',
          description: weakestLink
            ? 'Abans d’afegir més automatismes, assegura que la cadena principal d’alertes funciona de punta a punta.'
            : 'Si la base ja és estable, el següent pas és provar notificacions i resum diari per confirmar que tot continua sortint fora de l’admin.',
          primaryAction: {
            href: !emailReady ? '/admin/settings/notifications' : '/admin/settings',
            label: !emailReady ? 'Revisar notificacions' : 'Tornar a configuració',
          },
          secondaryPills: [
            leadWebhookReady || whatsappReady ? 'Lead extern cobert' : 'Lead extern pendent',
            shellReady ? 'Shell viu' : 'Shell pendent',
          ],
        }}
      />

      <section className="rounded-xl border p-6 shadow-sm admin-card-glass">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Radar viu de notificacions</h2>
            <p className="text-sm text-white/70">El mateix recompte canònic que veu el shell admin, sense haver de sortir d'aquesta pantalla.</p>
          </div>
          <span className="ap-badge ap-badge--info">Total viu: {totalCount}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="ap-card ap-card--info">
            <div className="ap-card-body">
              <div className="ap-kpi-label">Entrades noves</div>
              <div className="ap-kpi-value">{newLeadsCount}</div>
              <p className="mt-2 text-sm text-white/70">Leads nous pendents d'atenció comercial.</p>
            </div>
          </div>
          <div className="ap-card ap-card--success">
            <div className="ap-card-body">
              <div className="ap-kpi-label">Mail no llegit</div>
              <div className="ap-kpi-value">{inboxUnreadCount}</div>
              <p className="mt-2 text-sm text-white/70">Correus nous o pendents a la safata IMAP.</p>
            </div>
          </div>
          <div className="ap-card ap-card--danger">
            <div className="ap-card-body">
              <div className="ap-kpi-label">Risc operatiu</div>
              <div className="ap-kpi-value">{packPriceAlertsCount + financeAlertsCount}</div>
              <p className="mt-2 text-sm text-white/70">Alertes de preus i finances que demanen revisió.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatusCard
          title="Email"
          ready={Boolean(config?.status.emailReady)}
          successText="Configurat i funcionant"
          pendingText="No configurat: no rebràs correus d’entrades noves"
        />
        <StatusCard
          title="WhatsApp"
          ready={Boolean(config?.status.whatsappReady)}
          warning
          successText="Configurat com a suport"
          pendingText="No configurat (opcional)"
        />
      </div>

      <section className="rounded-xl border p-6 shadow-sm admin-card-glass">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Cobertura real dels avisos</h2>
          <p className="text-sm text-white/70">Per cada tipus d’alerta, veus quins canals tens realment operatius i on falla la cadena.</p>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Lead nou</h3>
                <p className="text-sm text-white/70">Entrada comercial nova que hauria de disparar avís immediat.</p>
              </div>
              <span className="ap-badge ap-badge--info">Ara mateix: {newLeadsCount}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <DeliveryPill active={shellReady} label="Shell admin" />
              <DeliveryPill active={emailReady} label="Email" />
              <DeliveryPill active={leadWebhookReady || whatsappReady} label="Webhook / WhatsApp" />
            </div>
            {!emailReady && <NextAction>configura `SMTP_HOST`, `SMTP_USER` i `SMTP_PASS` per recuperar l’avís per correu.</NextAction>}
            {emailReady && !(leadWebhookReady || whatsappReady) && <NextAction>activa `LEAD_WEBHOOK_URL` o una via WhatsApp perquè el lead també surti fora de l’admin.</NextAction>}
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Mail nou</h3>
                <p className="text-sm text-white/70">Correu entrant no llegit a la safata IMAP.</p>
              </div>
              <span className="ap-badge ap-badge--success">Ara mateix: {inboxUnreadCount}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <DeliveryPill active={shellReady} label="Shell admin" />
              <DeliveryPill active={emailReady} label="Email intern" />
              <DeliveryPill active={false} label="WhatsApp directe" />
            </div>
            {!emailReady && <NextAction>si vols redundància per correu intern, primer recupera la capa SMTP.</NextAction>}
            {emailReady && <NextAction>el correu entrant ja es veu a l’admin; si vols push extern, caldrà una integració específica de safata.</NextAction>}
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Resum diari i crítics</h3>
                <p className="text-sm text-white/70">Resum comercial del matí, anomalies i alertes crítiques fora del dashboard.</p>
              </div>
              <span className="ap-badge ap-badge--warning">Risc: {packPriceAlertsCount + financeAlertsCount}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <DeliveryPill active={shellReady} label="Shell admin" />
              <DeliveryPill active={automationReady && emailReady} label="Email resum" />
              <DeliveryPill active={automationReady && (whatsappReady || whatsappWebhookReady)} label="WhatsApp resum" />
            </div>
            {!automationReady && <NextAction>configura `CRON_SECRET` i el cron diari perquè els crítics surtin fora del dashboard cada matí.</NextAction>}
            {automationReady && !emailReady && <NextAction>l’autopilot corre, però sense SMTP no enviarà el resum per email.</NextAction>}
            {automationReady && emailReady && !(whatsappReady || whatsappWebhookReady) && <NextAction>si vols redundància al mòbil, activa `WHATSAPP_WEBHOOK_URL` o `WHATSAPP_API_URL` + `WHATSAPP_API_TOKEN`.</NextAction>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-6 shadow-sm admin-card-glass">
        <h2 className="mb-4 text-lg font-semibold">🧪 Test d'Email</h2>

        {testResult && <ResultBox success={testResult.success} message={testResult.message} />}

        <button
          onClick={handleTestEmail}
          disabled={testing || !config?.status.emailReady}
          type="button"
          aria-busy={testing}
          className="mt-4 ap-btn ap-btn--primary disabled:opacity-50"
        >
          {testing ? '📤 Enviant...' : '📧 Envia correu de prova'}
        </button>

        {!config?.status.emailReady && <p className="mt-2 text-sm">Configura primer les variables SMTP per poder testejar</p>}
      </section>

      <section className="rounded-xl border p-6 shadow-sm admin-card-glass">
        <h2 className="mb-4 text-lg font-semibold">🤖 Pilot automàtic comercial</h2>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span>CRON_SECRET</span>
            <span className={config?.automation.cronSecretConfigured ? 'admin-tone-text-success' : 'admin-tone-text-danger'}>
              {config?.automation.cronSecretConfigured ? '✅ Configurat' : '❌ FALTA'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span>Última execució</span>
            <span>{config?.automation.lastRun ? formatDateTimeFull(config.automation.lastRun) : 'Mai'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span>Estat</span>
            <span
              className={
                config?.automation.lastStatus === 'ok'
                  ? 'admin-tone-text-success'
                  : config?.automation.lastStatus === 'error'
                    ? 'admin-tone-text-danger'
                    : ''
              }
            >
              {config?.automation.lastStatus || 'Sense dades'}
            </span>
          </div>
          {config?.automation.lastSummary && (
            <div className="rounded-xl border p-3">
              <p>
                Seq: {config.automation.lastSummary.sequences?.executed ?? 0} · Email: {config.automation.lastSummary.sequences?.sentEmail ?? 0} · WA:{' '}
                {config.automation.lastSummary.sequences?.sentWhatsapp ?? 0}
              </p>
              <p>
                Tasques 24h: {config.automation.lastSummary.sla?.createdTasks ?? 0} · Resp 24h: {((config.automation.lastSummary.kpi24h?.responseRate ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
          )}
          {config?.automation.lastMessage && <p className="text-xs">Últim error: {config.automation.lastMessage}</p>}
        </div>

        {autopilotResult && <div className="mt-4"><ResultBox success={autopilotResult.success} message={autopilotResult.message} /></div>}

        <button
          onClick={handleRunAutopilotNow}
          disabled={runningAutopilot || !config?.automation.cronSecretConfigured}
          type="button"
          aria-busy={runningAutopilot}
          className="mt-4 ap-btn ap-btn--primary disabled:opacity-50"
        >
          {runningAutopilot ? '🚀 Executant...' : '🚀 Executar resum diari ara'}
        </button>
        {!config?.automation.cronSecretConfigured && (
          <p className="mt-2 text-sm">
            Configura <code className="rounded bg-white/5 px-1">CRON_SECRET</code> per activar l’autopilot.
          </p>
        )}
      </section>

      <RecipientsManager />

      <section className="rounded-xl border p-6 shadow-sm admin-card-glass">
        <h2 className="mb-4 text-lg font-semibold">⚙️ Configuració Actual</h2>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">SMTP (Email)</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(config?.smtp || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-xs uppercase">{key}</span>
                  <span className={value.includes('✅') ? 'admin-tone-text-success' : value.includes('❌') ? 'admin-tone-text-danger' : ''}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Destinataris</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(config?.recipients || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-white/10 py-1">
                  <span className="text-xs uppercase">{key}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {instructions.length > 0 && !config?.status.emailReady && (
        <section className="rounded-xl border p-6 shadow-sm admin-card-glass">
          <h2 className="mb-4 text-lg font-semibold">📝 Instruccions de Configuració</h2>

          {instructions.map((instruction, index) => (
            <pre key={index} className="mb-4 overflow-x-auto rounded-xl border p-4 text-sm whitespace-pre-wrap">
              {instruction}
            </pre>
          ))}
        </section>
      )}

      <section className="rounded-xl border p-6 shadow-sm admin-card-glass">
        <h2 className="mb-4 text-lg font-semibold">📚 Referència Ràpida</h2>

        <div className="prose prose-sm max-w-none">
          <h3 className="text-base font-medium">Variables d'entorn necessàries:</h3>
          <div className="rounded-xl border bg-white/5 p-4 font-mono text-xs">
            <div># Obligatòries per email</div>
            <div>SMTP_HOST=smtp.dondominio.com</div>
            <div>SMTP_PORT=587</div>
            <div>SMTP_USER=info@orbitaevents.com</div>
            <div>SMTP_PASS=la_teva_contrasenya</div>
            <div>SMTP_FROM=info@orbitaevents.com</div>
            <div>CONTACT_TO=info@orbitaevents.com</div>
            <div className="mt-4"># Opcionals per WhatsApp</div>
            <div>ADMIN_WHATSAPP=+34612345678</div>
            <div>WHATSAPP_WEBHOOK_URL=https://hook.make.com/xxx</div>
          </div>

          <h3 className="mt-6 text-base font-medium">On configurar:</h3>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Ves al <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="hover:underline">panell de Railway</a></li>
            <li>Selecciona el projecte <code className="rounded bg-white/5 px-1">orbitaevents-web</code></li>
            <li>Configuració → Variables d&apos;entorn</li>
            <li>Afegeix cada variable amb el seu valor</li>
            <li>Redesplega el projecte</li>
          </ol>
        </div>
      </section>
    </AdminPage>
  );
}
