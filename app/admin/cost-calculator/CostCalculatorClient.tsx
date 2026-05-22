'use client';

import { useState, useMemo, useCallback } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '../components/ToastProvider';
import { EditorControlStrip } from '../components/EditorControlStrip';

// ─── Component types ────────────────────────────────────────────────────────

interface CostComponent {
  id: string;
  type: string;
  label: string;
  icon: string;
  quantity: number;
  hours: number;
  unitCost: number;  // cost real per unitat/hora
  total: number;     // cost total calculat
}

interface AvailableComponent {
  type: string;
  label: string;
  icon: string;
  defaultHours: number;
  costPerHour: number; // cost/hora estimat
  unit: 'hora' | 'unitat' | 'km';
}

const AVAILABLE_COMPONENTS: AvailableComponent[] = [
  { type: 'dj', label: 'DJ', icon: '🎧', defaultHours: 4, costPerHour: 25, unit: 'hora' },
  { type: 'sound_small', label: 'So petit (fins 100p)', icon: '🔊', defaultHours: 4, costPerHour: 15, unit: 'hora' },
  { type: 'sound_large', label: 'So gran (100-500p)', icon: '📢', defaultHours: 4, costPerHour: 30, unit: 'hora' },
  { type: 'lights_basic', label: 'Il·luminació bàsica', icon: '💡', defaultHours: 4, costPerHour: 10, unit: 'hora' },
  { type: 'lights_pro', label: 'Il·luminació pro', icon: '🌟', defaultHours: 4, costPerHour: 20, unit: 'hora' },
  { type: 'photobooth', label: 'Fotomató', icon: '📸', defaultHours: 3, costPerHour: 18, unit: 'hora' },
  { type: 'technician', label: 'Tècnic extra', icon: '🔧', defaultHours: 4, costPerHour: 20, unit: 'hora' },
  { type: 'transport', label: 'Transport', icon: '🚐', defaultHours: 1, costPerHour: 0.15, unit: 'km' },
  { type: 'fog_machine', label: 'Màquina de fum', icon: '🌫️', defaultHours: 4, costPerHour: 5, unit: 'hora' },
  { type: 'sparklers', label: 'Espurnes fredes', icon: '✨', defaultHours: 1, costPerHour: 50, unit: 'unitat' },
  { type: 'stage', label: 'Escenari/Tarima', icon: '🎪', defaultHours: 1, costPerHour: 80, unit: 'unitat' },
  { type: 'custom', label: 'Personalitzat', icon: '➕', defaultHours: 1, costPerHour: 0, unit: 'hora' },
];

let nextId = 1;

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CostCalculatorClient() {
  const toast = useToast();
  const [components, setComponents] = useState<CostComponent[]>([]);
  const [marginPct, setMarginPct] = useState(30);
  const [quoteName, setQuoteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Afegir component
  const addComponent = useCallback((available: AvailableComponent) => {
    const id = `comp-${nextId++}`;
    const quantity = available.unit === 'km' ? 50 : 1;
    const hours = available.defaultHours;
    const unitCost = available.costPerHour;
    const total = unitCost * (available.unit === 'km' ? quantity : hours * quantity);

    setComponents((prev) => [
      ...prev,
      { id, type: available.type, label: available.label, icon: available.icon, quantity, hours, unitCost, total },
    ]);
  }, []);

  // Actualitzar component
  const updateComponent = useCallback((id: string, field: 'quantity' | 'hours' | 'unitCost', value: number) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: value };
        const avail = AVAILABLE_COMPONENTS.find((a) => a.type === c.type);
        const isKm = avail?.unit === 'km';
        const isUnit = avail?.unit === 'unitat';
        updated.total = isKm
          ? updated.unitCost * updated.quantity
          : isUnit
          ? updated.unitCost * updated.quantity
          : updated.unitCost * updated.hours * updated.quantity;
        return updated;
      })
    );
  }, []);

  // Eliminar component
  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Totals
  const totals = useMemo(() => {
    const totalCost = components.reduce((sum, c) => sum + c.total, 0);
    const suggestedPrice = Math.round(totalCost / (1 - marginPct / 100));
    const margin = suggestedPrice - totalCost;
    return { totalCost: Math.round(totalCost * 100) / 100, suggestedPrice, margin, marginPct };
  }, [components, marginPct]);
  const totalHours = useMemo(
    () => components.reduce((sum, component) => sum + (component.hours * component.quantity), 0),
    [components],
  );
  const hasQuoteBase = quoteName.trim().length > 0;
  const actionTitle = components.length === 0
    ? 'Començar afegint la base del pressupost'
    : !hasQuoteBase
      ? 'Posar nom i tancar la base abans de desar'
      : saving
        ? 'Deixar que el pressupost es desi correctament'
        : 'Refinar marge i cost abans de guardar';
  const actionDescription = components.length === 0
    ? 'Sense components no hi ha lectura econòmica real sobre la qual calcular marge o PVP.'
    : !hasQuoteBase
      ? 'El retorn més alt ara no és seguir afegint peces, sinó identificar el pressupost i tancar la base editable.'
      : saving
        ? 'Ara mateix el sistema està persistint el pressupost personalitzat.'
        : 'Amb la base completa, el pas bo és ajustar marge i revisar el preu suggerit abans de desar.';

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, component: AvailableComponent) => {
    e.dataTransfer.setData('text/plain', component.type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const type = e.dataTransfer.getData('text/plain');
    const component = AVAILABLE_COMPONENTS.find((c) => c.type === type);
    if (component) addComponent(component);
  };

  // Guardar
  const handleSave = async () => {
    if (!quoteName.trim()) { toast.error('Posa un nom al pressupost'); return; }
    if (components.length === 0) { toast.error('Afegeix almenys un component'); return; }

    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/custom-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quoteName.trim(),
          clientName: clientName.trim() || null,
          components: components.map((c) => ({
            type: c.type, label: c.label, hours: c.hours, quantity: c.quantity, unitCost: c.unitCost, total: c.total,
          })),
          totalCost: totals.totalCost,
          suggestedPrice: totals.suggestedPrice,
          marginPct: totals.marginPct,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Pressupost desat');
      setQuoteName('');
      setClientName('');
      setComponents([]);
    } catch (err) {
      console.error('Error desant pressupost', err);
      toast.error('Error desant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6" data-help-title="Calculadora de costos" data-help-desc="Munta pressupostos personalitzats arrossegant components (DJ, so, llums, transport...). Calcula cost, marge i preu suggerit.">
      <div className="lg:col-span-2">
        <EditorControlStrip
          overview={{
            eyebrow: 'Cobertura',
            title: 'Quin estat té ara mateix el pressupost',
            tone: components.length === 0 ? 'default' : hasQuoteBase ? 'success' : 'warning',
            stats: [
              { label: 'Components', value: components.length, tone: components.length > 0 ? 'success' : 'warning', hint: 'base activa' },
              { label: 'Cost total', value: `${totals.totalCost}€`, hint: 'cost real' },
              { label: 'PVP suggerit', value: `${totals.suggestedPrice}€`, hint: `${marginPct}% marge` },
            ],
          }}
          status={{
            eyebrow: 'Estat',
            title: 'Què convé revisar abans de desar',
            tone: components.length === 0 || !hasQuoteBase || saving ? 'warning' : 'info',
            items: [
              components.length === 0
                ? 'Encara no hi ha components al pressupost.'
                : `Hi ha ${components.length} components i ${totalHours} hores/unitats agregades de treball.`,
              hasQuoteBase
                ? `El pressupost ja té nom: ${quoteName.trim()}.`
                : 'Encara falta el nom del pressupost per deixar-lo identificat.',
              clientName.trim()
                ? `Client associat: ${clientName.trim()}.`
                : 'No hi ha client associat a aquesta simulació.',
            ],
          }}
          action={{
            eyebrow: 'Acció principal',
            title: actionTitle,
            description: actionDescription,
            tone: components.length === 0 || !hasQuoteBase || saving ? 'warning' : 'success',
            secondaryPills: [
              clientName.trim() ? 'Amb client' : 'Sense client',
              saving ? 'Desant' : 'Sessió estable',
            ],
          }}
        />
      </div>

      {/* Sidebar — Components disponibles */}
      <div className="ap-card rounded-xl p-5" data-help-title="Components disponibles" data-help-desc="Arrossega o clica components per afegir-los al pressupost. Cada component té un cost/hora estimat.">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">Components</h3>
        <p className="mb-4 text-xs admin-tone-text-slate">Arrossega o clica per afegir</p>
        <div className="space-y-2">
          {AVAILABLE_COMPONENTS.map((comp) => (
            <button
              key={comp.type}
              draggable
              onDragStart={(e) => handleDragStart(e, comp)}
              onClick={() => addComponent(comp)}
              className="ap-card w-full cursor-grab rounded-xl px-3 py-2.5 text-left transition-all active:cursor-grabbing hover:admin-tone-bg-neutral"
            >
              <span className="text-xl">{comp.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{comp.label}</div>
                <div className="text-xs admin-tone-text-slate">
                  {comp.costPerHour}€/{comp.unit}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main — Zona de treball */}
      <div className="space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`min-h-[200px] rounded-xl border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? 'border-amber-500/50 bg-amber-500/5'
              : components.length === 0
              ? 'admin-tone-border-neutral admin-tone-bg-neutral'
              : 'border-transparent bg-transparent p-0'
          }`}
        >
          {components.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <p className="text-4xl mb-3">🧮</p>
              <p className="text-lg font-medium">Arrossega components aquí</p>
              <p className="text-sm mt-1">o clica'ls a la barra lateral</p>
            </div>
          ) : (
            <div className="space-y-3">
              {components.map((comp) => {
                const avail = AVAILABLE_COMPONENTS.find((a) => a.type === comp.type);
                const unit = avail?.unit || 'hora';
                return (
                  <div key={comp.id} className="ap-card flex items-center gap-4 rounded-xl p-4 transition-colors hover:admin-tone-bg-neutral">
                    <span className="text-2xl">{comp.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">{comp.label}</div>
                    </div>

                    {/* Quantity */}
                    <div className="flex flex-col items-center gap-0.5">
                      <label className="text-[10px] text-white/30 uppercase">{unit === 'km' ? 'Km' : 'Uds'}</label>
                      <input
                        type="number" min={1} value={comp.quantity}
                        onChange={(e) => updateComponent(comp.id, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-16 px-2 py-1.5 rounded-lg border admin-tone-border-neutral admin-tone-bg-neutral text-center text-sm "
                      />
                    </div>

                    {/* Hours (only for hora units) */}
                    {unit === 'hora' && (
                      <div className="flex flex-col items-center gap-0.5">
                        <label className="text-[10px] text-white/30 uppercase">Hores</label>
                        <input
                          type="number" min={1} value={comp.hours}
                          onChange={(e) => updateComponent(comp.id, 'hours', Math.max(1, Number(e.target.value)))}
                          className="w-16 px-2 py-1.5 rounded-lg border admin-tone-border-neutral admin-tone-bg-neutral text-center text-sm "
                        />
                      </div>
                    )}

                    {/* Unit cost */}
                    <div className="flex flex-col items-center gap-0.5">
                      <label className="text-[10px] text-white/30 uppercase">€/{unit}</label>
                      <input
                        type="number" min={0} step={0.01} value={comp.unitCost}
                        onChange={(e) => updateComponent(comp.id, 'unitCost', Math.max(0, Number(e.target.value)))}
                        className="w-20 px-2 py-1.5 rounded-lg border admin-tone-border-neutral admin-tone-bg-neutral text-center text-sm "
                      />
                    </div>

                    {/* Total */}
                    <div className="w-20 text-right">
                      <div className="text-xs text-white/30">Cost</div>
                      <div className="text-sm font-bold">{Math.round(comp.total * 100) / 100}€</div>
                    </div>

                    {/* Remove */}
                    <button onClick={() => removeComponent(comp.id)} className="text-white/30 transition-colors p-1" aria-label="Eliminar">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Totals + Marge */}
        {components.length > 0 && (
          <div className="rounded-xl border p-6" data-help-title="Resum i marge" data-help-desc="Veu el cost total, ajusta el marge (%) amb el slider, i el sistema calcula benefici i preu suggerit automàticament.">
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-xs admin-tone-text-slate mb-1">Cost total</div>
                <div className="text-3xl font-black text-white">{totals.totalCost}€</div>
              </div>
              <div>
                <div className="text-xs admin-tone-text-slate mb-1">Marge</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={10} max={60} value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-lg font-bold text-white w-12 text-right">{marginPct}%</span>
                </div>
              </div>
              <div>
                <div className="text-xs admin-tone-text-slate mb-1">Benefici</div>
                <div className="text-3xl font-black">{totals.margin}€</div>
              </div>
              <div>
                <div className="text-xs admin-tone-text-slate mb-1">Preu suggerit</div>
                <div className="text-3xl font-black">{totals.suggestedPrice}€</div>
              </div>
            </div>

            {/* Save form */}
            <div className="border-t pt-4 admin-tone-border-neutral">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={quoteName} onChange={(e) => setQuoteName(e.target.value)}
                  placeholder="Nom del pressupost (ex: DJ 3h sense altaveus)"
                  className="flex-1 px-4 py-2.5 rounded-xl border admin-tone-border-neutral admin-tone-bg-neutral text-sm "
                />
                <input
                  value={clientName} onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client (opcional)"
                  className="sm:w-48 px-4 py-2.5 rounded-xl border admin-tone-border-neutral admin-tone-bg-neutral text-sm "
                />
                <button
                  onClick={handleSave} disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-black font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Desant...' : 'Desar pressupost'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


