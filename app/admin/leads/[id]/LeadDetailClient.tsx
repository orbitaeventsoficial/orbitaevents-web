'use client';

// ─────────────────────────────────────────────────────────
// ✅ TANCAT CHARLIE — validat pel propietari (2026-06-15)
// Fitxa de lead (/admin/leads/[id]). Zenit: header ledger en
// una sola pantalla (nom protagonista + rail de fets + marge
// real via computeBookingFinancialSummary), bolo canònic
// (BoloConfigurator), cobraments gestionats a la fitxa de
// RESERVA (no al lead), històric comercial al peu. Helpers
// monocapa (formatCurrency, buildLeadWhatsAppHref). A11y:
// aria-label a inputs/botons d'icona. Patró de referència per
// a la resta de fitxes de l'admin. Millorar sense reobrir.
// ─────────────────────────────────────────────────────────

import Link from 'next/link';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildLeadComposeHref } from '@/lib/admin/leadWorkspaceHref';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import LeadBoloSection, { type BoloEconomia } from './LeadBoloSection';
import CommercialDocumentsHistory, { type CommercialDocumentHistoryItem } from '@/app/admin/components/CommercialDocumentsHistory';
import { buildLeadWhatsAppHref } from '../leadWhatsApp';
import { patchLeadStatus } from '../leadStatusClient';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import ConfirmDialog, { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { SOURCE_LABELS, formatCurrency, formatDateFull, getContractStatusLabel, getProposalStatusDisplay } from '@/lib/constants';
import { TEAM_MEMBERS } from '@/lib/constants/admin';
import { INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM, TRAVEL_BLOCK_EUR } from '@/lib/services/travelCost';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';

type Stage = 'nou' | 'contactat' | 'guanyat' | 'perdut';

const STAGE_LABEL: Record<Stage, string> = {
 nou: 'Nou', contactat: 'Contactat', guanyat: 'Guanyat', perdut: 'Perdut',
};
const PIPELINE_STAGES: Stage[] = ['nou', 'contactat', 'guanyat', 'perdut'];
const PAY_LABEL: Record<string, string> = {
 none: 'Pendent', part: 'Senyal pagat', full: 'Pagat',
};
const PRIORITY_LABEL: Record<string, string> = {
 LOW: 'Baixa', MEDIUM: 'Mitjana', HIGH: 'Alta', URGENT: 'Urgent',
};

function fullDate(iso: string) {
 return formatDateFull(iso);
}

function durationLabel(start: string | null, end: string | null): string {
 if (!start || !end) return '—';
 const [sh, sm] = start.split(':').map(Number);
 const [eh, em] = end.split(':').map(Number);
 if (![sh, sm, eh, em].every(Number.isFinite)) return '—';
 const startMin = sh * 60 + sm;
 let endMin = eh * 60 + em;
 if (endMin <= startMin) endMin += 24 * 60;
 const total = endMin - startMin;
 const hours = Math.floor(total / 60);
 const minutes = total % 60;
 return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function sourceLabel(source: string | null): string {
 if (!source) return '—';
 return SOURCE_LABELS[source] ?? source;
}

export type LeadDetailData = {
 id: string;
 name: string;
 stage: Stage;
 type: string;
 dateISO: string | null;
 time: string | null;
 endTime: string | null;
 location: string | null;
 value: number | null;
 pax: number | null;
 priority: string;
 phone: string | null;
 email: string | null;
 channel: string | null;
 owner: string | null;
 sourceCollaboratorId: string | null;
 last: string | null;
 product: string | null;
 lostReason: string | null;
 wx: WxData | null;
 eventPhone: string | null;
 eventAddress: string | null;
 booking: {
 id: string;
 reference: string;
 depositPaid: boolean;
 remainingPaid: boolean;
 depositAmount: number;
 remainingAmount: number;
 paymentMethod: string;
 invoiceRequired: boolean;
 cashAmount: number | null;
 total: number;
 totalHours: number;
 contractedProducts: Array<{
 id: string;
 kind: string;
 label: string;
 quantity: number;
 amount: number | null;
 meta?: string | null;
 }>;
 collaboratorCost: { amount: number; name: string } | null;
 costFloor: number | null;
 } | null;
};

function leadSummary(lead: LeadDetailData): string {
 if (lead.stage === 'perdut') return 'Lead perdut. Considera reengagement si el motiu era timing.';
 if (lead.stage === 'guanyat' && lead.booking) return 'Reserva activa. Gestiona cobraments i preparació.';
 if (lead.stage === 'guanyat') return 'Crear reserva, contracte i pagament inicial.';
 if (lead.stage === 'contactat') return 'Enviar pressupost i fer seguiment en 48h.';
 return 'Contactar el client avui.';
}

type EditableField = 'phone' | 'email' | 'eventPhone' | 'eventAddress' | 'eventDate' | 'eventStartTime' | 'eventEndTime' | 'eventLocation' | 'guestCount' | 'budget';

type ProposalItem = {
 id: string;
 reference: string;
 status: string;
 total: number;
 sentAt: string | null;
 acceptedAt?: string | null;
 createdAt: string;
 pdfUrl?: string | null;
 contractReference?: string | null;
 contractStatus?: string | null;
 contractPdfUrl?: string | null;
 contractSignedAt?: string | null;
};
type DossierItem = { id: string; nom: string; estat: string; mode: string | null; sentAt: string | null; sentTo?: string | null; createdAt: string };
type LeadDocumentItem = { id: string; type: string; title: string; fileUrl: string; createdAt: string };

export default function LeadDetailClient({ lead, proposals, dossiers, documents, vehicleCostPerKm, initialDistanceKm = null, bookingEconomia = null }: {
 lead: LeadDetailData;
 proposals: ProposalItem[];
 dossiers: DossierItem[];
 documents: LeadDocumentItem[];
 vehicleCostPerKm: number;
 initialDistanceKm?: number | null;
 /** Economia REAL de la reserva vinculada (font canònica). Quan existeix, mana
 * sobre el `boloEcon` provisional del configurador (el lead amb reserva mostra
 * la veritat de la reserva, no el bolo). */
 bookingEconomia?: BoloEconomia | null;
}) {
 const router = useRouter();
 const toast = useToast();
 const { confirm, dialogProps } = useConfirmDialog();
 const [stage, setStage] = useState<Stage>(lead.stage);
 const [pending, setPending] = useState(false);
 const [isPending, startTransition] = useTransition();
 // Només col·laboradors amb rol REFERRER (els que ens passen bolos).
 const [referrers, setReferrers] = useState<{ id: string; name: string }[]>([]);
 const [editField, setEditField] = useState<EditableField | null>(null);
 const [editValue, setEditValue] = useState('');
 const [savePending, setSavePending] = useState(false);
 // Economia del bolo elevada des de LeadBoloSection per al rail financer compacte.
 const [boloEcon, setBoloEcon] = useState<BoloEconomia | null>(null);
 const handleEconomia = useCallback((e: BoloEconomia | null) => setBoloEcon(e), []);
 // Si el lead té reserva, mana l'economia REAL de la reserva (font canònica del
 // servidor); si no, el net provisional del configurador del bolo (cas Cristina).
 const econ = bookingEconomia ?? boloEcon;

 const documentHistoryItems: CommercialDocumentHistoryItem[] = [
 ...proposals.flatMap((p) => {
 const items: CommercialDocumentHistoryItem[] = [{
 id: `proposal-${p.id}`,
 kindLabel: 'Pressupost',
 title: p.reference,
 reference: p.reference,
 statusLabel: getProposalStatusDisplay(p.status).label,
 amount: p.total,
 createdAt: p.createdAt,
 sentAt: p.sentAt,
 href: buildProposalHref(p.id),
 }];
 if (p.contractReference || p.contractStatus || p.contractPdfUrl) {
 items.push({
 id: `contract-${p.id}`,
 kindLabel: 'Contracte',
 title: p.contractReference || p.reference,
 reference: p.contractReference || null,
 statusLabel: getContractStatusLabel(p.contractStatus ?? null),
 amount: p.total,
 createdAt: p.contractSignedAt || p.sentAt || p.createdAt,
 href: p.contractPdfUrl || buildProposalHref(p.id),
 targetBlank: Boolean(p.contractPdfUrl),
 });
 }
 return items;
 }),
 ...dossiers.map((d) => ({
 id: `dossier-${d.id}`,
 kindLabel: d.mode === 'quote' ? 'Pressupost dossier' : 'Dossier',
 title: d.nom,
 statusLabel: d.estat,
 createdAt: d.createdAt,
 sentAt: d.sentAt,
 href: `/api/admin/dossiers/${d.id}/composite`,
 targetBlank: true,
 })),
 ...documents.map((doc) => ({
 id: `lead-document-${doc.id}`,
 kindLabel: doc.type === 'QUOTE' ? 'Pressupost antic' : doc.type === 'CONTRACT' ? 'Contracte antic' : 'Document',
 title: doc.title,
 statusLabel: doc.type,
 createdAt: doc.createdAt,
 href: doc.fileUrl,
 targetBlank: true,
 })),
 ];

 const [fields, setFields] = useState({
 phone: lead.phone ?? '',
 email: lead.email ?? '',
 eventPhone: lead.eventPhone ?? '',
 eventAddress: lead.eventAddress ?? '',
 eventDate: lead.dateISO ? lead.dateISO.slice(0, 10) : '',
 eventStartTime: lead.time ?? '',
 eventEndTime: lead.endTime ?? '',
 eventLocation: lead.location ?? '',
 guestCount: lead.pax ? String(lead.pax) : '',
 budget: lead.value ? String(lead.value) : '',
 });

 useEffect(() => {
 fetch('/api/admin/collaborators')
 .then((r) => r.json())
 .then((data) => {
 const list = Array.isArray(data) ? data : Array.isArray(data?.collaborators) ? data.collaborators : [];
 // Només els que poden derivar bolos (rol REFERRER).
 setReferrers(
 list
 .filter((c: { roles?: string[] }) => Array.isArray(c.roles) && c.roles.includes('REFERRER'))
 .map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
 );
 })
 .catch((error) => {
 console.error('[LeadDetailClient] Error loading collaborators', error);
 });
 }, []);

 async function saveAssignedTo(name: string) {
 try {
 await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ assignedTo: name || null }),
 });
 setFields((f) => ({ ...f }));
 toast.success('Assignat desat.');
 startTransition(() => router.refresh());
 } catch (error) {
 console.error('[LeadDetailClient] Error saving assignee', error);
 toast.error('Error desant l\'assignació.');
 }
 }

 async function handleDeleteLead() {
 const ok = await confirm({
 title: 'Eliminar lead',
 message: `Segur que vols eliminar "${lead.name}"? S'eliminaran notes, activitats, tasques i documents associats. Acció irreversible.`,
 variant: 'danger',
 confirmLabel: 'Eliminar',
 });
 if (!ok) return;
 try {
 const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}`, { method: 'DELETE' });
 if (!res.ok) {
 const data = await res.json().catch(() => ({}));
 throw new Error(data.error || 'No s\'ha pogut eliminar');
 }
 toast.success('Lead eliminat.');
 router.push('/admin/leads');
 } catch (error) {
 console.error('[LeadDetailClient] Error eliminant lead', error);
 toast.error(error instanceof Error ? error.message : 'Error eliminant el lead.');
 }
 }

 async function saveSourceCollaborator(id: string) {
 try {
 await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ sourceCollaboratorId: id || null }),
 });
 toast.success('Origen del bolo desat.');
 startTransition(() => router.refresh());
 } catch (error) {
 console.error('[LeadDetailClient] Error saving source collaborator', error);
 toast.error('Error desant l\'origen del bolo.');
 }
 }

 function startEdit(field: EditableField) {
 setEditField(field);
 setEditValue(fields[field]);
 }

 async function saveEdit() {
 if (!editField || savePending) return;
 setSavePending(true);
 try {
 const value = editField === 'guestCount'
 ? (editValue ? parseInt(editValue, 10) : null)
 : editValue || null;
 await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ [editField]: value }),
 });
 setFields((f) => ({ ...f, [editField!]: editValue }));
 toast.success('Desat.');
 setEditField(null);
 } catch (error) {
 console.error('[LeadDetailClient] Error saving field', error);
 toast.error('Error desant el camp.');
 } finally {
 setSavePending(false);
 }
 }

 function cancelEdit() {
 setEditField(null);
 setEditValue('');
 }


 async function moveLead(target: Stage) {
 if (pending || target === stage) return;
 if (target === 'perdut') {
 // Per ara redirigim a l'Agenda per usar el modal de motiu perdut
 router.push(`/admin/leads?lost=${lead.id}`);
 return;
 }
 setPending(true);
 const previous = stage;
 setStage(target);
 try {
 await patchLeadStatus({ leadId: lead.id, status: target === 'nou' ? 'NEW' : target === 'contactat' ? 'CONTACTED' : 'WON' });
 toast.success(`Mogut a ${STAGE_LABEL[target]}.`);
 if (target === 'guanyat' && !lead.booking) {
 startTransition(() => router.push(`/admin/bookings/new?leadId=${encodeURIComponent(lead.id)}`));
 return;
 }
 startTransition(() => router.refresh());
 } catch (error) {
 console.error('[LeadDetailClient] Error moving lead', error);
 setStage(previous);
 toast.error("No s'ha pogut canviar l'estat.");
 } finally {
 setPending(false);
 }
 }


 return (
 <div className="ap-ledger-fullpage" data-stage={stage}>

 {/* Barra superior */}
 <header className="ap-detail-bar">
 <Link href="/admin/leads" className="ap-detail-bar-btn">← Temporada</Link>
 </header>

 {/* BAND 1 · Identitat refeta — nom protagonista sol + rail de fets horitzontal */}
 <section className="ap-ledger-hd">
 <div className="ap-ledger-hd-top">
 <div className="ap-ledger-hd-ident">
 <p className="ap-ledger-hd-eyebrow">{STAGE_LABEL[stage]} · {lead.type} · {sourceLabel(lead.channel)}</p>
 <h2 className="ap-ledger-hd-name">{lead.name}</h2>
 <p className="ap-ledger-hd-next" aria-label="Següent pas recomanat"><span className="ap-ledger-hd-next-tag">Següent pas</span>{leadSummary(lead)}</p>
 </div>
 <div className="ap-ledger-hd-reach" aria-label="Contacte ràpid">
 {(['phone', 'email'] as EditableField[]).map((f) => (
 editField === f ? (
 <span key={f} className="ap-ledger-editrow ap-ledger-hd-reachedit">
 <input className="adm-input" value={editValue} type={f === 'email' ? 'email' : 'tel'}
 aria-label={f === 'phone' ? 'Telèfon del lead' : 'Email del lead'}
 onChange={(e) => setEditValue(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} autoFocus />
 <button type="button" className="ap-btn ap-btn--primary ap-btn--xs" onClick={saveEdit} disabled={savePending} aria-label="Desar">✓</button>
 <button type="button" className="ap-btn ap-btn--xs" onClick={cancelEdit} aria-label="Cancel·lar">✕</button>
 </span>
 ) : (
 <button key={f} type="button" className="ap-ledger-hd-reachitem" onClick={() => startEdit(f)} aria-label={f === 'phone' ? 'Editar telèfon' : 'Editar email'}>
 <span className="ap-ledger-hd-reachlbl">{f === 'phone' ? 'Tel.' : 'Email'}</span>
 <span className="ap-ledger-hd-reachval">{fields[f] || <em className="ap-ledger-empty">Afegir</em>}</span>
 </button>
 )
 ))}
 <span className="ap-ledger-hd-reachbtns">
 {(() => {
 const waHref = buildLeadWhatsAppHref(fields.phone, lead.name);
 return waHref ? (
 <a href={waHref} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--xs">WhatsApp</a>
 ) : null;
 })()}
 <Link href={buildLeadComposeHref(lead.id, 'seguiment')} className="ap-btn ap-btn--xs">Correu</Link>
 </span>
 </div>
 </div>

 {/* Rail de fets — una sola línia ledger amb columnes separades per hairline */}
 <div className="ap-ledger-hd-rail" aria-label="Dades del bolo">
 {([
 { f: 'eventDate' as EditableField, lbl: 'Data', type: 'date', show: (v: string) => v ? fullDate(v) : '' },
 { f: 'eventStartTime' as EditableField, lbl: 'Inici', type: 'time', show: (v: string) => v },
 { f: 'eventEndTime' as EditableField, lbl: 'Fi', type: 'time', show: (v: string) => v },
 { f: 'eventLocation' as EditableField, lbl: 'Lloc', type: 'text', show: (v: string) => v },
 { f: 'guestCount' as EditableField, lbl: 'Pax', type: 'number', show: (v: string) => v ? `${v}` : '' },
 ]).map(({ f, lbl, type, show }) => (
 <div key={f} className="ap-ledger-fact">
 <span className="ap-ledger-fact-lbl">{lbl}</span>
 {editField === f ? (
 <span className="ap-ledger-editrow">
 <input className="adm-input" type={type} value={editValue} autoFocus min={type === 'number' ? 1 : undefined}
 aria-label={lbl}
 onChange={(e) => setEditValue(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
 <button type="button" className="ap-btn ap-btn--primary ap-btn--xs" onClick={saveEdit} disabled={savePending} aria-label="Desar">✓</button>
 <button type="button" className="ap-btn ap-btn--xs" onClick={cancelEdit} aria-label="Cancel·lar">✕</button>
 </span>
 ) : (
 <button type="button" className="ap-ledger-fact-val" onClick={() => startEdit(f)} aria-label={`Editar ${lbl}`}>
 {show(String(fields[f] ?? '')) || <em className="ap-ledger-empty">+</em>}
 </button>
 )}
 </div>
 ))}
 <div className="ap-ledger-fact">
 <span className="ap-ledger-fact-lbl">Durada</span>
 <span className="ap-ledger-fact-val ap-ledger-fact-val--ro">{durationLabel(fields.eventStartTime, fields.eventEndTime)}</span>
 </div>
 <div className="ap-ledger-fact">
 <span className="ap-ledger-fact-lbl">Prioritat</span>
 <span className={`ap-ledger-fact-val ap-ledger-fact-val--ro ap-ledger-pri--${lead.priority.toLowerCase()}`}>{PRIORITY_LABEL[lead.priority] || lead.priority}</span>
 </div>
 {lead.wx && (
 <div className="ap-ledger-fact">
 <span className="ap-ledger-fact-lbl">Temps</span>
 <span className="ap-ledger-fact-val ap-ledger-fact-val--ro ap-ledger-fact-wx">
 <WxBadge wx={lead.wx} size="sm" />
 {lead.dateISO && <span className="ap-ledger-fact-wxdate">{fullDate(lead.dateISO.slice(0, 10))}</span>}
 </span>
 </div>
 )}
 <div className="ap-ledger-fact ap-ledger-fact--value">
 <span className="ap-ledger-fact-lbl">Valor</span>
 {editField === 'budget' ? (
 <span className="ap-ledger-editrow">
 <input className="adm-input" type="number" min={0} value={editValue}
 aria-label="Valor del lead"
 onChange={(e) => setEditValue(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
 autoFocus />
 <button type="button" className="ap-btn ap-btn--primary ap-btn--xs" onClick={saveEdit} disabled={savePending} aria-label="Desar">✓</button>
 <button type="button" className="ap-btn ap-btn--xs" onClick={cancelEdit} aria-label="Cancel·lar">✕</button>
 </span>
 ) : (
 <button type="button" className="ap-ledger-fact-val ap-ledger-fact-val--big" onClick={() => startEdit('budget')} aria-label="Editar valor">
 {fields.budget
 ? formatCurrency(Number(fields.budget))
 : (() => {
 // Només un pressupost REALMENT enviat compta com a valor del lead;
 // un esborrany (DRAFT, sense sentAt) no és un valor real.
 const prop = proposals.find((p) => p.sentAt && Number.isFinite(p.total) && p.total > 0)?.total;
 return prop ? formatCurrency(prop) : <em className="ap-ledger-empty">Afegir</em>;
 })()}
 </button>
 )}
 </div>
 </div>

 {lead.lostReason && <p className="ap-ledger-hd-lost">{lead.lostReason}</p>}

 <div className="ap-ledger-phasebar" aria-label="Fase del lead">
 <div className="ap-ledger-stagepick">
 {PIPELINE_STAGES.map((s) => (
 <button key={s} type="button" data-stage={s}
 className={s === stage ? 'is-on' : ''}
 aria-current={s === stage ? 'step' : undefined}
 disabled={pending || s === stage || (s === 'guanyat' && !!lead.booking)}
 onClick={() => moveLead(s)}
 >
 <span className="ap-leads-dot" data-stage={s} />{STAGE_LABEL[s]}
 </button>
 ))}
 </div>
 <div className="ap-ledger-phaseright">
 {stage === 'perdut' && (
 <button type="button" className="ap-btn ap-btn--danger" onClick={handleDeleteLead}>Eliminar lead</button>
 )}
 <div className="ap-ledger-profitmanage" aria-label="Gestió del lead">
 <label className="ap-ledger-profitfield">
 <span>Responsable</span>
 <select className="adm-input" value={lead.owner ?? ''} onChange={(e) => saveAssignedTo(e.target.value)} aria-label="Responsable intern del lead">
 <option value="">Sense assignar</option>
 {TEAM_MEMBERS.map((m) => (
 <option key={m} value={m}>{m}</option>
 ))}
 {lead.owner && !TEAM_MEMBERS.includes(lead.owner as typeof TEAM_MEMBERS[number]) && (
 <option value={lead.owner}>{lead.owner}</option>
 )}
 </select>
 </label>
 <label className="ap-ledger-profitfield">
 <span>Derivat per</span>
 <select className="adm-input" value={lead.sourceCollaboratorId ?? ''} onChange={(e) => saveSourceCollaborator(e.target.value)} aria-label="Col·laborador que ha derivat el bolo">
 <option value="">Client directe</option>
 {referrers.map((c) => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </label>
 </div>
 </div>
 </div>

 <div className="ap-ledger-profitbar" aria-label="Marge del bolo i rendibilitat">
 <span className="ap-ledger-profitbar-title">
 {bookingEconomia ? 'Marge de la reserva' : 'Marge del bolo'}
 </span>
 {econ ? (
 <>
 <span className="ap-ledger-profitpill">
 <span>Cost serveis</span>
 <strong>{formatCurrency(econ.serviceLinesCost)}</strong>
 </span>
 <span className="ap-ledger-profitpill">
 <span>Operatiu</span>
 <strong>{formatCurrency(econ.fixedOperationalCost)}</strong>
 </span>
 <span className="ap-ledger-profitpill">
 <span>Cost origen</span>
 <strong>{formatCurrency(econ.acquisitionCost)}</strong>
 </span>
 <span className="ap-ledger-profitpill" data-tone={econ.tone}>
 <span>{bookingEconomia ? 'Net real' : 'Net estimat'}</span>
 <strong>{formatCurrency(econ.net)}</strong>
 </span>
 <span className="ap-ledger-profitpill" data-tone={econ.tone}>
 <span>Marge</span>
 <strong>{Math.round(econ.marginPct)}%</strong>
 </span>
 <span className="ap-ledger-profitpill" title={`El pack base inclou ${INCLUDED_TRAVEL_KM / 2} km per sentit des de Granollers. A partir d'aquí, cada ${TRAVEL_BLOCK_KM} km de més es cobren a ${TRAVEL_BLOCK_EUR} € i se sumen al pressupost per trams.`}>
 <span>Desplaçament</span>
 <strong>{INCLUDED_TRAVEL_KM / 2} km incl. · +{TRAVEL_BLOCK_EUR}€/{TRAVEL_BLOCK_KM}km</strong>
 </span>
 </>
 ) : (
 <span className="ap-ledger-profitpill">
 <span>Net estimat</span>
 <strong>pendent</strong>
 </span>
 )}
 </div>

 </section>

 {/* Àrea zenit CANÒNICA: igual per a TOTS els leads (com Cristina). El bolo
 ocupa tot l'ample. Els cobraments NO viuen al lead: es gestionen a la
 fitxa de reserva (accés des de l'històric comercial al peu). */}
 <div className="ap-ledger-zenith ap-ledger-zenith--solo">

 <main className="ap-ledger-zenith-main" aria-label="Configuració del bolo">
 <LeadBoloSection
 leadId={lead.id}
 documentContext={{
 name: lead.name,
 email: fields.email,
 phone: fields.phone,
 eventDate: fields.eventDate,
 eventStartTime: fields.eventStartTime,
 eventEndTime: fields.eventEndTime,
 eventLocation: fields.eventLocation,
 eventAddress: fields.eventAddress,
 guestCount: fields.guestCount,
 }}
 contractedProducts={lead.booking?.contractedProducts ?? []}
 source={lead.channel}
 vehicleCostPerKm={vehicleCostPerKm}
 initialDistanceKm={initialDistanceKm}
 onEconomiaChange={handleEconomia}
 compactEconomia
 />
 </main>
 </div>{/* /ap-ledger-zenith */}

 <CommercialDocumentsHistory
 items={documentHistoryItems}
 className="ap-ledger-document-history"
 />

 <ConfirmDialog {...dialogProps} />
 </div>
 );
}
