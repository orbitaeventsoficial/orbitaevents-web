import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import { loadCampaigns, type Campaign } from '@/lib/services/campaignService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Campanyes | Òrbita Admin',
};

const URGENCY_TONE: Record<string, string> = {
  HIGH: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
  MEDIUM: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  LOW: 'border-[var(--line)] bg-[var(--panel)] text-[var(--t2)]',
};

const URGENCY_LABEL: Record<string, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Mitjana',
  LOW: 'Baixa',
};

const TYPE_ICON: Record<string, string> = {
  REACTIVATION: '🔄',
  UPSELL: '📈',
  SEASONAL: '🌸',
  REVIEW_REQUEST: '⭐',
  REFERRAL: '🤝',
  LOYALTY: '💜',
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬',
  email: '✉️',
};

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <article className="ap-card p-5 adm-row-hover transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{TYPE_ICON[campaign.type] || '📋'}</span>
          <h3 className="text-sm font-semibold">{campaign.name}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${URGENCY_TONE[campaign.urgency]}`}>
            {URGENCY_LABEL[campaign.urgency]}
          </span>
          <span className="text-xs opacity-60" title={campaign.channel}>
            {CHANNEL_ICON[campaign.channel]} {campaign.channel}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs opacity-70">{campaign.description}</p>

      <div className="mt-3 flex items-center gap-3 flex-wrap text-xs opacity-60">
        <span>Segment: <strong>{campaign.segment}</strong></span>
        <span>·</span>
        <span>Audiència: <strong>{campaign.audienceSize}</strong></span>
        <span>·</span>
        <span>Impacte: <strong>{campaign.estimatedImpact}</strong></span>
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-semibold opacity-70 hover:opacity-100 list-none">
          <span className="group-open:hidden">▶ Veure plantilla del missatge</span>
          <span className="hidden group-open:inline">▼ Amagar plantilla</span>
        </summary>
        <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--sunk)] p-3">
          <p className="text-xs font-semibold opacity-70">Assumpte</p>
          <p className="mt-0.5 text-xs">{campaign.subject}</p>
          <p className="mt-2 text-xs font-semibold opacity-70">Cos del missatge</p>
          <pre className="mt-0.5 text-xs whitespace-pre-wrap font-sans opacity-80">{campaign.bodyTemplate}</pre>
        </div>
      </details>
    </article>
  );
}

export default async function CampaignsPage() {
  const campaigns = await loadCampaigns();

  const highCount = campaigns.filter((c) => c.urgency === 'HIGH').length;
  const totalAudience = campaigns.reduce((sum, c) => sum + c.audienceSize, 0);

  return (
    <AdminPage
      title="Campanyes"
      subtitle="Comunicacions massives suggerides per segment CRM"
      actions={
        <Link
          href="/admin/clientes/reactivation"
          className="rounded-lg border border-[var(--line)] bg-[var(--raised)] px-3 py-1.5 text-xs hover:bg-[var(--raised)]"
        >
          Reactivació individual →
        </Link>
      }
    >
      <div className="space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="ap-card p-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Campanyes suggerides</p>
            <p className="mt-1 text-xl font-bold">{campaigns.length}</p>
          </div>
          <div className="rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Urgència alta</p>
            <p className="mt-1 text-xl font-bold admin-tone-text-danger">{highCount}</p>
          </div>
          <div className="ap-card p-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Audiència total</p>
            <p className="mt-1 text-xl font-bold">{totalAudience}</p>
          </div>
          <div className="ap-card p-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Canals</p>
            <p className="mt-1 text-xl font-bold">
              {campaigns.some((c) => c.channel === 'whatsapp') ? '💬' : ''}
              {campaigns.some((c) => c.channel === 'email') ? ' ✉️' : ''}
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="ap-card p-12 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-sm font-semibold opacity-80">Cap campanya suggerida ara mateix</p>
            <p className="mt-1 text-xs opacity-50">
              Les campanyes es generen automàticament quan hi ha segments amb prou clients (dormants, en risc, VIP, recurrents, etc.).
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        <div className="ap-card p-4">
          <h3 className="text-xs font-semibold opacity-70">Com funcionen les campanyes</h3>
          <p className="mt-1 text-xs opacity-50">
            Les campanyes es generen automàticament basant-se en els segments CRM actuals.
            Cada campanya suggereix un segment, canal, missatge i impacte estimat.
            Per executar-les, copia la plantilla i envia-la manualment via WhatsApp o email.
            Per accions individualitzades, usa la pàgina de reactivació.
          </p>
        </div>
      </div>
    </AdminPage>
  );
}
