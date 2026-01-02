'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import {
  Shield, Download, Trash2, Edit3, Eye, Mail,
  CheckCircle, AlertCircle, ArrowRight, Lock,
  Clock, FileText, Ban, UserCog, ArrowLeft,
  Phone, Info
} from 'lucide-react';

type RequestType = 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'OBJECTION' | 'RESTRICTION';

interface RequestTypeConfig {
  type: RequestType;
  icon: typeof Eye;
  title: string;
  description: string;
  color: string;
  article: string;
  requiresDescription: boolean;
  descriptionLabel?: string;
}

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    hover: 'hover:bg-blue-500/30'
  },
  green: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    hover: 'hover:bg-green-500/30'
  },
  amber: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    hover: 'hover:bg-amber-500/30'
  },
  red: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    hover: 'hover:bg-red-500/30'
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    hover: 'hover:bg-purple-500/30'
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    hover: 'hover:bg-orange-500/30'
  },
};

export default function PrivacyPortalPage() {
  const t = useTranslations('privacyPortal');
  const [step, setStep] = useState<'options' | 'form' | 'success'>('options');
  const [selectedRequest, setSelectedRequest] = useState<RequestTypeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);

  // Request types with translations
  const REQUEST_TYPES: RequestTypeConfig[] = [
    {
      type: 'ACCESS',
      icon: Eye,
      title: t('requestTypes.ACCESS.title'),
      description: t('requestTypes.ACCESS.description'),
      color: 'blue',
      article: 'Art. 15 RGPD',
      requiresDescription: false,
    },
    {
      type: 'PORTABILITY',
      icon: Download,
      title: t('requestTypes.PORTABILITY.title'),
      description: t('requestTypes.PORTABILITY.description'),
      color: 'green',
      article: 'Art. 20 RGPD',
      requiresDescription: false,
    },
    {
      type: 'RECTIFICATION',
      icon: Edit3,
      title: t('requestTypes.RECTIFICATION.title'),
      description: t('requestTypes.RECTIFICATION.description'),
      color: 'amber',
      article: 'Art. 16 RGPD',
      requiresDescription: true,
      descriptionLabel: t('requestTypes.RECTIFICATION.descriptionLabel'),
    },
    {
      type: 'ERASURE',
      icon: Trash2,
      title: t('requestTypes.ERASURE.title'),
      description: t('requestTypes.ERASURE.description'),
      color: 'red',
      article: 'Art. 17 RGPD',
      requiresDescription: false,
    },
    {
      type: 'OBJECTION',
      icon: Ban,
      title: t('requestTypes.OBJECTION.title'),
      description: t('requestTypes.OBJECTION.description'),
      color: 'purple',
      article: 'Art. 21 RGPD',
      requiresDescription: true,
      descriptionLabel: t('requestTypes.OBJECTION.descriptionLabel'),
    },
    {
      type: 'RESTRICTION',
      icon: UserCog,
      title: t('requestTypes.RESTRICTION.title'),
      description: t('requestTypes.RESTRICTION.description'),
      color: 'orange',
      article: 'Art. 18 RGPD',
      requiresDescription: true,
      descriptionLabel: t('requestTypes.RESTRICTION.descriptionLabel'),
    },
  ];

  const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
    ACCESS: t('requestTypes.ACCESS.label'),
    RECTIFICATION: t('requestTypes.RECTIFICATION.label'),
    ERASURE: t('requestTypes.ERASURE.label'),
    RESTRICTION: t('requestTypes.RESTRICTION.label'),
    PORTABILITY: t('requestTypes.PORTABILITY.label'),
    OBJECTION: t('requestTypes.OBJECTION.label'),
  };

  const handleSelectRequest = (config: RequestTypeConfig) => {
    setSelectedRequest(config);
    setStep('form');
    setError(null);
  };

  const resetForm = () => {
    setStep('options');
    setSelectedRequest(null);
    setName('');
    setEmail('');
    setPhone('');
    setDescription('');
    setGdprConsent(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: name.trim(),
          requesterEmail: email.trim().toLowerCase(),
          requesterPhone: phone.trim() || undefined,
          requestType: selectedRequest.type,
          description: description.trim() || undefined,
          gdprConsent,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep('success');
      } else {
        setError(data.error || t('form.errorDefault'));
      }
    } catch {
      setError(t('form.errorConnection'));
    } finally {
      setIsLoading(false);
    }
  };

  const getColors = (color: string) => COLOR_CLASSES[color] || COLOR_CLASSES.blue;

  return (
    <main className="min-h-screen bg-bg-main py-20 px-4">
      {/* Background decoratiu */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-oe-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-oe-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-oe-gold to-oe-gold-light mb-6 shadow-lg shadow-oe-gold/20">
            <Shield className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-text-muted max-w-md mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-xl">
          <AnimatePresence mode="wait">

            {/* Step 1: Select Request Type */}
            {step === 'options' && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-oe-gold/20">
                    <FileText className="w-5 h-5 text-oe-gold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{t('selectStep.heading')}</h2>
                    <p className="text-sm text-text-muted">{t('selectStep.subheading')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {REQUEST_TYPES.map((req) => {
                    const colors = getColors(req.color);
                    const Icon = req.icon;
                    return (
                      <button
                        key={req.type}
                        onClick={() => handleSelectRequest(req)}
                        className={`w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-oe-gold/30 rounded-xl transition-all duration-200 flex items-center gap-4 group text-left`}
                      >
                        <div className={`p-3 rounded-xl ${colors.bg} transition-colors group-hover:scale-110`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-white">{req.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {req.article}
                            </span>
                          </div>
                          <p className="text-sm text-text-muted truncate">{req.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-oe-gold group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {/* Info box */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      <strong>{t('selectStep.infoBox.title')}</strong> {t('selectStep.infoBox.text')}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Form */}
            {step === 'form' && selectedRequest && (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
              >
                {/* Header with back button */}
                <div className="flex items-start gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('options');
                      setError(null);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                    aria-label={t('form.backButton')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-semibold text-white">
                        {REQUEST_TYPE_LABELS[selectedRequest.type]}
                      </h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getColors(selectedRequest.color).bg} ${getColors(selectedRequest.color).text}`}>
                        {selectedRequest.article}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">{selectedRequest.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                      {t('form.fullName')} <span className="text-red-400">{t('form.required')}</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder={t('form.fullNamePlaceholder')}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-oe-gold/50 focus:ring-1 focus:ring-oe-gold/50 transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                      {t('form.email')} <span className="text-red-400">{t('form.required')}</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t('form.emailPlaceholder')}
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-oe-gold/50 focus:ring-1 focus:ring-oe-gold/50 transition-colors"
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {t('form.emailHint')}
                    </p>
                  </div>

                  {/* Telèfon */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                      {t('form.phone')} <span className="text-text-muted">{t('form.phoneOptional')}</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('form.phonePlaceholder')}
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-oe-gold/50 focus:ring-1 focus:ring-oe-gold/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Descripció (si cal) */}
                  {selectedRequest.requiresDescription && (
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
                        {selectedRequest.descriptionLabel} <span className="text-red-400">{t('form.required')}</span>
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required={selectedRequest.requiresDescription}
                        placeholder={t('form.descriptionPlaceholder')}
                        rows={4}
                        maxLength={1000}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-oe-gold/50 focus:ring-1 focus:ring-oe-gold/50 transition-colors resize-none"
                      />
                      <p className="text-xs text-text-muted mt-1 text-right">
                        {t('form.characterCount', { count: description.length })}
                      </p>
                    </div>
                  )}

                  {/* Consentiment RGPD */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={gdprConsent}
                        onChange={(e) => setGdprConsent(e.target.checked)}
                        required
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-oe-gold focus:ring-oe-gold focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-text-muted group-hover:text-gray-300 transition-colors">
                        {t('form.gdprConsent')}{' '}
                        <Link href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="text-oe-gold hover:underline">
                          {t('form.privacyPolicy')}
                        </Link>
                        {' '}{t('form.gdprConsentText')}
                        <span className="text-red-400"> {t('form.required')}</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Submit */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading || !gdprConsent}
                    className="w-full py-3.5 bg-gradient-to-r from-oe-gold to-oe-gold-light hover:from-oe-gold-light hover:to-oe-gold disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-oe-gold/20 hover:shadow-oe-gold/40"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {t('form.submitting')}
                      </>
                    ) : (
                      <>
                        {t('form.submitButton')}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{t('success.title')}</h2>

                <p className="text-text-muted mb-6">
                  {t('success.message')}{' '}
                  <span className="text-white font-medium">{email}</span>
                </p>

                {/* Steps */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-medium text-white mb-3">{t('success.nextStepsTitle')}</h3>
                  <ol className="space-y-2 text-sm text-text-muted">
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-oe-gold/20 text-oe-gold text-xs flex items-center justify-center font-bold">1</span>
                      <span>{t('success.step1')}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-oe-gold/20 text-oe-gold text-xs flex items-center justify-center font-bold">2</span>
                      <span>{t('success.step2')}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-oe-gold/20 text-oe-gold text-xs flex items-center justify-center font-bold">3</span>
                      <span>{t('success.step3')}</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{t('success.legalDeadline')} <strong>{t('success.legalDeadlineDays')}</strong></span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3 text-left">
                    <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200">
                      <strong>{t('success.importantTitle')}</strong> {t('success.importantText')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors"
                  >
                    {t('success.anotherRequestButton')}
                  </button>
                  <Link
                    href="/"
                    className="flex-1 px-6 py-3 bg-oe-gold/10 hover:bg-oe-gold/20 border border-oe-gold/30 text-oe-gold font-medium rounded-xl transition-colors text-center"
                  >
                    {t('success.backToHomeButton')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer legal */}
        <footer className="mt-8 text-center text-sm text-text-muted">
          <p className="mb-3">
            {t('footer.rgpdText')}{' '}
            <strong className="text-gray-400">{t('footer.rgpdName')}</strong>
            {' '}{t('footer.lopdgddText')}{' '}
            <strong className="text-gray-400">{t('footer.lopdgddName')}</strong>.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/legal/privacidad" className="text-oe-gold hover:underline">
              {t('footer.privacyPolicy')}
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/legal/cookies" className="text-oe-gold hover:underline">
              {t('footer.cookiesPolicy')}
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/legal/aviso-legal" className="text-oe-gold hover:underline">
              {t('footer.legalNotice')}
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
