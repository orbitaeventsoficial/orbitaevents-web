'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { Customer } from './customer-utils';

interface DuplicateWarning {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  matchScore: number;
  matchReasons: Array<{ field: string; type: string; score: number }>;
}

// ─────────────────────────────────────────────────────────────────────────
// AddCustomerModal
// ─────────────────────────────────────────────────────────────────────────
export function AddCustomerModal({
  reduceMotion,
  initialNotes,
  onClose,
  onCreated,
}: {
  reduceMotion: boolean | null;
  initialNotes?: string;
  onClose: () => void;
  onCreated: (customer: Customer, duplicateWarnings: DuplicateWarning[]) => void;
}) {
  const toast = useToast();
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    dni: '',
    instagram: '',
    source: 'OTHER' as string,
    notes: initialNotes || '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate detection
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateOverride, setDuplicateOverride] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Check duplicates in real-time
  useEffect(() => {
    const { name, email, phone, instagram } = newCustomer;
    if (!name && !email && !phone) {
      setDuplicateWarnings([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await fetchWithCsrf('/api/admin/customers/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name, email, phone, instagram }),
        });
        const data = await res.json();
        setDuplicateWarnings(data?.duplicates || []);
      } catch {
        setDuplicateWarnings([]);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [newCustomer]);

  async function handleAddCustomer() {
    if (!newCustomer.name || !newCustomer.email) {
      setError('Nom i correu són obligatoris');
      return;
    }

    const highScoreDup = duplicateWarnings.find((d) => d.matchScore >= 80);
    if (highScoreDup && !duplicateOverride) {
      toast.warning(`Possible duplicat: "${highScoreDup.name}" (${highScoreDup.matchScore}%). Fes clic a "Crear igualment" per continuar.`);
      setDuplicateOverride(true);
      return;
    }
    setDuplicateOverride(false);
    setActionLoading(true);

    try {
      const response = await fetchWithCsrf('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone || undefined,
          instagram: newCustomer.instagram || undefined,
          dni: newCustomer.dni || undefined,
          source: newCustomer.source,
          notes: newCustomer.notes || undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error creant client');
      }

      const result = await response.json();
      const createdDuplicateWarnings = Array.isArray(result?.data?.duplicateWarnings)
        ? result.data.duplicateWarnings
        : [];

      onCreated(result.data, createdDuplicateWarnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 admin-card-glass flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-contact-title"
        className="border rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 id="add-contact-title" className="text-2xl font-bold mb-6">Afegir Client</h2>

        {/* Duplicate warnings */}
        {duplicateWarnings.length > 0 && (
          <div className="mb-5 rounded-xl border p-4">
            <p className="text-sm font-semibold mb-2">
              Possibles duplicats detectats
            </p>
            {duplicateWarnings.map((dup) => (
              <Link
                key={dup.id}
                href={`/admin/clientes/${dup.id}`}
                className="flex items-center justify-between rounded-xl border px-3 py-2 mb-1.5 last:mb-0 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{dup.name}</p>
                  <p className="text-xs">{dup.email}{dup.phone ? ` · ${dup.phone}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    dup.matchScore >= 80 ? 'admin-tone-soft-danger' :
                    dup.matchScore >= 50 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {dup.matchScore}%
                  </span>
                  <span className="text-xs">
                    {dup.matchReasons.map((r) => r.field).join(', ')}
                  </span>
                </div>
              </Link>
            ))}
            {checkingDuplicates && <p className="text-xs mt-2">Comprovant...</p>}
          </div>
        )}

        {error && (
          <div className="mb-4 border rounded-xl p-3" role="alert">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="nc-name" className="block text-sm mb-2">Nom <span>*</span></label>
              <input
                id="nc-name"
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all ${
                  !newCustomer.name && newCustomer.email ? 'border-rose-500/40' : ''
                }`}
                placeholder="Maria García"
                required
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="nc-email" className="block text-sm mb-2">Email <span>*</span></label>
              <input
                id="nc-email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all ${
                  !newCustomer.email && newCustomer.name ? 'border-rose-500/40' : ''
                }`}
                placeholder="maria@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="nc-phone" className="block text-sm mb-2">Telèfon</label>
              <input
                id="nc-phone"
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
                placeholder="699 123 456"
              />
            </div>

            <div>
              <label htmlFor="nc-dni" className="block text-sm mb-2">DNI / NIF / NIE</label>
              <input
                id="nc-dni"
                type="text"
                value={newCustomer.dni}
                onChange={(e) => setNewCustomer({ ...newCustomer, dni: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
                placeholder="12345678A"
              />
            </div>

            <div>
              <label htmlFor="nc-instagram" className="block text-sm mb-2">Instagram</label>
              <input
                id="nc-instagram"
                type="text"
                value={newCustomer.instagram}
                onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
                placeholder="@usuari"
              />
            </div>

            <div>
              <label htmlFor="nc-source" className="block text-sm mb-2">Font</label>
              <select
                id="nc-source"
                value={newCustomer.source}
                onChange={(e) => setNewCustomer({ ...newCustomer, source: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all"
              >
                <option value="PHONE">Telèfon</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WALLAPOP">Wallapop</option>
                <option value="WEBSITE">Web</option>
                <option value="CONFIGURATOR">Configurador</option>
                <option value="REFERRAL">Boca-orella</option>
                <option value="GOOGLE">Google</option>
                <option value="OTHER">Altre</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="nc-notes" className="block text-sm mb-2">Notes</label>
            <textarea
              id="nc-notes"
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border focus:ring-1 transition-all resize-none"
              rows={2}
              placeholder="Notes internes..."
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => { onClose(); setDuplicateWarnings([]); }}
            type="button"
            className="flex-1 py-3 border rounded-xl transition-all"
          >
            Cancel·lar
          </button>
          <button
            onClick={handleAddCustomer}
            disabled={actionLoading || !newCustomer.name || !newCustomer.email}
            type="button"
            aria-busy={actionLoading}
            className="flex-1 py-3 rounded-xl text-white font-bold shadow-lg disabled:opacity-50 transition-all"
          >
            {actionLoading ? 'Afegint...' : 'Afegir'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// StartProcessModal
// ─────────────────────────────────────────────────────────────────────────
export function StartProcessModal({
  customer,
  reduceMotion,
  onClose,
}: {
  customer: Customer;
  reduceMotion: boolean | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  async function startProcess(processType: string) {
    setActionLoading(true);
    try {
      const response = await fetchWithCsrf('/api/admin/start-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId: customer.id,
          processType,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error iniciant procés');
      }

      toast.success(`Procés "${processType}" iniciat per ${customer.name}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  }

  const PROCESSES = [
    { type: 'review_request', icon: '⭐', label: 'Demanar Opinió', desc: 'Envia un correu demanant una opinió' },
    { type: 'post_event', icon: '🎉', label: 'Post-esdeveniment complet', desc: 'Canvas 10/10 + Gràcies + Demanar opinió' },
    { type: 'welcome', icon: '👋', label: 'Benvinguda', desc: 'Email de benvinguda + Info empresa' },
    { type: 'promo', icon: '🎁', label: 'Promoció', desc: 'Envia oferta o descompte especial' },
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 admin-card-glass flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-process-title"
        className="border rounded-2xl p-6 sm:p-8 max-w-md w-full"
      >
        <h2 id="start-process-title" className="text-2xl font-bold mb-2">Iniciar Procés</h2>
        <p className="mb-6">
          Per <span className="">{customer.name}</span>
        </p>

        <div className="space-y-3">
          {PROCESSES.map(({ type, icon, label, desc }) => (
            <button
              key={type}
              onClick={() => startProcess(type)}
              disabled={actionLoading}
              type="button"
              aria-busy={actionLoading}
              className="w-full p-4 border rounded-xl text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-full mt-6 py-3 border rounded-xl transition-all"
        >
          Cancel·lar
        </button>
      </motion.div>
    </motion.div>
  );
}
