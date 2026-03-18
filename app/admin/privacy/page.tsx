'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from '../components/AdminPage';
import { formatDateTime } from '@/lib/constants';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';

type PrivacyStats = {
  consents: { total: number; active: number };
  requests: { pending: number; completed: number; urgent: number };
};

type DataRequest = {
  id: string;
  requestType: string;
  status: string;
  priority: string;
  description: string | null;
  legalDeadline: string | null;
  processedAt: string | null;
  processedBy: string | null;
  responseNotes: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string } | null;
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: 'Accés',
  RECTIFICATION: 'Rectificació',
  ERASURE: 'Supressió',
  RESTRICTION: 'Limitació',
  PORTABILITY: 'Portabilitat',
  OBJECTION: 'Oposició',
  AUTOMATED: 'Decisions automatitzades',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendent', bg: 'bg-amber-500/20', text: 'text-amber-300' },
  IDENTITY_REQUIRED: { label: 'Identitat pendent', bg: 'bg-orange-500/20', text: 'text-orange-300' },
  VERIFIED: { label: 'Verificada', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  IN_PROGRESS: { label: 'En curs', bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
  COMPLETED: { label: 'Completada', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  REJECTED: { label: 'Rebutjada', bg: 'bg-red-500/20', text: 'text-red-300' },
  CANCELLED: { label: 'Cancel·lada', bg: 'bg-white/10', text: 'text-white/50' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'Alta', color: 'text-red-400' },
  MEDIUM: { label: 'Mitjana', color: 'text-amber-400' },
  LOW: { label: 'Baixa', color: 'text-white/50' },
};

type AuditLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  reason: string | null;
  legalBasis: string | null;
  affectedFields: string[];
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  DATA_ACCESSED: 'Dades consultades',
  DATA_EXPORTED: 'Dades exportades',
  DATA_CREATED: 'Dades creades',
  DATA_UPDATED: 'Dades actualitzades',
  DATA_DELETED: 'Dades eliminades',
  DATA_ANONYMIZED: 'Dades anonimitzades',
  CONSENT_GRANTED: 'Consentiment atorgat',
  CONSENT_REVOKED: 'Consentiment revocat',
  ACCOUNT_DELETED: 'Compte eliminat',
  RETENTION_APPLIED: 'Retenció aplicada',
};

type ConsentRecord = {
  id: string;
  consentType: string;
  granted: boolean;
  consentVersion: string;
  source: string;
  email: string | null;
  grantedAt: string;
  revokedAt: string | null;
  customer: { id: string; name: string; email: string } | null;
};

const CONSENT_TYPE_LABELS: Record<string, string> = {
  GDPR_BASIC: 'RGPD Bàsic',
  MARKETING_EMAIL: 'Màrqueting email',
  MARKETING_SMS: 'Màrqueting SMS',
  MARKETING_WHATSAPP: 'Màrqueting WhatsApp',
  PROFILING: 'Perfilatge',
  THIRD_PARTY: 'Tercers',
  COOKIES_ANALYTICS: 'Cookies analítica',
  COOKIES_MARKETING: 'Cookies màrqueting',
  COOKIES_FUNCTIONAL: 'Cookies funcionals',
  TESTIMONIAL_PUBLIC: 'Testimoni públic',
  PHOTO_USAGE: 'Ús de fotos',
};

type StatusFilter = 'all' | 'pending' | 'completed';
type ConsentFilter = 'active' | 'revoked' | 'all';
type PageTab = 'requests' | 'consents' | 'audit';

export default function AdminPrivacyPage() {
  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [processNotes, setProcessNotes] = useState<Record<string, string>>({});
  const [pageTab, setPageTab] = useState<PageTab>('requests');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [consentsTotal, setConsentsTotal] = useState(0);
  const [consentsLoading, setConsentsLoading] = useState(false);
  const [consentFilter, setConsentFilter] = useState<ConsentFilter>('active');
  const [consentSearch, setConsentSearch] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetchWithCsrf('/api/admin/privacy/audit?limit=100', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.data || []);
      }
    } catch (err) {
      console.error('Error carregant audit log:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const loadConsents = useCallback(async () => {
    setConsentsLoading(true);
    try {
      const params = new URLSearchParams({ status: consentFilter, limit: '50' });
      if (consentSearch) params.set('q', consentSearch);
      const res = await fetchWithCsrf(`/api/admin/privacy/consents?${params}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setConsents(data.data?.items || []);
        setConsentsTotal(data.data?.total || 0);
      }
    } catch (err) {
      console.error('Error carregant consentiments:', err);
    } finally {
      setConsentsLoading(false);
    }
  }, [consentFilter, consentSearch]);

  const revokeConsentAction = async (consentId: string) => {
    setRevokingId(consentId);
    try {
      const res = await fetchWithCsrf('/api/admin/privacy/consents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentId, reason: 'Revocat per admin' }),
      });
      if (res.ok) {
        setActionMsg('Consentiment revocat correctament');
        setTimeout(() => setActionMsg(null), 4000);
        await loadConsents();
        // Recarregar stats
        const statsRes = await fetchWithCsrf('/api/admin/privacy/stats', { cache: 'no-store' });
        if (statsRes.ok) { const d = await statsRes.json(); setStats(d.data); }
      }
    } catch (err) {
      console.error('Error revocant consentiment:', err);
      setActionMsg('Error revocant consentiment');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setRevokingId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reqRes] = await Promise.all([
        fetchWithCsrf('/api/admin/privacy/stats', { cache: 'no-store' }),
        fetchWithCsrf(`/api/admin/privacy/requests?status=${statusFilter === 'pending' ? 'VERIFIED' : statusFilter === 'completed' ? 'COMPLETED' : 'all'}`, { cache: 'no-store' }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error('Error carregant dades privacitat:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (pageTab === 'requests') load();
    else if (pageTab === 'consents') loadConsents();
    else loadAudit();
  }, [load, loadAudit, loadConsents, pageTab]);

  const processRequest = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      const res = await fetchWithCsrf(`/api/admin/privacy/requests/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: processNotes[id] || '' }),
      });
      if (res.ok) {
        setActionMsg(action === 'approve' ? 'Sol·licitud processada correctament' : 'Sol·licitud rebutjada');
        setTimeout(() => setActionMsg(null), 4000);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionMsg(data?.error || 'Error processant sol·licitud');
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch {
      console.error('Error processant sol·licitud');
      setActionMsg('Error de connexió');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setBusyId(null);
    }
  };

  function getDaysUntilDeadline(deadline: string | null): number | null {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div>Carregant dades de privacitat...</div>
      </div>
    );
  }

  return (
    <AdminPage
      title="Privacitat i RGPD"
      subtitle="Sol·licituds ARCO, consentiments i compliment legal."
    >
      {/* KPI cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border admin-card-glass p-4">
            <p className="text-2xl font-bold">{stats.consents.total}</p>
            <p className="text-xs opacity-60">Consentiments totals</p>
          </div>
          <div className="rounded-2xl border admin-card-glass p-4">
            <p className="text-2xl font-bold">{stats.consents.active}</p>
            <p className="text-xs opacity-60">Consentiments actius</p>
          </div>
          <div className="rounded-2xl border admin-card-glass p-4">
            <p className="text-2xl font-bold">{stats.requests.pending}</p>
            <p className="text-xs opacity-60">Sol·licituds pendents</p>
          </div>
          <div className="rounded-2xl border admin-card-glass p-4">
            <p className="text-2xl font-bold">{stats.requests.completed}</p>
            <p className="text-xs opacity-60">Completades</p>
          </div>
          <div className={`rounded-2xl border p-4 ${stats.requests.urgent > 0 ? 'border-red-500/30 bg-red-500/5' : 'admin-card-glass'}`}>
            <p className={`text-2xl font-bold ${stats.requests.urgent > 0 ? 'text-red-400' : ''}`}>{stats.requests.urgent}</p>
            <p className="text-xs opacity-60">Urgents (&lt;5 dies)</p>
          </div>
        </div>
      )}

      {/* Action message */}
      {actionMsg && (
        <div className="rounded-xl border px-4 py-2 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Page tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setPageTab('requests')}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            pageTab === 'requests' ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white/5'
          }`}
        >
          Sol·licituds ARCO
        </button>
        <button
          type="button"
          onClick={() => setPageTab('consents')}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            pageTab === 'consents' ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white/5'
          }`}
        >
          Consentiments
        </button>
        <button
          type="button"
          onClick={() => setPageTab('audit')}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            pageTab === 'audit' ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white/5'
          }`}
        >
          Registre d&apos;auditoria
        </button>
      </div>

      {pageTab === 'requests' && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2">
            {([
              { key: 'pending' as const, label: 'Pendents / Verificades' },
              { key: 'completed' as const, label: 'Completades' },
              { key: 'all' as const, label: 'Totes' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`admin-reviews-tab px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  statusFilter === key
                    ? 'admin-reviews-tab--active'
                    : 'admin-reviews-tab--idle'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Requests list */}
      {pageTab === 'requests' && (
      <div className="space-y-4">
        {requests.length === 0 && !loading && (
          <div className="rounded-2xl border admin-card-glass p-6 text-center opacity-60">
            No hi ha sol·licituds amb aquest filtre.
          </div>
        )}

        {requests.map((r) => {
          const daysLeft = getDaysUntilDeadline(r.legalDeadline);
          const isUrgent = daysLeft !== null && daysLeft <= 5;
          const isOverdue = daysLeft !== null && daysLeft < 0;
          const canProcess = r.status === 'VERIFIED';
          const priorityCfg = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG.MEDIUM;
          const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;

          return (
            <div
              key={r.id}
              className={`rounded-2xl border p-5 transition-colors ${
                isOverdue ? 'border-red-500/30 bg-red-500/5' : isUrgent ? 'border-amber-500/20 bg-amber-500/5' : 'admin-card-glass'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold">
                      {REQUEST_TYPE_LABELS[r.requestType] || r.requestType}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                    <span className={`text-xs font-medium ${priorityCfg.color}`}>
                      {priorityCfg.label}
                    </span>
                  </div>
                  {r.customer && (
                    <div className="mt-1">
                      <Link href={`/admin/clientes/${r.customer.id}`} className="text-sm hover:underline">
                        {r.customer.name}
                      </Link>
                      <span className="text-sm opacity-50 ml-2">{r.customer.email}</span>
                    </div>
                  )}
                  {r.description && (
                    <p className="mt-2 text-sm opacity-70 whitespace-pre-wrap">{r.description}</p>
                  )}
                </div>

                {/* Deadline */}
                <div className="text-right shrink-0">
                  <div className="text-xs opacity-50">{formatDateTime(r.createdAt)}</div>
                  {r.legalDeadline && (
                    <div className={`mt-1 text-xs font-medium ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'opacity-60'}`}>
                      {isOverdue
                        ? `Vençuda fa ${Math.abs(daysLeft!)} dies`
                        : daysLeft === 0
                          ? 'Venç AVUI'
                          : `${daysLeft} dies restants`}
                    </div>
                  )}
                </div>
              </div>

              {/* Completed info */}
              {r.status === 'COMPLETED' && r.processedAt && (
                <div className="mt-3 rounded-xl border px-4 py-2 text-sm">
                  Processada el {formatDateTime(r.processedAt)}
                  {r.processedBy && <span className="opacity-60"> per {r.processedBy}</span>}
                  {r.responseNotes && <p className="mt-1 opacity-70">{r.responseNotes}</p>}
                </div>
              )}

              {r.status === 'REJECTED' && r.processedAt && (
                <div className="mt-3 rounded-xl border px-4 py-2 text-sm">
                  Rebutjada el {formatDateTime(r.processedAt)}
                  {r.responseNotes && <p className="mt-1 opacity-70">{r.responseNotes}</p>}
                </div>
              )}

              {/* Process actions */}
              {canProcess && (
                <div className="mt-4 space-y-3">
                  <textarea
                    placeholder="Notes (opcional)..."
                    value={processNotes[r.id] || ''}
                    onChange={(e) => setProcessNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-full rounded-xl border bg-white/5 px-4 py-2 text-sm  resize-none"
                    rows={2}
                    aria-label="Notes per a la sol·licitud"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => processRequest(r.id, 'approve')}
                      disabled={busyId === r.id}
                      className="px-4 py-2 rounded-full border text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {busyId === r.id ? 'Processant...' : 'Aprovar i processar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => processRequest(r.id, 'reject')}
                      disabled={busyId === r.id}
                      className="px-4 py-2 rounded-full border text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Rebutjar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Consents tab */}
      {pageTab === 'consents' && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              {([
                { key: 'active' as const, label: 'Actius' },
                { key: 'revoked' as const, label: 'Revocats' },
                { key: 'all' as const, label: 'Tots' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setConsentFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    consentFilter === key ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1">
              <input
                type="search"
                placeholder="Cercar per nom o email..."
                value={consentSearch}
                onChange={(e) => setConsentSearch(e.target.value)}
                aria-label="Cercar consentiments"
                className="w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <span className="text-sm opacity-50">{consentsTotal} registres</span>
          </div>

          {/* Consents list */}
          <div className="space-y-3">
            {consentsLoading ? (
              <div className="rounded-2xl border admin-card-glass p-6 text-center opacity-60">
                Carregant consentiments...
              </div>
            ) : consents.length === 0 ? (
              <div className="rounded-2xl border admin-card-glass p-6 text-center opacity-60">
                No hi ha consentiments amb aquest filtre.
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <section className="lg:hidden space-y-3">
                  {consents.map((c) => (
                    <article key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {c.customer?.name || c.email || 'Desconegut'}
                          </p>
                          <p className="text-xs mt-0.5 truncate opacity-60">
                            {c.customer?.email || c.email}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          c.revokedAt ? 'bg-red-500/20 text-red-300' : 'admin-tone-soft-success'
                        }`}>
                          {c.revokedAt ? 'Revocat' : 'Actiu'}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-full bg-white/5 px-2.5 py-0.5">
                            {CONSENT_TYPE_LABELS[c.consentType] || c.consentType}
                          </span>
                          <span className="opacity-50">{c.source}</span>
                          <span className="opacity-50">{formatDateTime(c.grantedAt)}</span>
                        </div>
                        {!c.revokedAt && (
                          <button
                            type="button"
                            onClick={() => revokeConsentAction(c.id)}
                            disabled={revokingId === c.id}
                            className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition-colors min-h-[44px] disabled:opacity-50"
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </section>

                {/* Desktop table */}
                <div className="hidden lg:block rounded-2xl border overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm" aria-label="Llistat de consentiments">
                    <thead>
                      <tr className="border-b bg-white/[0.03]">
                        <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Client</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Tipus</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Font</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Versió</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Atorgat</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Estat</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium opacity-70">Accions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {consents.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3">
                            {c.customer ? (
                              <Link href={`/admin/clientes/${c.customer.id}`} className="hover:underline">
                                <p className="font-medium">{c.customer.name}</p>
                                <p className="text-xs opacity-50">{c.customer.email}</p>
                              </Link>
                            ) : (
                              <p className="text-sm opacity-70">{c.email || 'Desconegut'}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs">
                              {CONSENT_TYPE_LABELS[c.consentType] || c.consentType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs opacity-60">{c.source}</td>
                          <td className="px-4 py-3 text-xs opacity-60">{c.consentVersion}</td>
                          <td className="px-4 py-3 text-xs opacity-60">{formatDateTime(c.grantedAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              c.revokedAt ? 'bg-red-500/20 text-red-300' : 'admin-tone-soft-success'
                            }`}>
                              {c.revokedAt ? `Revocat ${formatDateTime(c.revokedAt)}` : 'Actiu'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!c.revokedAt && (
                              <button
                                type="button"
                                onClick={() => revokeConsentAction(c.id)}
                                disabled={revokingId === c.id}
                                className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              >
                                {revokingId === c.id ? 'Revocant...' : 'Revocar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Audit log */}
      {pageTab === 'audit' && (
        <div className="space-y-3">
          {auditLoading ? (
            <div className="rounded-2xl border admin-card-glass p-6 text-center opacity-60">
              Carregant registre d&apos;auditoria...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="rounded-2xl border admin-card-glass p-6 text-center opacity-60">
              Cap registre d&apos;auditoria trobat.
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm" aria-label="Registre d'auditoria de privacitat">
                <thead>
                  <tr className="border-b bg-white/[0.03]">
                    <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Acció</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Entitat</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium opacity-70 hidden sm:table-cell">Actor</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium opacity-70 hidden md:table-cell">Motiu</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium opacity-70">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{ACTION_LABELS[log.action] || log.action}</span>
                        {log.legalBasis && (
                          <p className="text-xs opacity-40 mt-0.5">{log.legalBasis}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs opacity-70">{log.entityType}</span>
                        <p className="text-xs opacity-40 truncate max-w-[150px]">{log.entityId}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs opacity-60">{log.performedBy || 'SYSTEM'}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs opacity-60 truncate max-w-[200px] block">{log.reason || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs opacity-60">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RGPD info box */}
      <details className="rounded-2xl border admin-card-glass p-4">
        <summary className="cursor-pointer text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">
          Informació RGPD — Articles aplicables
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm opacity-70">
          <div className="rounded-xl border p-3">
            <p className="font-semibold">Art. 15 — Accés</p>
            <p className="text-xs mt-1">El client pot obtenir còpia de totes les dades personals.</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="font-semibold">Art. 16 — Rectificació</p>
            <p className="text-xs mt-1">Corregir dades inexactes o incompletes.</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="font-semibold">Art. 17 — Supressió</p>
            <p className="text-xs mt-1">Dret a l&apos;oblit: eliminar dades personals.</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="font-semibold">Art. 18 — Limitació</p>
            <p className="text-xs mt-1">Restringir el tractament en certs supòsits.</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="font-semibold">Art. 20 — Portabilitat</p>
            <p className="text-xs mt-1">Rebre dades en format estructurat i portable.</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="font-semibold">Art. 21 — Oposició</p>
            <p className="text-xs mt-1">Oposar-se al tractament per màrqueting directe.</p>
          </div>
        </div>
      </details>
    </AdminPage>
  );
}



