// app/components/ui/WhatsAppPremium.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - WHATSAPP PREMIUM BUTTON v1.1 - i18n complet
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface WhatsAppPremiumProps {
  phoneNumber?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left';
  showTooltip?: boolean;
  showOnlineIndicator?: boolean;
  showResponseTime?: boolean;
  delay?: number;
  pulseAnimation?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONO WHATSAPP
// ═══════════════════════════════════════════════════════════════════════════

const WhatsAppIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function WhatsAppPremium({
  phoneNumber = '34699121023',
  message,
  position = 'bottom-right',
  showTooltip = true,
  showOnlineIndicator = true,
  showResponseTime = true,
  delay = 2000,
  pulseAnimation = true,
}: WhatsAppPremiumProps) {
  const t = useTranslations('homeSections.whatsapp');

  const finalMessage = message || t('defaultMessage');

  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (showTooltip && !tooltipDismissed) {
      const timer = setTimeout(() => setTooltipDismissed(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip, tooltipDismissed]);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`;

  const positionClasses = {
    'bottom-right': 'right-4 md:right-6',
    'bottom-left': 'left-4 md:left-6',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`fixed bottom-20 md:bottom-6 ${positionClasses[position]} z-50`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && !tooltipDismissed && !isHovered && (
              <motion.div
                initial={{ opacity: 0, x: position === 'bottom-right' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: position === 'bottom-right' ? 20 : -20 }}
                className={`absolute bottom-full ${position === 'bottom-right' ? 'right-0' : 'left-0'} mb-3`}
              >
                <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-[240px]">
                  <div className={`absolute -bottom-2 ${position === 'bottom-right' ? 'right-6' : 'left-6'} w-4 h-4 bg-white transform rotate-45`} />

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <WhatsAppIcon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">Òrbita Events</div>
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span>{t('onlineNow')}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {t('tooltipGreeting')}
                    </p>
                    {showResponseTime && (
                      <div className="mt-2 text-xs text-gray-200">
                        ⚡ {t('responseTime')}: &lt;5 min
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setTooltipDismissed(true)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-300 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded info on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: position === 'bottom-right' ? 10 : -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: position === 'bottom-right' ? 10 : -10, width: 0 }}
                className={`absolute bottom-0 ${position === 'bottom-right' ? 'right-full mr-3' : 'left-full ml-3'} whitespace-nowrap`}
              >
                <div className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    {showOnlineIndicator && (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Online
                      </span>
                    )}
                    <span className="text-white/60">|</span>
                    <span className="text-white text-sm font-medium">{t('writeUs')}</span>
                    {showResponseTime && (
                      <>
                        <span className="text-white/60">|</span>
                        <span className="text-white/60 text-sm">⚡ &lt;5 min</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main button */}
          <motion.a
            href={whatsappUrl}
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative block"
          >
            {pulseAnimation && (
              <>
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25" />
                <span className="absolute inset-[-4px] rounded-full bg-emerald-500/20 animate-pulse" />
              </>
            )}

            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow">
              <WhatsAppIcon size={32} />

              {showOnlineIndicator && (
                <span className="absolute top-0 right-0 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white"></span>
                </span>
              )}
            </div>
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANTE: WhatsApp Inline Button
// ═══════════════════════════════════════════════════════════════════════════

export function WhatsAppInline({
  phoneNumber = '34699121023',
  message,
  text,
  variant = 'primary',
}: {
  phoneNumber?: string;
  message?: string;
  text?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}) {
  const t = useTranslations('homeSections.whatsapp');

  const defaultMessage = t('defaultMessage');
  const defaultText = t('directWhatsApp');

  const finalMessage = message || defaultMessage;
  const finalText = text || defaultText;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`;

  const variants = {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-white',
    secondary: 'bg-white/10 hover:bg-emerald-500/20 border border-white/20 hover:border-emerald-500/50 text-white hover:text-emerald-400',
    outline: 'bg-transparent border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white',
  };

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank" rel="noopener noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all ${variants[variant]}`}
    >
      <WhatsAppIcon size={20} />
      <span>{finalText}</span>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
      </span>
    </motion.a>
  );
}
