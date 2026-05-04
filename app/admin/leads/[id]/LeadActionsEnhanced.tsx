'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { LEAD_STATUS_ACTION_OPTIONS } from '@/lib/constants';
import { ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS, getAdminLeadPackOptions } from '@/lib/constants/admin';
import { ADMIN_LEAD_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import LeadLostStatusPrompt from '../LeadLostStatusPrompt';
import { patchLeadStatus } from '../leadStatusClient';

interface Props {
  leadId: string;
  currentStatus: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  eventType: string;
  nurturingStep: number;
  lastNurturingAt?: string | null;
}

export default function LeadActionsEnhanced({ 
  leadId, 
  currentStatus, 
  clientName,
  clientEmail,
  clientPhone,
  eventType,
  nurturingStep,
  lastNurturingAt,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  const [statusBusy, setStatusBusy] = useState(false);
  const [showLostPrompt, setShowLostPrompt] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');

  // Pack options from packs-config (real prices)
  const PACK_OPTIONS = useMemo(() => getAdminLeadPackOptions(), []);

  // Quote generation state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState('manual');
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteHtml, setQuoteHtml] = useState<string | null>(null);
  const [manualSequenceStep, setManualSequenceStep] = useState(() => {
    const nextStep = Math.min(nurturingStep + 1, ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS.length);
    return String(nextStep);
  });
  const [manualSequenceRunning, setManualSequenceRunning] = useState(false);

  const selectedPackInfo = PACK_OPTIONS.find(p => p.value === selectedPack);
  const isManualMode = selectedPack === 'manual';
  const selectedManualSequenceOption = ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS.find(
    (option) => option.step === Number(manualSequenceStep),
  );
  const isLeadSequenceEligible = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'].includes(optimisticStatus);

  const parseCustomPrice = (): number | null => {
    const raw = customPriceInput.trim();
    if (!raw) return null;
    const normalized = raw.replace(/[€\s]/g, '').replace(',', '.');
    const value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value * 100) / 100;
  };

  const effectivePrice = isManualMode
    ? parseCustomPrice() ?? 0
    : parseCustomPrice() ?? selectedPackInfo?.price ?? 0;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === optimisticStatus || statusBusy) return;
    if (newStatus === 'LOST') {
      setShowLostPrompt(true);
      return;
    }

    setError(null);
    setSuccess(null);
    const previousStatus = optimisticStatus;
    setOptimisticStatus(newStatus);
    setStatusBusy(true);

    try {
      const payload = await patchLeadStatus({
        leadId,
        status: newStatus as 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON',
      });
      const customerId = payload?.lead?.customerId as string | undefined;

      setSuccess('Estat actualitzat!');
      startTransition(() => {
        if (newStatus === 'WON' && customerId) {
          router.push(`/admin/clientes/${customerId}`);
          return;
        }
        router.refresh();
      });

      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setOptimisticStatus(previousStatus);
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleLostConfirm = async () => {
    if (!lostReason || statusBusy) return;

    setError(null);
    setSuccess(null);
    const previousStatus = optimisticStatus;
    setOptimisticStatus('LOST');
    setStatusBusy(true);

    try {
      await patchLeadStatus({
        leadId,
        status: 'LOST',
        lostReason,
        note: lostNote,
      });

      setShowLostPrompt(false);
      setLostReason('');
      setLostNote('');
      setSuccess('Lead marcat com a perdut.');

      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setOptimisticStatus(previousStatus);
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleGenerateQuote = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: isManualMode ? 'flash' : selectedPack,
          customPrice: parseCustomPrice(),
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error generant pressupost');
      }

      setQuoteHtml(data.html);
      setSuccess(`Pressupost ${data.quoteNumber} generat! Total: ${data.total.toFixed(2)}€`);
      setOptimisticStatus('QUOTE_SENT');
      
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewQuote = () => {
    const params = new URLSearchParams();
    params.set('packId', isManualMode ? 'flash' : selectedPack);
    const customPrice = parseCustomPrice();
    if (typeof customPrice === 'number' && Number.isFinite(customPrice) && customPrice > 0) {
      params.set('customPrice', String(customPrice));
    }
    window.open(`/api/admin/leads/${leadId}/quote?${params.toString()}`, '_blank');
  };

  const handlePrintQuote = () => {
    if (quoteHtml) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(quoteHtml);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleRunManualSequence = async () => {
    setManualSequenceRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: Number(manualSequenceStep) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.summary) {
        throw new Error(data?.error || 'No s’ha pogut executar la seqüència manual');
      }

      const summary = data.summary as { channel: string; step: number; totalSteps: number; nurturingDone: boolean };
      setSuccess(
        `Seqüència enviada: pas ${summary.step}/${summary.totalSteps} per ${summary.channel === 'whatsapp' ? 'WhatsApp' : 'correu'}${summary.nurturingDone ? ' · cadència completada' : ''}`,
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setManualSequenceRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canviar Estat */}
      <section className="ap-card p-6">
        <h3 className="text-sm font-semibold mb-4">📊 Canviar estat</h3>

        {error && (
          <div className="ap-card admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger mb-4 p-3 text-sm" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="ap-card admin-tone-border-success admin-tone-bg-success admin-tone-text-success mb-4 p-3 text-sm" role="status">
            {success}
          </div>
        )}

        <div className="space-y-2">
          {LEAD_STATUS_ACTION_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              disabled={isPending || statusBusy || status.value === optimisticStatus}
              type="button"
              aria-pressed={status.value === optimisticStatus}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-colors ${
                status.value === optimisticStatus
                  ? 'admin-tone-border-info admin-tone-bg-info border-2 font-medium'
                  : 'admin-tone-border-neutral admin-tone-bg-neutral border hover:brightness-105'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-lg">{status.icon}</span>
              <span className={`w-3 h-3 rounded-full ${status.tone}`} />
              <span >
                {status.label}
              </span>
              {status.value === optimisticStatus && (
                <span className="ml-auto text-xs">Actual</span>
              )}
            </button>
          ))}
        </div>

        <LeadLostStatusPrompt
          open={showLostPrompt}
          lostReason={lostReason}
          note={lostNote}
          saving={isPending || statusBusy}
          title="Per tancar el lead com a perdut cal registrar el motiu comercial."
          confirmLabel="Confirmar pèrdua"
          onLostReasonChange={setLostReason}
          onNoteChange={setLostNote}
          onCancel={() => {
            setShowLostPrompt(false);
            setLostReason('');
            setLostNote('');
          }}
          onConfirm={handleLostConfirm}
        />
      </section>

      <section className="ap-card p-6">
        <h3 className="text-sm font-semibold mb-4">🔗 Seqüència manual</h3>
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-white/10 p-3">
            <p className="font-medium">Pas actual de nurturing</p>
            <p className="mt-1 opacity-80">
              {Math.min(nurturingStep, ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS.length)}/{ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS.length}
              {lastNurturingAt ? ` · últim enviament registrat` : ' · encara sense enviaments'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2">Pas a enviar ara</label>
            <select
              value={manualSequenceStep}
              onChange={(e) => setManualSequenceStep(e.target.value)}
              disabled={!isLeadSequenceEligible || manualSequenceRunning}
              className="ap-input w-full px-3 py-2 text-sm"
            >
              {ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS.map((option) => (
                <option key={option.step} value={option.step}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedManualSequenceOption && (
              <p className="mt-2 text-xs opacity-70">
                Envia el pas {selectedManualSequenceOption.step} ara mateix, sense esperar la cadència automàtica.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRunManualSequence}
            disabled={!isLeadSequenceEligible || manualSequenceRunning}
            aria-busy={manualSequenceRunning}
            className="ap-btn ap-btn--secondary w-full disabled:opacity-50"
          >
            {manualSequenceRunning ? 'Executant seqüència...' : 'Executar seqüència manual'}
          </button>

          {!isLeadSequenceEligible && (
            <p className="text-xs admin-tone-text-warning">
              La seqüència manual només està disponible per leads actius (`NEW`, `CONTACTED`, `QUOTE_SENT`, `NEGOTIATING`).
            </p>
          )}
        </div>
      </section>

      {/* Generar Pressupost */}
      <section className="ap-card p-6">
        <h3 className="text-sm font-semibold mb-4">📄 Pressupost</h3>
        
        <div className="space-y-4">
          {/* Selector de Pack */}
          <div>
            <label className="block text-xs font-medium mb-2">
              Selecciona Pack
            </label>
            <select
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              className="ap-input w-full px-3 py-2 text-sm"
            >
              {PACK_OPTIONS.map((pack) => (
                <option key={pack.value} value={pack.value}>
                  {pack.value === 'manual'
                    ? pack.label
                    : `${pack.label} - ${pack.price}€ (${pack.hours}h)`}
                </option>
              ))}
            </select>
          </div>

          {/* Preu personalitzat */}
          <div>
            <label className="block text-xs font-medium mb-2">
              Preu personalitzat {isManualMode ? '(obligatori)' : '(opcional)'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={customPriceInput}
              onChange={(e) => setCustomPriceInput(e.target.value)}
              placeholder={
                isManualMode
                  ? 'Ex: 200 o 200,00'
                  : `${selectedPackInfo?.price}€ (per defecte). Ex: 200 o 200,00`
              }
              disabled={!isManualMode}
              className="ap-input w-full px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>

          {/* Resum */}
          <div className="p-3 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="">Base:</span>
              <span className="font-medium">{effectivePrice}€</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="">IVA (21%):</span>
              <span className="font-medium">{(effectivePrice * 0.21).toFixed(2)}€</span>
            </div>
            <div className="admin-tone-border-neutral mt-2 flex justify-between border-t pt-2 text-sm">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">{(effectivePrice * 1.21).toFixed(2)}€</span>
            </div>
          </div>

          {/* Botons */}
          <div className="flex gap-2">
            <button
              onClick={handlePreviewQuote}
              disabled={isManualMode && effectivePrice <= 0}
              type="button"
              className="ap-btn ap-btn--secondary flex-1 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              👁️ Vista prèvia
            </button>
            <button
              onClick={handleGenerateQuote}
              disabled={isGenerating || (isManualMode && effectivePrice <= 0)}
              type="button"
              aria-busy={isGenerating}
              className="ap-btn ap-btn--primary flex-1 px-4 py-2 text-sm disabled:opacity-50"
            >
              {isGenerating ? '⏳ Generant...' : '📤 Genera'}
            </button>
          </div>

          {quoteHtml && (
            <button
              onClick={handlePrintQuote}
              type="button"
              className="ap-btn ap-btn--secondary w-full px-4 py-2 text-sm"
            >
              🖨️ Imprimir / Descarregar PDF
            </button>
          )}
        </div>
      </section>

      {/* Accions Ràpides */}
      <section className="ap-card p-6">
        <h3 className="text-sm font-semibold mb-4">⚡ Accions ràpides</h3>
        
        <div className="space-y-2">
          {clientPhone && (
            <a
              href={`https://wa.me/${clientPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                `Hola ${clientName}! Sóc de Òrbita Events. He preparat el pressupost per al teu event, te l'envio ara mateix 📄✨`
              )}`}
              target="_blank" rel="noopener noreferrer"
              className="ap-btn ap-btn--primary flex w-full items-center gap-3 px-4 py-3"
            >
              <span className="text-xl">💬</span>
              <div className="text-left">
                <div className="font-medium">WhatsApp</div>
                <div className="text-xs opacity-80">Envia pressupost</div>
              </div>
            </a>
          )}
          
          <a
            href={`mailto:${clientEmail}?subject=${encodeURIComponent(`Pressupost Òrbita Events - ${eventType}`)}&body=${encodeURIComponent(
              `Hola ${clientName},\n\nGràcies pel teu interès en Òrbita Events! Adjunto el pressupost per al teu event.\n\nQualsevol dubte, estic a la teva disposició.\n\nSalutacions,\nÒrbita Events\n${clientPhone ? `📱 ${clientPhone}` : ''}`
            )}`}
            className="ap-btn ap-btn--primary flex w-full items-center gap-3 px-4 py-3"
          >
            <span className="text-xl">✉️</span>
            <div className="text-left">
                <div className="font-medium">Correu</div>
                <div className="text-xs opacity-80">Envia pressupost per correu</div>
            </div>
          </a>

          {clientPhone && (
            <a
              href={`tel:${clientPhone}`}
              className="ap-btn ap-btn--secondary flex w-full items-center gap-3 px-4 py-3"
            >
              <span className="text-xl">📞</span>
              <div className="text-left">
                <div className="font-medium">Trucar</div>
                <div className="text-xs opacity-80">{clientPhone}</div>
              </div>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}





