'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  leadId: string;
  currentStatus: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  eventType: string;
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nou Lead', color: 'bg-blue-500', icon: '🆕' },
  { value: 'CONTACTED', label: 'Contactat', color: 'bg-yellow-500', icon: '📞' },
  { value: 'QUOTE_SENT', label: 'Pressupost enviat', color: 'bg-purple-500', icon: '📄' },
  { value: 'NEGOTIATING', label: 'En negociació', color: 'bg-orange-500', icon: '🤝' },
  { value: 'WON', label: 'Guanyat!', color: 'bg-green-500', icon: '✅' },
  { value: 'LOST', label: 'Perdut', color: 'bg-gray-400', icon: '❌' },
];

const PACK_OPTIONS = [
  { value: 'flash', label: 'Pack Flash ⚡', price: 450, hours: 4 },
  { value: 'party-starter', label: 'Pack Party Starter 🎉', price: 650, hours: 5 },
  { value: 'premium', label: 'Pack Premium ✨', price: 950, hours: 6 },
  { value: 'corporate', label: 'Pack Corporate 🎯', price: 800, hours: 5 },
  { value: 'wedding', label: 'Pack Boda 💍', price: 1200, hours: 8 },
];

export default function LeadActionsEnhanced({ 
  leadId, 
  currentStatus, 
  clientName,
  clientEmail,
  clientPhone,
  eventType 
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Quote generation state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(PACK_OPTIONS[0].value);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteHtml, setQuoteHtml] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error actualitzant estat');
      }

      setSuccess('Estat actualitzat!');
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconegut');
    }
  };

  const handleGenerateQuote = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: selectedPack,
          customPrice: customPrice,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error generant pressupost');
      }

      setQuoteHtml(data.html);
      setSuccess(`Pressupost ${data.quoteNumber} generat! Total: ${data.total.toFixed(2)}€`);
      
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
    // Obrir preview en nova finestra
    window.open(`/api/admin/leads/${leadId}/quote`, '_blank');
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

  const selectedPackInfo = PACK_OPTIONS.find(p => p.value === selectedPack);

  return (
    <div className="space-y-6">
      {/* Canviar Estat */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">📊 Canviar estat</h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm" role="status">
            {success}
          </div>
        )}

        <div className="space-y-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              disabled={isPending || status.value === currentStatus}
              type="button"
              aria-pressed={status.value === currentStatus}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                status.value === currentStatus
                  ? 'bg-stone-100 border-2 border-slate-400 font-medium'
                  : 'border border-stone-200 hover:bg-slate-50 hover:border-stone-200'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-lg">{status.icon}</span>
              <span className={`w-3 h-3 rounded-full ${status.color}`} />
              <span className={status.value === currentStatus ? 'text-slate-700' : 'text-slate-700'}>
                {status.label}
              </span>
              {status.value === currentStatus && (
                <span className="ml-auto text-xs text-slate-500">Actual</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Generar Pressupost */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">📄 Pressupost</h3>
        
        <div className="space-y-4">
          {/* Selector de Pack */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Selecciona Pack
            </label>
            <select
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {PACK_OPTIONS.map((pack) => (
                <option key={pack.value} value={pack.value}>
                  {pack.label} - {pack.price}€ ({pack.hours}h)
                </option>
              ))}
            </select>
          </div>

          {/* Preu personalitzat */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Preu personalitzat (opcional)
            </label>
            <input
              type="number"
              value={customPrice || ''}
              onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : null)}
              placeholder={`${selectedPackInfo?.price}€ (per defecte)`}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Resum */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Base:</span>
              <span className="font-medium">{customPrice || selectedPackInfo?.price}€</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-600">IVA (21%):</span>
              <span className="font-medium">{((customPrice || selectedPackInfo?.price || 0) * 0.21).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-stone-200">
              <span className="font-semibold text-slate-700">Total:</span>
              <span className="font-bold text-amber-600">{((customPrice || selectedPackInfo?.price || 0) * 1.21).toFixed(2)}€</span>
            </div>
          </div>

          {/* Botons */}
          <div className="flex gap-2">
            <button
              onClick={handlePreviewQuote}
              type="button"
              className="flex-1 px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              👁️ Preview
            </button>
            <button
              onClick={handleGenerateQuote}
              disabled={isGenerating}
              type="button"
              aria-busy={isGenerating}
              className="flex-1 px-4 py-2 bg-amber-500 rounded-lg text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {isGenerating ? '⏳ Generant...' : '📤 Generar'}
            </button>
          </div>

          {quoteHtml && (
            <button
              onClick={handlePrintQuote}
              type="button"
              className="w-full px-4 py-2 border border-amber-500 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50"
            >
              🖨️ Imprimir / Descarregar PDF
            </button>
          )}
        </div>
      </section>

      {/* Accions Ràpides */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">⚡ Accions ràpides</h3>
        
        <div className="space-y-2">
          {clientPhone && (
            <a
              href={`https://wa.me/${clientPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                `Hola ${clientName}! Sóc de Òrbita Events. He preparat el pressupost per al teu event, te l'envio ara mateix 📄✨`
              )}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <span className="text-xl">💬</span>
              <div className="text-left">
                <div className="font-medium">WhatsApp</div>
                <div className="text-xs opacity-80">Enviar pressupost</div>
              </div>
            </a>
          )}
          
          <a
            href={`mailto:${clientEmail}?subject=${encodeURIComponent(`Pressupost Òrbita Events - ${eventType}`)}&body=${encodeURIComponent(
              `Hola ${clientName},\n\nGràcies pel teu interès en Òrbita Events! Adjunto el pressupost per al teu event.\n\nQualsevol dubte, estic a la teva disposició.\n\nSalutacions,\nÒrbita Events\n${clientPhone ? `📱 ${clientPhone}` : ''}`
            )}`}
            className="flex items-center gap-3 w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <span className="text-xl">✉️</span>
            <div className="text-left">
              <div className="font-medium">Email</div>
              <div className="text-xs opacity-80">Enviar pressupost per email</div>
            </div>
          </a>

          {clientPhone && (
            <a
              href={`tel:${clientPhone}`}
              className="flex items-center gap-3 w-full px-4 py-3 bg-stone-100 text-slate-700 rounded-lg hover:bg-stone-200 transition-colors"
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
