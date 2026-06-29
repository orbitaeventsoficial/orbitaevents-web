import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { AdminPage, AdminSection } from '../components/AdminPage';
import { ADMIN_GOOGLE_ADS_DECISION_RULES, ADMIN_MANUAL_AUDIT_CATEGORIES, ADMIN_MANUAL_AUTOMATION_FRONTIER, ADMIN_MANUAL_OPERATING_EVIDENCE, ADMIN_MANUAL_OPERATING_EXCEPTIONS, ADMIN_MANUAL_OPERATING_FLOW, ADMIN_MANUAL_OPERATING_GATES, ADMIN_MANUAL_OPERATING_HANDOFFS, ADMIN_MANUAL_OPERATING_RHYTHM, ADMIN_MANUAL_OPERATING_STEP_CHECKLIST, ADMIN_MANUAL_PRINCIPLES, ADMIN_MANUAL_REALITY_CHECKS, ADMIN_MANUAL_ROADMAP, ADMIN_MANUAL_SECTIONS, ADMIN_MANUAL_SNAPSHOT, ADMIN_MANUAL_VISUAL_GOVERNANCE, ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK, ADMIN_MARKETING_BOOTSTRAP_PLAN, ADMIN_MARKETING_CHANNEL_DECISION_MATRIX, ADMIN_MARKETING_CHANNEL_PRIORITY_LABEL, ADMIN_MARKETING_CHANNELS, ADMIN_MARKETING_METRICS, ADMIN_MARKETING_PHASE_EVIDENCE, ADMIN_MARKETING_PHASE_GATE, ADMIN_MARKETING_PHASES, ADMIN_MARKETING_PHASE_LABEL, ADMIN_MARKETING_PHASE_SUMMARY, ADMIN_MARKETING_PLAYBOOK, type AdminManualRoadmapPriority, type AdminMarketingChannelPriority, type AdminMarketingPhase } from '@/lib/constants/adminManual';
import {
  indexProtocolCanvisByNumber,
  parseProtocolCanvis,
  type ProtocolCanviMeta,
} from '@/lib/services/protocolCanvisService';
import { buildAdminManualRoadmapProtocolTarget } from '@/lib/services/adminManualRoadmapService';

export const dynamic = 'force-static';
export const revalidate = 60;

const ROADMAP_AREA_WORKSPACE: Record<string, { href: string; label: string }> = {
  'Captació i vendes': { href: '/admin/marketing', label: 'Anar a Marketing' },
  'Finances i decisió': { href: '/admin/reporting', label: 'Anar a Reporting' },
  'UX transversal': { href: '/admin/manual', label: 'Manual' },
  Comunicació: { href: '/admin/inbox', label: 'Anar a Inbox' },
  'Executive cockpit': { href: '/admin', label: 'Anar al Dashboard' },
  Operacions: { href: '/admin/calendario', label: 'Anar a Calendari' },
  Reporting: { href: '/admin/reporting', label: 'Anar a Reporting' },
};

async function loadProtocolCanvisIndex(): Promise<Map<number, ProtocolCanviMeta>> {
  try {
    const canonicalPath = path.join(process.cwd(), 'docs', 'admin-protocol.md');
    const legacyPath = path.join(process.cwd(), 'docs', 'protocol-producte-admin-ca.md');
    const filePath = await fs.access(canonicalPath).then(() => canonicalPath).catch(() => legacyPath);
    const raw = await fs.readFile(filePath, 'utf-8');
    return indexProtocolCanvisByNumber(parseProtocolCanvis(raw));
  } catch {
    return new Map();
  }
}

const MARKETING_PHASE_ORDER: AdminMarketingPhase[] = ['FASE_0', 'FASE_1', 'FASE_2', 'FASE_3'];

const MARKETING_PHASE_STYLE: Record<AdminMarketingPhase, string> = {
  FASE_0: 'admin-tone-border-danger admin-tone-bg-danger',
  FASE_1: 'admin-tone-border-success admin-tone-bg-success',
  FASE_2: 'admin-tone-border-warning admin-tone-bg-warning',
  FASE_3: 'admin-tone-border-info admin-tone-bg-info',
};


const MARKETING_CHANNEL_STYLE: Record<AdminMarketingChannelPriority, string> = {
  OBLIGATORI: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
  FORT: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
  CONDICIONAL: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  MES_ENDAVANT: 'border-[var(--line)] bg-[var(--panel)] text-[var(--t2)]',
};
const priorityStyle: Record<AdminManualRoadmapPriority, string> = {
  CRITICAL: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
  HIGH: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  MEDIUM: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
  LOW: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
};

const priorityLabel: Record<AdminManualRoadmapPriority, string> = {
  CRITICAL: 'Crític',
  HIGH: 'Alt',
  MEDIUM: 'Mitjà',
  LOW: 'Baix',
};

const automationPriorityStyle = {
  CRITICAL: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
  HIGH: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  MEDIUM: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
};

const visualGovernanceStyle = {
  ALIGNED: {
    badge: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
    panel: 'admin-tone-border-success admin-tone-bg-success',
  },
  SECOND_WAVE: {
    badge: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
    panel: 'admin-tone-border-warning admin-tone-bg-warning',
  },
};

const toneClass = {
  success: 'ap-kpi--success',
  warning: 'ap-kpi--warning',
  danger: 'ap-kpi--danger',
  info: 'ap-kpi--info',
  neutral: 'ap-kpi--neutral',
};

const ROADMAP_STATUS_ORDER: Record<'PENDING' | 'DONE', number> = { PENDING: 0, DONE: 1 };

export default async function AdminManualPage() {
  const totalOperatingFlowSteps = ADMIN_MANUAL_OPERATING_FLOW.length;
  const totalVisualAligned = ADMIN_MANUAL_VISUAL_GOVERNANCE
    .filter((section) => section.status === 'ALIGNED')
    .reduce((sum, section) => sum + section.items.length, 0);
  const roadmapPendingCount = ADMIN_MANUAL_ROADMAP.filter((item) => item.status === 'PENDING').length;
  const roadmapDoneCount = ADMIN_MANUAL_ROADMAP.length - roadmapPendingCount;
  const roadmapItemsSorted = [...ADMIN_MANUAL_ROADMAP].sort(
    (a, b) => ROADMAP_STATUS_ORDER[a.status] - ROADMAP_STATUS_ORDER[b.status],
  );
  const marketingGateActions = ADMIN_MARKETING_PHASES.filter((action) =>
    ADMIN_MARKETING_PHASE_GATE.requiredActionIds.includes(action.id),
  );
  const marketingBlockedActions = ADMIN_MARKETING_PHASES.filter((action) =>
    ADMIN_MARKETING_PHASE_GATE.blockedActionIds.includes(action.id),
  );
  const marketingPrimaryAction = ADMIN_MARKETING_PHASES.find(
    (action) => action.id === ADMIN_MARKETING_PHASE_GATE.primaryActionId,
  );
  const marketingNextPhaseAction = ADMIN_MARKETING_PHASES.find(
    (action) => action.id === ADMIN_MARKETING_PHASE_GATE.nextPhaseActionId,
  );
  const marketingActiveChannelAction = ADMIN_MARKETING_PHASES.find(
    (action) => action.id === ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.activeActionId,
  );
  const canvisIndex = await loadProtocolCanvisIndex();
  const operatingFlowByStep = new Map(ADMIN_MANUAL_OPERATING_FLOW.map((item) => [item.step, item]));
  const capabilitiesByFlowStep = ADMIN_MANUAL_OPERATING_FLOW.map((step) => ({
    ...step,
    capabilities: ADMIN_MANUAL_SECTIONS.flatMap((section) =>
      section.capabilities
        .filter((capability) => capability.flowStep === step.step)
        .map((capability) => ({
          ...capability,
          sectionTitle: section.title,
        })),
    ),
  }));

  return (
    <AdminPage
      title="Manual de possibilitats"
      subtitle="Mapa pràctic per saber què existeix avui, què fa el sistema sol, què continua sent manual i on has d’entrar per aprofitar-ho."
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Àrees cobertes</p>
          <p className="mt-2 text-3xl font-bold">{ADMIN_MANUAL_SECTIONS.length}</p>
          <p className="mt-1 text-xs opacity-60">Negoci, operativa, social, finances i sistema.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Flux operatiu</p>
          <p className="mt-2 text-3xl font-bold">{totalOperatingFlowSteps}</p>
          <p className="mt-1 text-xs opacity-60">Passos del cicle captar, convertir, executar, cobrar i reactivar.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Govern visual alineat</p>
          <p className="mt-2 text-3xl font-bold">{totalVisualAligned}</p>
          <p className="mt-1 text-xs opacity-60">Workspaces que ja parlen en mode propietari.</p>
        </div>
        <div className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Roadmap pendent</p>
          <p className="mt-2 text-3xl font-bold">{roadmapPendingCount}</p>
          <p className="mt-1 text-xs opacity-60">{roadmapDoneCount} ja construïdes · {roadmapPendingCount} per atacar.</p>
        </div>
      </section>

      <AdminSection title="Què hi ha avui" description="La lectura ràpida perquè no hagis de recordar de cap què té el producte ni què és automàtic o manual.">
        <div className="grid gap-3 xl:grid-cols-2">
          {ADMIN_MANUAL_SNAPSHOT.map((section) => (
            <article key={section.title} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <h2 className="text-base font-bold leading-snug">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{section.description}</p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed opacity-80">
                {section.items.map((item) => (
                  <li key={item} className="ap-card px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Sistema operatiu de punta a punta" description="La narrativa única del producte: cada workspace existeix perquè una demanda avanci cap a reserva, cobrament i recurrència.">
        <div className="grid gap-3 xl:grid-cols-2">
          {ADMIN_MANUAL_OPERATING_FLOW.map((item) => (
            <article key={item.step} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Pas {item.step}</p>
                  <h2 className="mt-1 text-base font-bold leading-snug">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">{item.objective}</p>
                </div>
                <Link href={item.entryHref} className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                  {item.entryLabel}
                </Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">El sistema llegeix</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.systemReads.map((signal) => (
                      <span key={signal} className="rounded-full border admin-tone-border-success admin-tone-bg-success px-2 py-1 text-xs font-semibold uppercase tracking-wide admin-tone-text-success">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-warning">Decisió manual</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--t2)]">
                    {item.manualDecisions.map((decision) => (
                      <li key={decision}>- {decision}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <p className="rounded-xl border admin-tone-border-info admin-tone-bg-info p-3 text-xs font-semibold leading-relaxed admin-tone-text-info">
                  {item.successSignal}
                </p>
                <p className="ap-card p-3 text-xs font-semibold leading-relaxed text-[var(--t2)]">
                  {item.nextStep}
                </p>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Punts de control del flux" description="Els gates que impedeixen que el sistema avanci per inèrcia: cada pas ha de deixar una decisió clara abans de passar al següent.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_OPERATING_GATES.map((gate) => (
            <article key={gate.step} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Gate pas {gate.step}</p>
                  <h2 className="mt-1 text-base font-bold leading-snug">{gate.title}</h2>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[var(--t2)]">
                  {operatingFlowByStep.get(gate.step)?.title}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">Comprovació abans d’avançar</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{gate.checkBeforeMoving}</p>
                </div>
                <div className="rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-danger">Risc si se salta</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{gate.riskIfSkipped}</p>
                </div>
                <p className="rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-3 text-xs font-semibold leading-relaxed admin-tone-text-warning">
                  {gate.ownerQuestion}
                </p>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Checklist de pas" description="Definició operativa de tancament: què ha d’estar resolt abans de considerar que una fase del sistema està feta.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_OPERATING_STEP_CHECKLIST.map((item) => (
            <article key={item.step} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Pas {item.step}</p>
                  <h2 className="mt-1 text-base font-bold leading-snug">{item.doneLabel}</h2>
                  <p className="mt-2 text-sm leading-relaxed opacity-70">{operatingFlowByStep.get(item.step)?.title}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--t2)]">
                {item.checks.map((check) => (
                  <li key={check} className="rounded-xl border admin-tone-border-success admin-tone-bg-success px-3 py-2">
                    {check}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3 text-xs font-semibold leading-relaxed admin-tone-text-danger">
                Bloquejat si {item.blockedIf}
              </p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Matriu d’excepcions" description="Quan un pas queda bloquejat, el manual diu quin primer moviment toca i on resoldre'l abans de deixar que el flux avanci.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_OPERATING_EXCEPTIONS.map((item) => (
            <article key={item.step} className="admin-card-glass rounded-2xl border admin-tone-border-warning admin-tone-bg-warning p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-warning">
                    Excepció pas {item.step} · {operatingFlowByStep.get(item.step)?.title}
                  </p>
                  <h2 className="mt-1 text-base font-bold leading-snug">{item.trigger}</h2>
                </div>
                <Link href={item.actionHref} className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                  {item.actionLabel}
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border admin-tone-border-info admin-tone-bg-info p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Primer moviment</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{item.firstMove}</p>
                </div>
                <p className="rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3 text-xs font-semibold leading-relaxed admin-tone-text-danger">
                  No avançar fins que {item.doNotAdvanceUntil}
                </p>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Evidències de tancament" description="El rastre material que ha de quedar dins l’admin perquè cada pas es pugui considerar realment resolt, no només comentat de memòria.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_OPERATING_EVIDENCE.map((item) => (
            <article key={item.step} className="admin-card-glass rounded-2xl border admin-tone-border-success admin-tone-bg-success p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">
                    Evidència pas {item.step} · {operatingFlowByStep.get(item.step)?.title}
                  </p>
                  <h2 className="mt-1 text-base font-bold leading-snug">{item.artifact}</h2>
                </div>
                <Link href={item.proofHref} className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                  {item.proofLabel}
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border admin-tone-border-info admin-tone-bg-info p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">On es comprova</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{item.proof}</p>
                </div>
                <p className="ap-card p-3 text-xs font-semibold leading-relaxed text-[var(--t2)]">
                  {item.ownerCheck}
                </p>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Handoffs entre passos" description="Què ha de quedar entregat perquè el següent workspace pugui treballar sense reinterpretar memòria, notes soltes o intuïció.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_OPERATING_HANDOFFS.map((handoff) => (
            <article key={`${handoff.fromStep}-${handoff.toStep}`} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">
                    Pas {handoff.fromStep} → Pas {handoff.toStep}
                  </p>
                  <h2 className="mt-1 text-base font-bold leading-snug">
                    {operatingFlowByStep.get(handoff.fromStep)?.title} → {operatingFlowByStep.get(handoff.toStep)?.title}
                  </h2>
                </div>
                <Link href={handoff.nextWorkspaceHref} className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                  {handoff.nextWorkspace}
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border admin-tone-border-info admin-tone-bg-info p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Artefacte que es lliura</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{handoff.artifact}</p>
                </div>
                <div className="rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-3">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-warning">Regla d’handoff</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--t2)]">{handoff.handoffRule}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Cobertura del sistema" description="Lectura inversa del mapa: quines eines sostenen cada pas del flux i on hi ha més o menys suport operatiu.">
        <div className="grid gap-3 lg:grid-cols-3">
          {capabilitiesByFlowStep.map((step) => (
            <article key={step.step} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Pas {step.step}</p>
                  <h2 className="mt-1 text-sm font-bold leading-snug">{step.title}</h2>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[var(--t2)]">
                  {step.capabilities.length} eines
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {step.capabilities.map((capability) => (
                  <Link
                    key={`${step.step}-${capability.title}`}
                    href={capability.href}
                    className="block ap-card px-3 py-2 transition-colors hover:bg-[var(--raised)]"
                  >
                    <p className="text-xs font-bold leading-snug">{capability.title}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">{capability.sectionTitle}</p>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Preguntes pràctiques" description="Respostes curtes a les preguntes que normalment acaben quedant a memòria i després es perden.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_REALITY_CHECKS.map((item) => (
            <article key={item.question} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Pregunta real</p>
              <h2 className="mt-1 text-base font-bold leading-snug">{item.question}</h2>
              <p className="mt-3 text-sm leading-relaxed opacity-75">{item.answer}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Frontera d’automatització" description="La regla bona és aquesta: manual només on hi ha risc real, aprovació sensible o excepció. La resta s’ha d’anar absorbint pel sistema.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MANUAL_AUTOMATION_FRONTIER.map((item) => (
            <article key={item.title} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-snug">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">{item.why}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${automationPriorityStyle[item.priority]}`}>
                  {priorityLabel[item.priority]}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="ap-card p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Avui</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-80">{item.today}</p>
                </div>
                <div className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider admin-tone-text-success">Objectiu</p>
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
                    <h2 className="text-base font-bold leading-snug">{section.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed opacity-75">{section.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}>
                    {section.status === 'ALIGNED' ? 'Alineat' : 'Segona onada'}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {section.items.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-[var(--line)] bg-black/10 p-4">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold leading-snug">{item.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed opacity-75">{item.description}</p>
                        </div>
                        <Link href={item.href} className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                          Obrir
                        </Link>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.signals.map((signal) => (
                          <span key={signal} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-75">
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
            <article key={principle.title} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <h2 className="text-sm font-bold">{principle.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{principle.description}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Ritme operatiu" description="La rutina mínima perquè el producte funcioni com un sistema, no com una col·lecció de pantalles.">
        <div className="grid gap-3 lg:grid-cols-4">
          {ADMIN_MANUAL_OPERATING_RHYTHM.map((item) => (
            <article key={item.cadence} className="admin-card-glass flex min-h-full flex-col rounded-2xl border border-[var(--line)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">{item.cadence}</p>
              <h2 className="mt-2 text-sm font-bold leading-snug">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-75">{item.objective}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.signals.map((signal) => (
                  <span key={signal} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                    {signal}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border admin-tone-border-success admin-tone-bg-success p-3">
                <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">Tancat quan</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--t2)]">
                  {item.doneWhen.map((criterion) => (
                    <li key={criterion}>- {criterion}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-3 text-xs font-semibold leading-relaxed admin-tone-text-warning">
                {item.ifOffTrack}
              </p>
              <Link href={item.href} className="mt-auto inline-flex w-fit rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </AdminSection>

      <div className="space-y-6">
        {ADMIN_MANUAL_SECTIONS.map((section) => (
          <AdminSection key={section.title} title={<span>{section.icon} {section.title}</span>} description={section.summary}>
            <div className="grid gap-3 lg:grid-cols-3">
              {section.capabilities.map((capability) => (
                <article key={capability.title} className={`admin-card-glass rounded-2xl border border-[var(--line)] p-4 ${toneClass[capability.tone]}`}>
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold leading-snug">{capability.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed opacity-70">{capability.description}</p>
                      <p className="mt-3 inline-flex rounded-full border admin-tone-border-info admin-tone-bg-info px-2.5 py-1 text-xs font-bold uppercase tracking-wide admin-tone-text-info">
                        Pas {capability.flowStep} · {operatingFlowByStep.get(capability.flowStep)?.title}
                      </p>
                    </div>
                    <Link href={capability.href} className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                      {capability.cta}
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {capability.signals.map((signal) => (
                      <span key={signal} className="rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-70">
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
        <div className="mb-4 rounded-2xl border admin-tone-border-danger admin-tone-bg-danger p-4">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-danger">
                {ADMIN_MARKETING_PHASE_LABEL[ADMIN_MARKETING_PHASE_GATE.activePhase]}
              </p>
              <h2 className="mt-1 ap-h2 leading-snug">{ADMIN_MARKETING_PHASE_GATE.title}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed opacity-75">{ADMIN_MARKETING_PHASE_GATE.decision}</p>
              <p className="mt-2 max-w-4xl rounded-xl border admin-tone-border-danger admin-tone-bg-danger px-3 py-2 text-xs font-bold leading-relaxed admin-tone-text-danger">{ADMIN_MARKETING_PHASE_GATE.focusRule}</p>
              <p className="mt-2 max-w-4xl text-xs font-semibold leading-relaxed opacity-65">{ADMIN_MARKETING_PHASE_GATE.blockedUntil}</p>
            </div>
            <Link href="/admin/docs/protocol?seccio=6.16#seccio-6-16" className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
              Obrir §6.16
            </Link>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {marketingGateActions.map((action) => (
              <div key={action.id} className="rounded-xl border border-[var(--line)] bg-black/10 p-3">
                <h3 className="text-sm font-bold leading-snug">{action.title}</h3>
                <p className="mt-1 text-xs leading-relaxed opacity-70">{action.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ADMIN_MARKETING_PHASE_GATE.requiredOutputs[action.id]?.map((output) => (
                    <span key={output} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
                      {output}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {marketingPrimaryAction ? (
            <div className="mt-4 rounded-xl border admin-tone-border-info admin-tone-bg-info p-3">
              <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Primer moviment</p>
              <h3 className="mt-2 text-sm font-bold leading-snug">{marketingPrimaryAction.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]">{marketingPrimaryAction.description}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
                {marketingPrimaryAction.cost} · {marketingPrimaryAction.effort}
              </p>
            </div>
          ) : null}
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-black/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">Quan pots passar de fase</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {ADMIN_MARKETING_PHASE_GATE.unlockCriteria.map((criterion) => (
                <div key={criterion} className="rounded-lg border admin-tone-border-success admin-tone-bg-success px-3 py-2 text-xs font-semibold leading-relaxed text-[var(--t2)]">
                  {criterion}
                </div>
              ))}
            </div>
          </div>
          {marketingNextPhaseAction ? (
            <div className="mt-4 rounded-xl border admin-tone-border-success admin-tone-bg-success p-3">
              <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">Després de la fundació</p>
              <h3 className="mt-2 text-sm font-bold leading-snug">{marketingNextPhaseAction.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]">{marketingNextPhaseAction.description}</p>
              <p className="mt-2 text-xs font-semibold leading-relaxed admin-tone-text-success">{ADMIN_MARKETING_PHASE_GATE.nextPhaseReason}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ADMIN_MARKETING_PHASE_GATE.nextPhaseOutputs.map((output) => (
                  <span key={output} className="rounded-full border admin-tone-border-success admin-tone-bg-success px-2 py-1 text-xs font-semibold uppercase tracking-wider admin-tone-text-success">
                    {output}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
                {marketingNextPhaseAction.cost} · {marketingNextPhaseAction.effort}
              </p>
            </div>
          ) : null}
          <div className="mt-4 rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-3">
            <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-warning">No obrir encara</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {marketingBlockedActions.map((action) => (
                <div key={action.id} className="rounded-lg border border-[var(--line)] bg-black/10 px-3 py-2">
                  <p className="text-xs font-bold leading-snug">{action.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]">
                    {ADMIN_MARKETING_PHASE_GATE.blockedReasons[action.id]}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">{action.cost}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-black/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Pla de 14 dies</p>
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              {ADMIN_MARKETING_BOOTSTRAP_PLAN.map((step) => (
                <div key={step.window} className="rounded-lg border admin-tone-border-info admin-tone-bg-info px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">{step.window}</p>
                  <h3 className="mt-1 text-xs font-bold leading-snug">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]">{step.objective}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {step.outputs.map((output) => (
                      <span key={output} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
                        {output}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3">
            <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-danger">Bloqueig de canal actiu</p>
                <h3 className="mt-2 text-sm font-bold leading-snug">{ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]">{ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.rule}</p>
              </div>
              {marketingActiveChannelAction ? (
                <span className="shrink-0 rounded-full border border-[var(--line)] px-2.5 py-1.5 text-xs font-bold text-[var(--t2)]">
                  {marketingActiveChannelAction.cost} · {marketingActiveChannelAction.effort}
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              <div className="rounded-lg border admin-tone-border-success admin-tone-bg-success px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">Només fer ara</p>
                <div className="mt-2 space-y-1.5">
                  {ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.allowedMoves.map((move) => (
                    <p key={move} className="text-xs font-semibold leading-relaxed admin-tone-text-success">{move}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border admin-tone-border-warning admin-tone-bg-warning px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-warning">No canviar encara</p>
                <div className="mt-2 space-y-2">
                  {ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.blockedSwitches.map((blocked) => {
                    const action = ADMIN_MARKETING_PHASES.find((phaseAction) => phaseAction.id === blocked.actionId);
                    return (
                      <p key={blocked.actionId} className="text-xs leading-relaxed admin-tone-text-warning">
                        <strong>{action?.title ?? blocked.actionId}:</strong> {blocked.reason}
                      </p>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border admin-tone-border-info admin-tone-bg-info px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">Sortida del bloqueig</p>
                <div className="mt-2 space-y-1.5">
                  {ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.exitSignals.map((signal) => (
                    <p key={signal} className="text-xs font-semibold leading-relaxed admin-tone-text-info">{signal}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border admin-tone-border-success admin-tone-bg-success p-3">
            <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">Matriu d’un sol canal</p>
            <div className="mt-3 grid gap-2 xl:grid-cols-2">
              {ADMIN_MARKETING_CHANNEL_DECISION_MATRIX.map((decision) => {
                const action = ADMIN_MARKETING_PHASES.find((phaseAction) => phaseAction.id === decision.actionId);
                return (
                  <div key={decision.actionId} className="rounded-lg border admin-tone-border-success bg-black/10 px-3 py-2">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-snug">{action?.title ?? decision.actionId}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]">{decision.startWhen}</p>
                      </div>
                      <Link href={decision.adminHref} className="shrink-0 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                        {decision.adminLabel}
                      </Link>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-2 py-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--t3)]">Primer moviment</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]">{decision.firstMove}</p>
                      </div>
                      <div className="rounded-md border admin-tone-border-success admin-tone-bg-success px-2 py-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-success">Senyals d’èxit</p>
                        <p className="mt-1 text-xs leading-relaxed admin-tone-text-success">{decision.successSignal}</p>
                      </div>
                    </div>
                    <p className="mt-2 rounded-md border admin-tone-border-warning admin-tone-bg-warning px-2 py-1.5 text-xs font-semibold leading-relaxed admin-tone-text-warning">
                      {decision.stopIf}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-black/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-warning">Tracker de proves Fase 0</p>
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {ADMIN_MARKETING_PHASE_EVIDENCE.map((item) => {
                const action = ADMIN_MARKETING_PHASES.find((phaseAction) => phaseAction.id === item.actionId);
                return (
                  <div key={item.actionId} className="rounded-lg border border-[var(--line)] admin-tone-bg-neutral px-3 py-2">
                    <p className="text-xs font-bold leading-snug">{action?.title ?? item.actionId}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--t2)]"><strong className="admin-tone-text-warning">Prova:</strong> {item.proof}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--t2)]"><strong>Comprovar:</strong> {item.whereToCheck}</p>
                    <p className="mt-2 rounded-md admin-tone-bg-success admin-tone-border-success admin-tone-text-success px-2 py-1.5 text-xs font-semibold leading-relaxed">
                      {item.unlockSignal}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {MARKETING_PHASE_ORDER.map((phase) => {
            const actions = ADMIN_MARKETING_PHASES.filter((a) => a.phase === phase);
            return (
              <div key={phase} className={`rounded-2xl border p-4 ${MARKETING_PHASE_STYLE[phase]}`}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">{ADMIN_MARKETING_PHASE_LABEL[phase]}</p>
                <p className="mt-1 mb-4 text-sm leading-relaxed opacity-75">{ADMIN_MARKETING_PHASE_SUMMARY[phase]}</p>
                <div className="space-y-2">
                  {actions.map((action) => (
                    <div key={action.id} className="admin-card-glass rounded-xl border border-[var(--line)] p-3">
                      <h4 className="text-sm font-bold">{action.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed opacity-70">{action.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-60">
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
            <article key={metric.name} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <h3 className="text-sm font-bold">{metric.name}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{metric.description}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Playbook de màrqueting" description="Rutina simple per saber què fer, com fer-ho, quan fer-ho i quin mòdul obrir. Pensat per arribar a més clients sense improvisar.">
        <div className="grid gap-3 lg:grid-cols-2">
          {ADMIN_MARKETING_PLAYBOOK.map((item) => (
            <article key={item.title} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-warning">{item.cadence}</p>
                  <h3 className="mt-1 text-base font-bold leading-snug">{item.title}</h3>
                </div>
                <Link href={item.adminHref} className="shrink-0 rounded-xl border border-[var(--line)] px-3 py-2 text-center text-xs font-bold transition-colors hover:bg-[var(--raised)]">
                  {item.adminLabel}
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Objectiu</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{item.objective}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Com fer-ho</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{item.how}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.signals.map((signal) => (
                  <span key={signal} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-70">
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
          <article className="admin-card-glass rounded-2xl border admin-tone-border-danger admin-tone-bg-danger p-4 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-danger">Regla dura</p>
            <h2 className="mt-1 text-xl font-bold">0 leads = coll d’ampolla abans que pressupost</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-75">
              Si amb les dades actuals no entra gairebé ningú, la primera feina no és gastar més. És saber si el problema és que no et veuen, que no fan clic, que arriben però no converteixen, o que el lead no té qualitat. Fins que això no estigui mesurat, escalar Ads només compra confusió més cara.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/analytics" className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold transition-colors hover:bg-[var(--raised)]">Mirar Analytics</Link>
              <Link href="/admin/reporting" className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold transition-colors hover:bg-[var(--raised)]">Mirar Reporting</Link>
              <Link href="/admin/leads" className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold transition-colors hover:bg-[var(--raised)]">Mirar Leads</Link>
            </div>
          </article>

          {ADMIN_MARKETING_CHANNELS.map((channel) => (
            <article key={channel.platform} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-snug">{channel.platform}</h3>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{channel.role}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${MARKETING_CHANNEL_STYLE[channel.priority]}`}>
                  {ADMIN_MARKETING_CHANNEL_PRIORITY_LABEL[channel.priority]}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Quan usar-ho</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{channel.whenToUse}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Acció següent</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-75">{channel.nextAction}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {channel.whatToMeasure.map((signal) => (
                  <span key={signal} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-70">
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
            <article key={rule.metric} className="admin-card-glass rounded-2xl border border-[var(--line)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider admin-tone-text-info">{rule.metric}</p>
              <h3 className="mt-1 text-base font-bold leading-snug">{rule.question}</h3>
              <div className="mt-4 grid gap-2">
                <p className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-3 text-xs leading-relaxed"><strong className="admin-tone-text-success">Verd:</strong> {rule.green}</p>
                <p className="rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-3 text-xs leading-relaxed"><strong className="admin-tone-text-warning">Ambre:</strong> {rule.warning}</p>
                <p className="rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3 text-xs leading-relaxed"><strong className="admin-tone-text-danger">Vermell:</strong> {rule.danger}</p>
              </div>
              <p className="mt-3 ap-card p-3 text-xs font-semibold leading-relaxed opacity-80">Acció: {rule.action}</p>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Checklist de bolets a caçar" description="Cada patró nou que aparegui al repo s’ha d’afegir aquí i convertir, quan es pugui, en guard o script.">
        <div className="mb-4 ap-card p-4 text-sm leading-relaxed opacity-75">
          Aquest checklist també serveix per a la segona onada visual: cada pantalla antiga que encara no es llegeixi bé en mòbil, que amagui tensió o que confongui automàtic amb manual ha d’entrar aquí abans de quedar donada per bona.
        </div>
        <div className="flex flex-wrap gap-2">
          {ADMIN_MANUAL_AUDIT_CATEGORIES.map((category) => (
            <span key={category} className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold">
              {category}
            </span>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Roadmap de millores identificades" description="Backlog històric ordenat amb pendents primer. Els FET porten cita del Canvi #N que els va tancar — el §9 del protocol és l'origen canònic, i cada CTA porta directament al lloc on es treballa.">
        <div className="grid gap-3 lg:grid-cols-2">
          {roadmapItemsSorted.map((item) => {
            const canvi = item.doneCanvi ? canvisIndex.get(item.doneCanvi) : undefined;
            const workspace = ROADMAP_AREA_WORKSPACE[item.area];
            const protocolTarget = buildAdminManualRoadmapProtocolTarget(item);
            return (
              <article
                key={item.id}
                className={`admin-card-glass flex flex-col gap-3 rounded-2xl border p-4 ${
                  item.status === 'DONE' ? 'admin-tone-border-success admin-tone-bg-success' : 'border-[var(--line)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold leading-snug">{item.title}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-50">{item.area}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${priorityStyle[item.priority]}`}>
                      {priorityLabel[item.priority]}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                        item.status === 'DONE'
                          ? 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
                          : 'border-[var(--line)] bg-[var(--panel)] text-[var(--t2)]'
                      }`}
                    >
                      {item.status === 'DONE'
                        ? item.doneCanvi
                          ? `Fet · #${item.doneCanvi}`
                          : 'Fet'
                        : 'Pendent'}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed opacity-75">{item.description}</p>
                {item.status === 'DONE' && item.doneNote ? (
                  <p className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-2.5 text-xs leading-relaxed admin-tone-text-success">
                    {item.doneNote}
                  </p>
                ) : null}
                {canvi ? (
                  <div className="ap-card p-2.5 text-xs leading-relaxed opacity-80">
                    <span className="font-semibold">Verificat al §9:</span> #{canvi.n} · {canvi.date} · {canvi.author} · {canvi.status}
                  </div>
                ) : null}
                <div className="grid gap-2 border-t border-[var(--line)] pt-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Impacte</p>
                    <p className="mt-1 text-xs opacity-80">{item.impact}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Esforç</p>
                    <p className="mt-1 text-xs opacity-80">{item.effort}</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {protocolTarget ? (
                    <Link href={protocolTarget.href} className="ap-btn-primary text-xs">
                      {protocolTarget.label}
                    </Link>
                  ) : null}
                  {workspace ? (
                    <Link href={workspace.href} className="ap-btn-secondary text-xs">
                      {workspace.label}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </AdminSection>
    </AdminPage>
  );
}
