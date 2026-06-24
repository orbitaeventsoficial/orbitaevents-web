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
      <div className="ch__privacy-card ch__privacy-loading">
        <div className="ch__privacy-skeleton ch__privacy-skeleton--title" />
        <div className="ch__privacy-list">
          {[1, 2, 3].map((i) => <div key={i} className="ch__privacy-skeleton ch__privacy-skeleton--row" />)}
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
    <div className="ch__privacy-stack" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.root)}>
      <div className="ch__privacy-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.consents)}>
        <h2 className="ch__privacy-title">Consentiments</h2>

        {activeConsents.length === 0 && revokedConsents.length === 0 && <p className="ch__privacy-empty">Cap consentiment registrat.</p>}

        {activeConsents.length > 0 && (
          <div className="ch__privacy-list">
            {activeConsents.map((c) => (
              <div key={c.id} className="ch__privacy-row">
                <div>
                  <span className="ch__privacy-name">{getPrivacyConsentLabel(c.consentType)}</span>
                  <span className="ch__privacy-badge ch__privacy-badge--active">Actiu</span>
                  <p className="ch__privacy-meta">{c.source} · v{c.consentVersion}{c.grantedAt && <> · {formatDateTime(c.grantedAt)}</>}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {revokedConsents.length > 0 && (
          <details className="ch__privacy-details">
            <summary className="ch__privacy-summary">Revocats / Inactius ({revokedConsents.length})</summary>
            <div className="ch__privacy-list">
              {revokedConsents.map((c) => (
                <div key={c.id} className="ch__privacy-row ch__privacy-row--muted">
                  <div>
                    <span className="ch__privacy-name">{getPrivacyConsentLabel(c.consentType)}</span>
                    <span className="ch__privacy-badge ch__privacy-badge--revoked">Revocat</span>
                    <p className="ch__privacy-meta">{c.revokedAt && <>Revocat: {formatDateTime(c.revokedAt)}</>}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="ch__privacy-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.gdprActions)}>
        <h2 className="ch__privacy-title">Accions RGPD</h2>
        {exportMsg && <p className="ch__privacy-message">{exportMsg}</p>}
        <div className="ch__privacy-actions">
          <button
            type="button"
            onClick={() => handleExport(false)}
            disabled={exporting}
            className="ch__privacy-button"
            {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.exportFull)}
          >
            {exporting ? 'Exportant...' : 'Exportar dades (Art. 15)'}
          </button>
          <button
            type="button"
            onClick={() => handleExport(true)}
            disabled={exporting}
            className="ch__privacy-button"
            {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.exportPortable)}
          >
            Exportar portable (Art. 20)
          </button>
        </div>
      </div>

      <div className="ch__privacy-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.privacy.requests)}>
        <h2 className="ch__privacy-title">Sol·licituds de drets (ARCO)</h2>

        {requests.length === 0 ? (
          <p className="ch__privacy-empty">Cap sol·licitud de drets registrada.</p>
        ) : (
          <div className="ch__privacy-list">
            {requests.map((r) => {
              const statusCfg = getPrivacyRequestStatusDisplay(r.status);
              return (
                <div key={r.id} className="ch__privacy-row">
                  <div className="ch__privacy-row-head">
                    <span className="ch__privacy-name">{getPrivacyRequestTypeLabel(r.requestType)}</span>
                    <span className={`ch__privacy-status ${statusCfg.color}`}>{statusCfg.label}</span>
                    <span className="ch__privacy-date">{formatDateTime(r.createdAt)}</span>
                  </div>
                  {r.description && <p className="ch__privacy-description">{r.description}</p>}
                  {r.legalDeadline && r.status !== 'COMPLETED' && r.status !== 'REJECTED' && <p className="ch__privacy-deadline">Deadline: {formatDateTime(r.legalDeadline)}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
