'use client';

import { useEffect, useState } from 'react';
import { useHubContext } from '../CustomerHubClient';
import { formatDateTime } from '@/lib/constants';
import { getPrivacyConsentLabel, getPrivacyRequestStatusDisplay, getPrivacyRequestTypeLabel } from '@/lib/constants/privacy';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { log } from '@/lib/logger';

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

const CARD = 'rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--panel)] p-5';
const TITLE = 'm-0 font-[var(--display)] text-lg font-bold leading-tight tracking-[-0.01em] text-[var(--t)]';
const ROW = 'flex items-center justify-between gap-3 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-3';
const NAME = 'text-sm font-semibold text-[var(--t)]';
const BADGE = 'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs leading-tight';
const META = 'm-0 mt-0.5 text-xs leading-snug text-[var(--t3)]';

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
          setConsents(data.body?.consents || []);
          setRequests(data.body?.requests || []);
        }
      } catch (err) {
        log.error('Error carregant privacitat', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  if (loading) {
    return (
      <div className={CARD}>
        <div className="skeleton h-6 w-1/3 rounded-[var(--o-r-xl)]" />
        <div className="mt-3 flex flex-col gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-[var(--o-r-xl)]" />)}
        </div>
      </div>
    );
  }

  const handleExport = async (portable: boolean) => {
    setExporting(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/customers/${customerId}/export?portable=${portable ? '1' : '0'}&download=1`, { cache: 'no-store' });
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
      log.error('Error exportant', err);
      setExportMsg('Error de connexió');
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(null), 4000);
    }
  };

  const activeConsents = consents.filter((c) => c.granted && !c.revokedAt);
  const revokedConsents = consents.filter((c) => !c.granted || c.revokedAt);

  return (
    <div className="flex flex-col gap-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.root)}>
      <div className={CARD} {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.consents)}>
        <h2 className={TITLE}>Consentiments</h2>

        {activeConsents.length === 0 && revokedConsents.length === 0 && <p className="m-0 mt-3 text-sm leading-snug text-[var(--t2)]">Cap consentiment registrat.</p>}

        {activeConsents.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {activeConsents.map((c) => (
              <div key={c.id} className={ROW}>
                <div>
                  <span className={NAME}>{getPrivacyConsentLabel(c.consentType)}</span>
                  <span className={`${BADGE} bg-[var(--ax-success-bg)] text-[var(--o-success)]`}>Actiu</span>
                  <p className={META}>{c.source} · v{c.consentVersion}{c.grantedAt && <> · {formatDateTime(c.grantedAt)}</>}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {revokedConsents.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-[var(--t2)] transition-colors hover:text-[var(--t)]">Revocats / Inactius ({revokedConsents.length})</summary>
            <div className="mt-3 flex flex-col gap-2">
              {revokedConsents.map((c) => (
                <div key={c.id} className={`${ROW} opacity-[0.58]`}>
                  <div>
                    <span className={NAME}>{getPrivacyConsentLabel(c.consentType)}</span>
                    <span className={`${BADGE} bg-[var(--ax-fill-3)] text-[var(--t3)]`}>Revocat</span>
                    <p className={META}>{c.revokedAt && <>Revocat: {formatDateTime(c.revokedAt)}</>}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className={CARD} {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.gdprActions)}>
        <h2 className={TITLE}>Accions RGPD</h2>
        {exportMsg && <p className="m-0 mt-3 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] px-3 py-2 text-sm leading-snug text-[var(--t2)]">{exportMsg}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport(false)}
            disabled={exporting}
            className="ap-btn"
            {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.exportFull)}
          >
            {exporting ? 'Exportant...' : 'Exportar dades (Art. 15)'}
          </button>
          <button
            type="button"
            onClick={() => handleExport(true)}
            disabled={exporting}
            className="ap-btn"
            {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.exportPortable)}
          >
            Exportar portable (Art. 20)
          </button>
        </div>
      </div>

      <div className={CARD} {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.requests)}>
        <h2 className={TITLE}>Sol·licituds de drets (ARCO)</h2>

        {requests.length === 0 ? (
          <p className="m-0 mt-3 text-sm leading-snug text-[var(--t2)]">Cap sol·licitud de drets registrada.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {requests.map((r) => {
              const statusCfg = getPrivacyRequestStatusDisplay(r.status);
              return (
                <div key={r.id} className="rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={NAME}>{getPrivacyRequestTypeLabel(r.requestType)}</span>
                    <span className={`text-xs font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
                    <span className={META}>{formatDateTime(r.createdAt)}</span>
                  </div>
                  {r.description && <p className="m-0 mt-1 text-xs leading-snug text-[var(--t2)]">{r.description}</p>}
                  {r.legalDeadline && r.status !== 'COMPLETED' && r.status !== 'REJECTED' && <p className="m-0 mt-1 text-xs leading-snug text-[var(--o-warning)]">Deadline: {formatDateTime(r.legalDeadline)}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
