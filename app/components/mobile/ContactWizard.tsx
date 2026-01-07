'use client';

/**
 * ContactWizard.tsx
 *
 * Formulario de contacto multi-step para móvil
 * - Pasos animados con progress bar
 * - Validación en tiempo real
 * - Confetti al enviar
 * - Haptic feedback
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithCsrf } from '@/lib/csrf';

// LocalStorage key for form persistence
const FORM_STORAGE_KEY = 'orbita_contact_wizard_form';
const STEP_STORAGE_KEY = 'orbita_contact_wizard_step';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface FormData {
  service: string;
  eventType: string;
  date: string;
  guests: string;
  venue: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  budget: string;
}

type Step = 'service' | 'details' | 'contact' | 'confirm' | 'success';

// ═══════════════════════════════════════════════════════════════════════════
// OPCIONES
// ═══════════════════════════════════════════════════════════════════════════

const serviceOptions = [
  { id: 'bodas', label: 'Casament', icon: '💒', description: 'DJ + So + Llums' },
  { id: 'fiestas', label: 'Festa Privada', icon: '🎉', description: 'Aniversaris, comunions...' },
  { id: 'tematicas', label: 'Festa Temàtica', icon: '🎭', description: 'Halloween, Harry Potter...' },
  { id: 'empresas', label: 'Event Corporatiu', icon: '🏢', description: 'Team building, galas...' },
  { id: 'discomovil', label: 'Discomòbil', icon: '🚐', description: 'Equip complet mòbil' },
];

const budgetOptions = [
  { id: 'low', label: '< 500€', range: 'Econòmic' },
  { id: 'mid', label: '500€ - 1000€', range: 'Estàndard' },
  { id: 'high', label: '1000€ - 2000€', range: 'Premium' },
  { id: 'premium', label: '> 2000€', range: 'Exclusiu' },
];

const guestOptions = ['< 50', '50-100', '100-150', '150-200', '200+'];

// ═══════════════════════════════════════════════════════════════════════════
// CONFETTI COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function Confetti() {
  const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: piece.color,
            left: `${piece.x}%`,
            top: -20,
          }}
          initial={{
            y: 0,
            rotate: 0,
            scale: piece.scale,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random(),
            delay: piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════

function ProgressBar({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {steps.map((step, i) => (
        <div key={step} className="flex-1 flex items-center">
          <motion.div
            className={`h-1.5 flex-1 rounded-full ${
              i <= currentStep ? 'bg-amber-500' : 'bg-white/10'
            }`}
            initial={false}
            animate={{
              scaleX: i <= currentStep ? 1 : 0.8,
              opacity: i <= currentStep ? 1 : 0.5,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface StepProps {
  formData: FormData;
  updateField: (field: keyof FormData, value: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

// Step 1: Service selection
function ServiceStep({ formData, updateField, onNext }: StepProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Què necessites?</h2>
        <p className="text-white/60">Selecciona el tipus de servei</p>
      </div>

      <div className="space-y-3">
        {serviceOptions.map((option, i) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => {
              triggerHaptic();
              updateField('service', option.id);
            }}
            className={`w-full p-4 rounded-2xl text-left transition-all ${
              formData.service === option.id
                ? 'bg-amber-500/20 border-2 border-amber-500'
                : 'bg-white/5 border-2 border-transparent'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{option.icon}</span>
              <div className="flex-1">
                <p className="text-white font-semibold">{option.label}</p>
                <p className="text-white/50 text-sm">{option.description}</p>
              </div>
              {formData.service === option.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!formData.service}
        className="w-full py-4 bg-amber-500 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-xl transition-all active:scale-98"
      >
        Continuar
      </button>
    </motion.div>
  );
}

// Step 2: Event details
function DetailsStep({ formData, updateField, onNext, onBack }: StepProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Detalls de l'event</h2>
        <p className="text-white/60">Ajuda'ns a preparar el millor per a tu</p>
      </div>

      {/* Date */}
      <div>
        <label className="block text-white/70 text-sm mb-2">Data de l'event</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => updateField('date', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-amber-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Guests */}
      <div>
        <label className="block text-white/70 text-sm mb-2">Nombre de convidats</label>
        <div className="flex flex-wrap gap-2">
          {guestOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                triggerHaptic();
                updateField('guests', option);
              }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                formData.guests === option
                  ? 'bg-amber-500 text-black font-medium'
                  : 'bg-white/5 text-white/70'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-white/70 text-sm mb-2">Lloc (opcional)</label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => updateField('venue', e.target.value)}
          placeholder="Nom de la masia, restaurant..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-amber-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-white/70 text-sm mb-2">Pressupost aproximat</label>
        <div className="grid grid-cols-2 gap-2">
          {budgetOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                triggerHaptic();
                updateField('budget', option.id);
              }}
              className={`p-3 rounded-xl text-left transition-all ${
                formData.budget === option.id
                  ? 'bg-amber-500/20 border-2 border-amber-500'
                  : 'bg-white/5 border-2 border-transparent'
              }`}
            >
              <p className="text-white font-medium text-sm">{option.label}</p>
              <p className="text-white/50 text-xs">{option.range}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 bg-white/10 text-white font-semibold rounded-xl transition-all active:scale-98"
        >
          Enrere
        </button>
        <button
          onClick={onNext}
          disabled={!formData.date || !formData.guests}
          className="flex-1 py-4 bg-amber-500 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-xl transition-all active:scale-98"
        >
          Continuar
        </button>
      </div>
    </motion.div>
  );
}

// Shake animation for errors
const shakeAnimation = {
  shake: {
    x: [-8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.5 }
  }
};

// Step 3: Contact info
function ContactStep({ formData, updateField, onNext, onBack }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const newShake: Record<string, boolean> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nom és obligatori';
      newShake.name = true;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Email no vàlid';
      newShake.email = true;
    }
    // Validació de telèfon espanyol: 9 dígits, pot començar amb +34 o 6/7/8/9
    const phoneClean = formData.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneClean.match(/^(\+34)?[6789]\d{8}$/)) {
      newErrors.phone = 'Telèfon no vàlid (format: 600000000 o +34600000000)';
      newShake.phone = true;
    }

    setErrors(newErrors);
    setShakeFields(newShake);

    // Haptic feedback on error
    if (Object.keys(newErrors).length > 0) {
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
      // Reset shake after animation
      setTimeout(() => setShakeFields({}), 500);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Com et contactem?</h2>
        <p className="text-white/60">Les teves dades de contacte</p>
      </div>

      {/* Name */}
      <motion.div
        animate={shakeFields.name ? 'shake' : ''}
        variants={shakeAnimation}
      >
        <label className="block text-white/70 text-sm mb-2">Nom complet *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            updateField('name', e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="El teu nom"
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition-colors ${
            errors.name ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-amber-500'
          }`}
        />
        {errors.name && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-1"
          >
            {errors.name}
          </motion.p>
        )}
      </motion.div>

      {/* Email */}
      <motion.div
        animate={shakeFields.email ? 'shake' : ''}
        variants={shakeAnimation}
      >
        <label className="block text-white/70 text-sm mb-2">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => {
            updateField('email', e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          placeholder="email@exemple.com"
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition-colors ${
            errors.email ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-amber-500'
          }`}
        />
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-1"
          >
            {errors.email}
          </motion.p>
        )}
      </motion.div>

      {/* Phone */}
      <motion.div
        animate={shakeFields.phone ? 'shake' : ''}
        variants={shakeAnimation}
      >
        <label className="block text-white/70 text-sm mb-2">Telèfon *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => {
            updateField('phone', e.target.value);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
          }}
          placeholder="+34 600 000 000"
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition-colors ${
            errors.phone ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-amber-500'
          }`}
        />
        {errors.phone && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-1"
          >
            {errors.phone}
          </motion.p>
        )}
      </motion.div>

      {/* Message */}
      <div>
        <label className="block text-white/70 text-sm mb-2">Missatge (opcional)</label>
        <textarea
          value={formData.message}
          onChange={(e) => updateField('message', e.target.value)}
          placeholder="Explica'ns més sobre el teu event..."
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-amber-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 bg-white/10 text-white font-semibold rounded-xl transition-all active:scale-98"
        >
          Enrere
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-amber-500 text-black font-semibold rounded-xl transition-all active:scale-98"
        >
          Revisar
        </button>
      </div>
    </motion.div>
  );
}

// Step 4: Confirmation
function ConfirmStep({ formData, onNext, onBack }: StepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceLabel = serviceOptions.find((s) => s.id === formData.service)?.label || formData.service;
  const budgetLabel = budgetOptions.find((b) => b.id === formData.budget)?.label || formData.budget;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    if ('vibrate' in navigator) navigator.vibrate(20);

    try {
      const response = await fetchWithCsrf('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `[Mobile Wizard] Servei: ${serviceLabel}
Data: ${formData.date}
Convidats: ${formData.guests}
Lloc: ${formData.venue || 'No especificat'}
Pressupost: ${budgetLabel}

${formData.message}`,
          service: formData.service,
          eventDate: formData.date,
          guests: formData.guests,
          budget: formData.budget,
        }),
      });

      if (!response.ok) {
        throw new Error('Error enviant el formulari');
      }

      setIsSubmitting(false);
      onNext();
    } catch (err) {
      setError('Hi ha hagut un error. Prova de nou o contacta per WhatsApp.');
      setIsSubmitting(false);
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Revisa les dades</h2>
        <p className="text-white/60">Tot correcte? Envia la sol·licitud</p>
      </div>

      <div className="space-y-4 p-4 bg-white/5 rounded-2xl">
        <div className="flex justify-between">
          <span className="text-white/50">Servei</span>
          <span className="text-white font-medium">{serviceLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Data</span>
          <span className="text-white font-medium">
            {new Date(formData.date).toLocaleDateString('ca-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Convidats</span>
          <span className="text-white font-medium">{formData.guests}</span>
        </div>
        {formData.venue && (
          <div className="flex justify-between">
            <span className="text-white/50">Lloc</span>
            <span className="text-white font-medium">{formData.venue}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/50">Pressupost</span>
          <span className="text-white font-medium">{budgetLabel}</span>
        </div>
        <hr className="border-white/10" />
        <div className="flex justify-between">
          <span className="text-white/50">Nom</span>
          <span className="text-white font-medium">{formData.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Email</span>
          <span className="text-white font-medium">{formData.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Telèfon</span>
          <span className="text-white font-medium">{formData.phone}</span>
        </div>
        {formData.message && (
          <>
            <hr className="border-white/10" />
            <div>
              <span className="text-white/50 block mb-1">Missatge</span>
              <span className="text-white text-sm">{formData.message}</span>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-white/10 text-white font-semibold rounded-xl transition-all active:scale-98 disabled:opacity-50"
        >
          Editar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-4 bg-amber-500 text-black font-semibold rounded-xl transition-all active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Enviant...
            </>
          ) : (
            'Enviar sol·licitud'
          )}
        </button>
      </div>
    </motion.div>
  );
}

// Step 5: Success
function SuccessStep() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-12 h-12 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-3">Sol·licitud enviada!</h2>
      <p className="text-white/60 mb-8">
        Et contactarem en menys de 24h per parlar del teu event.
      </p>

      <div className="space-y-3">
        <a
          href="https://wa.me/34699121023"
          className="flex items-center justify-center gap-3 w-full py-4 bg-green-500 text-white font-semibold rounded-xl"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Contactar per WhatsApp
        </a>
        <a
          href="/"
          className="block w-full py-4 bg-white/10 text-white font-semibold rounded-xl text-center"
        >
          Tornar a l'inici
        </a>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function ContactWizard() {
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    service: '',
    eventType: '',
    date: '',
    guests: '',
    venue: '',
    name: '',
    email: '',
    phone: '',
    message: '',
    budget: '',
  });

  const steps: Step[] = useMemo(() => ['service', 'details', 'contact', 'confirm'], []);
  const stepIndex = steps.indexOf(currentStep);

  // Restore form data from localStorage on mount
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      const savedStep = localStorage.getItem(STEP_STORAGE_KEY);

      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        // Only restore if there's meaningful data
        if (parsed.service || parsed.name || parsed.email) {
          setFormData(parsed);
          if (savedStep && savedStep !== 'success') {
            setCurrentStep(savedStep as Step);
            setShowRestoredToast(true);
            setTimeout(() => setShowRestoredToast(false), 3000);
          }
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Save form data to localStorage on change
  useEffect(() => {
    if (currentStep === 'success') {
      // Clear storage on success
      localStorage.removeItem(FORM_STORAGE_KEY);
      localStorage.removeItem(STEP_STORAGE_KEY);
    } else {
      try {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
        localStorage.setItem(STEP_STORAGE_KEY, currentStep);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [formData, currentStep]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      setShowConfetti(true);
      setCurrentStep('success');
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 100]);
    }
  }, [stepIndex, steps]);

  const goBack = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  }, [stepIndex, steps]);

  // Clear form handler
  const clearForm = useCallback(() => {
    setFormData({
      service: '',
      eventType: '',
      date: '',
      guests: '',
      venue: '',
      name: '',
      email: '',
      phone: '',
      message: '',
      budget: '',
    });
    setCurrentStep('service');
    localStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(STEP_STORAGE_KEY);
  }, []);

  return (
    <section className="py-6 px-4 lg:hidden">
      {/* Toast de formulari restaurat */}
      <AnimatePresence>
        {showRestoredToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-50 p-3 bg-amber-500/90 backdrop-blur-sm rounded-xl text-black text-sm font-medium flex items-center justify-between shadow-lg"
          >
            <span>📝 Formulari restaurat de la sessió anterior</span>
            <button
              onClick={clearForm}
              className="ml-2 px-2 py-1 bg-black/20 rounded-lg text-xs"
            >
              Esborrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      {currentStep !== 'success' && (
        <ProgressBar currentStep={stepIndex} steps={steps} />
      )}

      {/* Content */}
      <div className="py-4">
        <AnimatePresence mode="wait">
          {currentStep === 'service' && (
            <ServiceStep
              key="service"
              formData={formData}
              updateField={updateField}
              onNext={goNext}
            />
          )}
          {currentStep === 'details' && (
            <DetailsStep
              key="details"
              formData={formData}
              updateField={updateField}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'contact' && (
            <ContactStep
              key="contact"
              formData={formData}
              updateField={updateField}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'confirm' && (
            <ConfirmStep
              key="confirm"
              formData={formData}
              updateField={updateField}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'success' && <SuccessStep key="success" />}
        </AnimatePresence>
      </div>

      {/* Confetti */}
      {showConfetti && <Confetti />}
    </section>
  );
}
