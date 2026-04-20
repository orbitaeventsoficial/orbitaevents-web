import Link from 'next/link';
import { AdminPage, AdminSection } from '../components/AdminPage';
import { ADMIN_GOOGLE_ADS_DECISION_RULES, ADMIN_MANUAL_AUDIT_CATEGORIES, ADMIN_MANUAL_AUTOMATION_FRONTIER, ADMIN_MANUAL_PRINCIPLES, ADMIN_MANUAL_REALITY_CHECKS, ADMIN_MANUAL_ROADMAP, ADMIN_MANUAL_SECTIONS, ADMIN_MANUAL_SNAPSHOT, ADMIN_MANUAL_VISUAL_GOVERNANCE, ADMIN_MARKETING_CHANNEL_PRIORITY_LABEL, ADMIN_MARKETING_CHANNELS, ADMIN_MARKETING_METRICS, ADMIN_MARKETING_PHASES, ADMIN_MARKETING_PHASE_LABEL, ADMIN_MARKETING_PHASE_SUMMARY, ADMIN_MARKETING_PLAYBOOK, type AdminManualRoadmapPriority, type AdminMarketingChannelPriority, type AdminMarketingPhase } from '@/lib/constants/adminManual';

const MARKETING_PHASE_ORDER: AdminMarketingPhase[] = ['FASE_0', 'FASE_1', 'FASE_2', 'FASE_3'];

const MARKETING_PHASE_STYLE: Record<AdminMarketingPhase, string> = {
  FASE_0: 'border-rose-500/30 bg-rose-500/[0.05]',
  FASE_1: 'border-emerald-500/30 bg-emerald-500/[0.05]',
  FASE_2: 'border-amber-500/30 bg-amber-500/[0.05]',
  FASE_3: 'border-cyan-500/30 bg-cyan-500/[0.05]',
};


const MARKETING_CHANNEL_STYLE: Record<AdminMarketingChannelPriority, string> = {
  OBLIGATORI: 'border-emerald-500/35 bg-emerald-500/[0.07] text-emerald-200',
  FORT: 'border-cyan-500/35 bg-cyan-500/[0.06] text-cyan-200',
  CONDICIONAL: 'border-amber-500/35 bg-amber-500/[0.06] text-amber-200',
  MES_ENDAVANT: 'border-white/10 bg-white/[0.03] text-white/65',
};
const priorityStyle: Record<AdminManualRoadmapPriority, string> = {
  CRITICAL: 'border-rose-500/40 bg-rose-500/[0.08] text-rose-200',
  HIGH: 'border-amber-500/40 bg-amber-500/[0.06] text-amber-200',
  MEDIUM: 'border-cyan-500/30 bg-cyan-500/[0.05] text-cyan-200',
  LOW: 'border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-200',
};

const priorityLabel: Record<AdminManualRoadmapPriority, string> = {
  CRITICAL: 'Crític',
  HIGH: 'Alt',
  MEDIUM: 'Mitjà',
  LOW: 'Baix',
};

const automationPriorityStyle = {
  CRITICAL: 'border-rose-500/40 bg-rose-500/[0.08] text-rose-200',
  HIGH: 'border-amber-500/40 bg-amber-500/[0.06] text-amber-200',
  MEDIUM: 'border-cyan-500/30 bg-cyan-500/[0.05] text-cyan-200',
};

const visualGovernanceStyle = {
  ALIGNED: {
    badge: 'border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-200',
    panel: 'border-emerald-500/20 bg-emerald-500/[0.04]',
  },
  SECOND_WAVE: {
    badge: 'border-amber-500/35 bg-amber-500/[0.08] text-amber-200',
    panel: 'border-amber-500/20 bg-amber-500/[0.04]',
  },
};

const toneClass = {
  success: 'ap-kpi--success',
  warning: 'ap-kpi--warning',
  danger: 'ap-kpi--danger',
  info: 'ap-kpi--info',
  neutral: 'ap-kpi--neutral',
};

export default function AdminManualPage() {
  const totalCapabilities = ADMIN_MANUAL_SECTIONS.reduce((sum, section) => sum + section.capabilities.length, 0);
  const totalSnapshotItems = ADMIN_MANUAL_SNAPSHOT.reduce((sum, section) => sum + section.items.length, 0);
  const totalVisualAligned = ADMIN_MANUAL_VISUAL_GOVERNANCE
    .filter((section) => section.status === 'ALIGNED')
    .reduce((sum, section) => sum + section.items.length, 0);

  return (
    <AdminPage
      title="Manual de possibilitats"
      subtitle="Mapa pràctic per saber què existeix avui, què fa el sistema sol, què continua sent manual i on has d’entrar per aprofitar-ho."
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-50">Àrees cobertes</p>
          <p className="mt-2 text-3xl font-black">{ADMIN_MANUAL_SECTIONS.length}</p>
          <p className="mt-1 text-xs opacity-60">Negoci, operativa, social, finances i sistema.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-50">Mapa actual</p>
          <p className="mt-2 text-3xl font-black">{totalSnapshotItems}</p>
          <p className="mt-1 text-xs opacity-60">Peces clau per entendre què existeix de debò avui.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-50">Govern visual alineat</p>
          <p className="mt-2 text-3xl font-black">{totalVisualAligned}</p>
          <p className="mt-1 text-xs opacity-60">Workspaces que ja parlen en mode propietari.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-white/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-50">Roadmap pendent</p>
          <p className="mt-2 text-3xl font-black">{ADMIN_MANUAL_ROADMAP.length}</p>
          <p className="mt-1 text-xs opacity-60">Millores identificades encara no construïdes.</p>
        </div>
      </section>

      <AdminSection title="Què hi ha avui" description="La lectura ràpida perquè no hagis de recordar de cap què té el producte ni què és automàtic o manual.">
        <div className="grid gap-3 xl:grid-cols-2">
          {ADMIN_MANUAL_SNAPSHOT.map((section) => (
            <article key={section.title} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <h2 className="text-base font-black leading-snug">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{section.description}</p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed opacity-80">
                {section.items.map((item) => (
                  <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Preguntes pràctiques" description="Respostes curtes a les preguntes que normalment acaben quedant a memòria i després es perden.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_REALITY_CHECKS.map((item) => (
            <article key={item.question} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">Pregunta real</p>
              <h2 className="mt-1 text-base font-black leading-snug">{item.question}</h2>
              <p className="mt-3 text-sm leading-relaxed opacity-75">{item.answer}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Frontera d’automatització" description="La regla bona és aquesta: manual només on hi ha risc real, aprovació sensible o excepció. La resta s’ha d’anar absorbint pel sistema.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_AUTOMATION_FRONTIER.map((item) => (
            <article key={item.title} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-black leading-snug">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">{item.why}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${automationPriorityStyle[item.priority]}`}>
                  {priorityLabel[item.priority]}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Avui</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-80">{item.today}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">Objectiu</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-85">{item.target}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Govern visual del sistema" description="El mateix llenguatge de propietari s’ha d’estendre a tot l’admin: què vigila el sistema, on et cal intervenir i quin és el següent pas. Aquí queda visible què ja està alineat i què entra en segona onada.">
        <div className="grid gap-4 xl:grid-cols-2">
          {ADMIN_MANUAL_VISUAL_GOVERNANCE.map((section) => {
            const style = visualGovernanceStyle[section.status];
            return (
              <article key={section.title} className={`admin-card-glass rounded-2xl border p-4 ${style.panel}`}>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base font-black leading-snug">{section.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed opacity-75">{section.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
                    {section.status === 'ALIGNED' ? 'Alineat' : 'Segona onada'}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {section.items.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-black leading-snug">{item.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed opacity-75">{item.description}</p>
                        </div>
                        <Link href={item.href} className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-white/10">
                          Obrir
                        </Link>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.signals.map((signal) => (
                          <span key={signal} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-75">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </AdminSection>

      <AdminSection title="Com s’ha d’utilitzar" description="No és una enciclopèdia: és un mapa per decidir ràpid on actuar.">
        <div className="grid gap-3 md:grid-cols-3">
          {ADMIN_MANUAL_PRINCIPLES.map((principle) => (
            <article key={principle.title} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <h2 className="text-sm font-bold">{principle.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{principle.description}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <div className="space-y-6">
        {ADMIN_MANUAL_SECTIONS.map((section) => (
          <AdminSection key={section.title} title={<span>{section.icon} {section.title}</span>} description={section.summary}>
            <div className="grid gap-3 lg:grid-cols-3">
              {section.capabilities.map((capability) => (
                <article key={capability.title} className={`admin-card-glass rounded-2xl border border-white/10 p-4 ${toneClass[capability.tone]}`}>
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-black leading-snug">{capability.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed opacity-70">{capability.description}</p>
                    </div>
                    <Link href={capability.href} className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-white/10">
                      {capability.cta}
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {capability.signals.map((signal) => (
                      <span key={signal} className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        {signal}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </AdminSection>
        ))}
      </div>


      <AdminSection title="Pla de captació des de zero" description="Per a qui comença sense clients i sense saber per on tirar. Una fase a la vegada. No saltar-ne cap.">
        <div className="grid gap-4 lg:grid-cols-2">
          {MARKETING_PHASE_ORDER.map((phase) => {
            const actions = ADMIN_MARKETING_PHASES.filter((a) => a.phase === phase);
            return (
              <div key={phase} className={`rounded-2xl border p-4 ${MARKETING_PHASE_STYLE[phase]}`}>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{ADMIN_MARKETING_PHASE_LABEL[phase]}</p>
                <p className="mt-1 mb-4 text-sm leading-relaxed opacity-75">{ADMIN_MARKETING_PHASE_SUMMARY[phase]}</p>
                <div className="space-y-2">
                  {actions.map((action) => (
                    <div key={action.id} className="admin-card-glass rounded-xl border border-white/10 p-3">
                      <h4 className="text-sm font-bold">{action.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed opacity-70">{action.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        <span>💶 {action.cost}</span>
                        <span>·</span>
                        <span>⏱ {action.effort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </AdminSection>

      <AdminSection title="Mètriques de màrqueting que has de mirar" description="Sense mesurar-les, no saps si estàs gastant bé els diners.">
        <div className="grid gap-3 md:grid-cols-2">
          {ADMIN_MARKETING_METRICS.map((metric) => (
            <article key={metric.name} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <h3 className="text-sm font-bold">{metric.name}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{metric.description}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Playbook de màrqueting" description="Rutina simple per saber què fer, com fer-ho, quan fer-ho i quin mòdul obrir. Pensat per arribar a més clients sense improvisar.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MARKETING_PLAYBOOK.map((item) => (
            <article key={item.title} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">{item.cadence}</p>
                  <h3 className="mt-1 text-base font-black leading-snug">{item.title}</h3>
                </div>
                <Link href={item.adminHref} className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-white/10">
                  {item.adminLabel}
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Objectiu</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{item.objective}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Com fer-ho</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{item.how}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.signals.map((signal) => (
                  <span key={signal} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {signal}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Criteri de canals i Google Ads" description="Si no entren leads, no es posa més pasta a cegues: primer es mira entrega, clic, conversió, qualitat i marge.">
        <div className="grid gap-3 lg:grid-cols-2">
          <article className="admin-card-glass rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-4 lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-200">Regla dura</p>
            <h2 className="mt-1 text-xl font-black">0 leads = coll d’ampolla abans que pressupost</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-75">
              Si amb les dades actuals no entra gairebé ningú, la primera feina no és gastar més. És saber si el problema és que no et veuen, que no fan clic, que arriben però no converteixen, o que el lead no té qualitat. Fins que això no estigui mesurat, escalar Ads només compra confusió més cara.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/analytics" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10">Mirar Analytics</Link>
              <Link href="/admin/reporting" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10">Mirar Reporting</Link>
              <Link href="/admin/leads" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10">Mirar Leads</Link>
            </div>
          </article>

          {ADMIN_MARKETING_CHANNELS.map((channel) => (
            <article key={channel.platform} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-black leading-snug">{channel.platform}</h3>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{channel.role}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${MARKETING_CHANNEL_STYLE[channel.priority]}`}>
                  {ADMIN_MARKETING_CHANNEL_PRIORITY_LABEL[channel.priority]}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Quan usar-ho</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{channel.whenToUse}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Acció següent</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{channel.nextAction}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {channel.whatToMeasure.map((signal) => (
                  <span key={signal} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {signal}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Semàfor Google Ads" description="Criteri inicial per decidir si una campanya arriba a prou gent, si converteix i si es pot escalar.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_GOOGLE_ADS_DECISION_RULES.map((rule) => (
            <article key={rule.metric} className="admin-card-glass rounded-2xl border border-white/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">{rule.metric}</p>
              <h3 className="mt-1 text-base font-black leading-snug">{rule.question}</h3>
              <div className="mt-4 grid gap-2">
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3 text-xs leading-relaxed"><strong className="text-emerald-200">Verd:</strong> {rule.green}</p>
                <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-xs leading-relaxed"><strong className="text-amber-200">Ambre:</strong> {rule.warning}</p>
                <p className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-3 text-xs leading-relaxed"><strong className="text-rose-200">Vermell:</strong> {rule.danger}</p>
              </div>
              <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold leading-relaxed opacity-80">Acció: {rule.action}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Checklist de bolets a caçar" description="Cada patró nou que aparegui al repo s’ha d’afegir aquí i convertir, quan es pugui, en guard o script.">
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed opacity-75">
          Aquest checklist també serveix per a la segona onada visual: cada pantalla antiga que encara no es llegeixi bé en mòbil, que amagui tensió o que confongui automàtic amb manual ha d’entrar aquí abans de quedar donada per bona.
        </div>
        <div className="flex flex-wrap gap-2">
          {ADMIN_MANUAL_AUDIT_CATEGORIES.map((category) => (
            <span key={category} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold">
              {category}
            </span>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Roadmap de millores pendents" description="Idees identificades que encara no s'han construït. Ordenades per impacte vs esforç. Cada ítem aquí és candidat a convertir-se en un Canvi del protocol.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_ROADMAP.map((item) => (
            <article key={item.id} className="admin-card-glass flex flex-col gap-3 rounded-2xl border border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black leading-snug">{item.title}</h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">{item.area}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${priorityStyle[item.priority]}`}>
                  {priorityLabel[item.priority]}
                </span>
              </div>
              <p className="text-sm leading-relaxed opacity-75">{item.description}</p>
              <div className="mt-auto grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Impacte</p>
                  <p className="mt-1 text-xs opacity-80">{item.impact}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Esforç</p>
                  <p className="mt-1 text-xs opacity-80">{item.effort}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>
    </AdminPage>
  );
}
