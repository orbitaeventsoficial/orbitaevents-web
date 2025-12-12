"use client";
// app/components/marketing/EmotionalCalculator.tsx
// Calculadora Emocional - Mostra als clients el valor del seu event mentre els emociona

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, Music, Sparkles, Camera, Mic2,
  PartyPopper, Calendar, ArrowRight, CheckCircle,
  Zap, Star
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Option {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  popular?: boolean;
}

interface Step {
  id: string;
  question: string;
  subtitle: string;
  options: Option[];
  type: 'single' | 'multiple';
}

export default function EmotionalCalculator() {
  const t = useTranslations('calculator');
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [isComplete, setIsComplete] = useState(false);

  // Passos de la calculadora (memoized to prevent recreation on every render)
  const steps: Step[] = useMemo(() => [
    {
      id: 'eventType',
      question: t('steps.eventType.question'),
      subtitle: t('steps.eventType.subtitle'),
      type: 'single',
      options: [
        { id: 'wedding', label: t('steps.eventType.options.wedding'), icon: <Heart className="w-6 h-6" />, value: 1500, popular: true },
        { id: 'birthday', label: t('steps.eventType.options.birthday'), icon: <PartyPopper className="w-6 h-6" />, value: 800 },
        { id: 'corporate', label: t('steps.eventType.options.corporate'), icon: <Users className="w-6 h-6" />, value: 1200 },
        { id: 'party', label: t('steps.eventType.options.party'), icon: <Sparkles className="w-6 h-6" />, value: 600 },
      ]
    },
    {
      id: 'guests',
      question: t('steps.guests.question'),
      subtitle: t('steps.guests.subtitle'),
      type: 'single',
      options: [
        { id: 'small', label: t('steps.guests.options.small'), icon: <Users className="w-6 h-6" />, value: 0 },
        { id: 'medium', label: t('steps.guests.options.medium'), icon: <Users className="w-6 h-6" />, value: 200 },
        { id: 'large', label: t('steps.guests.options.large'), icon: <Users className="w-6 h-6" />, value: 400, popular: true },
        { id: 'xlarge', label: t('steps.guests.options.xlarge'), icon: <Users className="w-6 h-6" />, value: 600 },
      ]
    },
    {
      id: 'services',
      question: t('steps.services.question'),
      subtitle: t('steps.services.subtitle'),
      type: 'multiple',
      options: [
        { id: 'dj', label: t('steps.services.options.dj'), icon: <Music className="w-6 h-6" />, value: 500, popular: true },
        { id: 'sound', label: t('steps.services.options.sound'), icon: <Mic2 className="w-6 h-6" />, value: 400 },
        { id: 'lights', label: t('steps.services.options.lights'), icon: <Zap className="w-6 h-6" />, value: 350 },
        { id: 'photo', label: t('steps.services.options.photo'), icon: <Camera className="w-6 h-6" />, value: 450 },
      ]
    },
    {
      id: 'date',
      question: t('steps.date.question'),
      subtitle: t('steps.date.subtitle'),
      type: 'single',
      options: [
        { id: 'weekend', label: t('steps.date.options.weekend'), icon: <Calendar className="w-6 h-6" />, value: 200, popular: true },
        { id: 'friday', label: t('steps.date.options.friday'), icon: <Calendar className="w-6 h-6" />, value: 100 },
        { id: 'weekday', label: t('steps.date.options.weekday'), icon: <Calendar className="w-6 h-6" />, value: 0 },
        { id: 'flexible', label: t('steps.date.options.flexible'), icon: <Star className="w-6 h-6" />, value: -100 },
      ]
    },
  ], [t]);

  // Calcular preu estimat
  const estimatedPrice = useMemo(() => {
    let total = 0;

    steps.forEach(step => {
      const selection = selections[step.id];
      if (!selection) return;

      if (step.type === 'single') {
        const option = step.options.find(o => o.id === selection);
        if (option) total += option.value;
      } else if (step.type === 'multiple' && Array.isArray(selection)) {
        selection.forEach(id => {
          const option = step.options.find(o => o.id === id);
          if (option) total += option.value;
        });
      }
    });

    return total;
  }, [selections, steps]);

  const handleSelect = (stepId: string, optionId: string, type: 'single' | 'multiple') => {
    if (type === 'single') {
      setSelections(prev => ({ ...prev, [stepId]: optionId }));
    } else {
      setSelections(prev => {
        const current = (prev[stepId] as string[]) || [];
        if (current.includes(optionId)) {
          return { ...prev, [stepId]: current.filter(id => id !== optionId) };
        }
        return { ...prev, [stepId]: [...current, optionId] };
      });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    const step = steps[currentStep];
    const selection = selections[step.id];
    if (step.type === 'single') return !!selection;
    if (step.type === 'multiple') return Array.isArray(selection) && selection.length > 0;
    return false;
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <section id="calculadora" className="py-20 sm:py-32 bg-gradient-to-b from-bg-surface to-bg-main">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-oe-gold/10 border border-oe-gold/30 text-oe-gold text-sm font-medium mb-6">
              {t('badge')}
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
              {t('title')}
              <br />
              <span className="text-oe-gold">{t('titleHighlight')}</span>
            </h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-bg-surface rounded-3xl border border-border overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="h-1 bg-border">
            <motion.div
              className="h-full bg-gradient-to-r from-oe-gold to-oe-gold-light"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-10"
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm text-text-muted">
                    {t('step')} {currentStep + 1} {t('of')} {steps.length}
                  </span>
                  <div className="text-right">
                    <span className="text-sm text-text-muted">{t('estimate')}</span>
                    <p className="text-2xl font-black text-oe-gold">{estimatedPrice}€</p>
                  </div>
                </div>

                {/* Question */}
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {currentStepData.question}
                </h3>
                <p className="text-text-muted mb-8">{currentStepData.subtitle}</p>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {currentStepData.options.map((option) => {
                    const isSelected = currentStepData.type === 'single'
                      ? selections[currentStepData.id] === option.id
                      : (selections[currentStepData.id] as string[] || []).includes(option.id);

                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleSelect(currentStepData.id, option.id, currentStepData.type)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 md:p-6 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-oe-gold bg-oe-gold/10'
                            : 'border-border hover:border-oe-gold/50 bg-bg-main/50'
                        }`}
                      >
                        {option.popular && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-oe-gold text-black text-xs font-bold">
                            {t('popular')}
                          </span>
                        )}
                        <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center ${
                          isSelected ? 'bg-oe-gold/20 text-oe-gold' : 'bg-border text-text-muted'
                        }`}>
                          {option.icon}
                        </div>
                        <p className={`font-bold ${isSelected ? 'text-white' : 'text-text-muted'}`}>
                          {option.label}
                        </p>
                        {isSelected && (
                          <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-oe-gold" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                      currentStep === 0
                        ? 'text-text-muted cursor-not-allowed'
                        : 'text-white hover:bg-border'
                    }`}
                  >
                    {t('back')}
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                      canProceed()
                        ? 'bg-oe-gold text-black hover:bg-oe-gold-light'
                        : 'bg-border text-text-muted cursor-not-allowed'
                    }`}
                  >
                    {currentStep === steps.length - 1 ? t('seeResult') : t('next')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Results */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 md:p-10 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-oe-gold/20 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-oe-gold" />
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
                  {t('result.title')}
                </h3>

                <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-oe-gold/20 to-oe-gold/10 border border-oe-gold/50 mb-6">
                  <span className="text-lg text-text-muted">{t('result.from')}</span>
                  <p className="text-5xl md:text-6xl font-black text-oe-gold">{estimatedPrice}€</p>
                </div>

                <p className="text-text-muted max-w-md mx-auto mb-8">
                  {t('result.description')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/contacto"
                    className="oe-btn-gold inline-flex items-center justify-center gap-2"
                  >
                    {t('result.cta')}
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => {
                      setIsComplete(false);
                      setCurrentStep(0);
                      setSelections({});
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-white border border-border hover:bg-border transition-all"
                  >
                    {t('result.restart')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-text-muted"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-oe-gold" />
            <span>{t('trust.noCommitment')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-oe-gold" />
            <span>{t('trust.freeQuote')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-oe-gold" />
            <span>{t('trust.response24h')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
