'use client';

import { useEffect, useState } from 'react';
import { useHubContext } from '../CustomerHubClient';
import { formatDateTime } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

type ConsentRecord = {
  id: string;
  consentType: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  source: string;
  consentVersion: string;
  createdAt: string;
};

type DataRequest = {
  id: string;
  requestType: string;
  status: string;
  description: string | null;
  legalDeadline: string | null;
  processedAt: string | null;
  createdAt: string;
};

const CONSENT_LABELS: Record<string, string> = {
  GDPR_BASIC: 'RGPD bàsic',
  MARKETING_EMAIL: 'Email màrqueting',
  MARKETING_SMS: 'SMS màrqueting',
  MARKETING_WHATSAPP: 'WhatsApp màrqueting',
  TERMS_OF_SERVICE: 'Termes de servei',
  PRIVACY_POLICY: 'Política privacitat',
  COOKIE_CONSENT: 'Cookies',
  COOKIE_ANALYTICS: 'Cookies analítiques',
  COOKIE_MARKETING: 'Cookies màrqueting',
  DATA_PROCESSING: 'Processament dades',
  THIRD_PARTY: 'Tercers',
  PROFILING: 'Perfilat',
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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendent', color: 'text-amber-300' },
  IDENTITY_REQUIRED: { label: 'Identitat pendent', color: 'text-orange-300' },
  VERIFIED: { label: 'Verificada', color: 'text-blue-300' },
  IN_PROGRESS: { label: 'En curs', color: 'text-cyan-300' },
  COMPLETED: { label: 'Completada', color: 'text-emerald-300' },
  REJECTED: { label: 'Rebutjada', color: 'text-red-300' },
  CANCELLED: { label: 'Cancel·lada', color: 'text-white/50' },
};

export default function PrivacyPanel() {
  const { customerId } = useHubContext();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/consents`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setConsents(data.consents || []);
          setRequests(data.requests || []);
        }
      } catch (err) {
        console.error('Error carregant privacitat:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  if (loading) {
    return (
      <div className="rounded-2xl border admin-card-glass p-5 animate-pulse">
        <div className="h-6 w-1/3 rounded bg-white/10" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  const handleExport = async (portable: boolean) => {
    setExporting(true);
    try {
      const res = await fetchWithCsrf(
        `/api/admin/customers/${customerId}/export?portable=${portable ? '1' : '0'}&download=1`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-data-${customerId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setExportMsg('Dades exportades correctament');
      } else {
        setExportMsg('Error exportant dades');
      }
    } catch (err) {
      console.error('Error exportant:', err);
      setExportMsg('Error de connexió');
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(null), 4000);
    }
  };

  const activeConsents = consents.filter((c) => c.granted && !c.revokedAt);
  const revokedConsents = consents.filter((c) => !c.granted || c.revokedAt);

  return (
    <div className="space-y-4">
      {/* Consentiments actius */}
      <div className="rounded-2xl border admin-card-glass p-5">
        <h2 className="text-lg font-semibold">Consentiments</h2>

        {activeConsents.length === 0 && revokedConsents.length === 0 && (
          <p className="mt-3 text-sm opacity-50">Cap consentiment registrat.</p>
        )}

        {activeConsents.length > 0 && (
          <div className="mt-3 space-y-2">
            {activeConsents.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <span className="text-sm font-medium">{CONSENT_LABELS[c.consentType] || c.consentType}</span>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                    Actiu
                  </span>
                  <p className="text-xs opacity-50 mt-0.5">
                    {c.source} · v{c.consentVersion}
                    {c.grantedAt && <> · {formatDateTime(c.grantedAt)}</>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {revokedConsents.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm opacity-60 hover:opacity-100 transition-opacity">
              Revocats / Inactius ({revokedConsents.length})
            </summary>
            <div className="mt-2 space-y-2">
              {revokedConsents.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border p-3 opacity-50">
                  <div>
                    <span className="text-sm font-medium">{CONSENT_LABELS[c.consentType] || c.consentType}</span>
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                      Revocat
                    </span>
                    <p className="text-xs opacity-50 mt-0.5">
                      {c.revokedAt && <>Revocat: {formatDateTime(c.revokedAt)}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Accions RGPD */}
      <div className="rounded-2xl border admin-card-glass p-5">
        <h2 className="text-lg font-semibold">Accions RGPD</h2>
        {exportMsg && (
          <p className="mt-2 text-sm rounded-xl border px-3 py-2">{exportMsg}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport(false)}
            disabled={exporting}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {exporting ? 'Exportant...' : 'Exportar dades (Art. 15)'}
          </button>
          <button
            type="button"
            onClick={() => handleExport(true)}
            disabled={exporting}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
          >
            Exportar portable (Art. 20)
          </button>
        </div>
      </div>

      {/* Sol·licituds ARCO */}
      <div className="rounded-2xl border admin-card-glass p-5">
        <h2 className="text-lg font-semibold">Sol·licituds de drets (ARCO)</h2>

        {requests.length === 0 ? (
          <p className="mt-3 text-sm opacity-50">Cap sol·licitud de drets registrada.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {requests.map((r) => {
              const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {REQUEST_TYPE_LABELS[r.requestType] || r.requestType}
                    </span>
                    <span className={`text-xs font-medium ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                    <span className="text-xs opacity-40">{formatDateTime(r.createdAt)}</span>
                  </div>
                  {r.description && (
                    <p className="mt-1 text-xs opacity-60">{r.description}</p>
                  )}
                  {r.legalDeadline && r.status !== 'COMPLETED' && r.status !== 'REJECTED' && (
                    <p className="mt-1 text-xs">
                      Deadline: {formatDateTime(r.legalDeadline)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
