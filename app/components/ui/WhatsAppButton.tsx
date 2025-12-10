'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';
import { getWhatsAppUrl, WhatsAppMessageType } from '@/config/site-config';
import { useTranslations } from 'next-intl';

const PAGE_MESSAGES: Record<string, WhatsAppMessageType> = {
  '/': 'general',
  '/servicios/bodas': 'bodas',
  '/servicios/discomovil': 'discomovil',
  '/servicios/empresas': 'empresas',
  '/servicios/fiestas': 'fiestas',
  '/servicios/alquiler': 'alquiler',
  '/servicios/produccion': 'produccion',
  '/boda-halloween': 'bodas',
  '/configurador': 'configurador',
};

export default function WhatsAppButton() {
  const t = useTranslations('common.whatsapp');
  const pathname = usePathname();

  const TOOLTIPS = useMemo(() => [
    `${t('tooltip1')} 💬`,
    `${t('tooltip2')} ⚡`,
    `${t('tooltip3')} 🎉`,
    `${t('tooltip4')} 🟢`,
  ], [t]);

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize tooltip text on mount
  useEffect(() => {
    setTooltipText(TOOLTIPS[0]);
  }, [TOOLTIPS]);

  // Mostrar tooltip después de 15 segundos
  useEffect(() => {
    if (hasInteracted) return;

    const showTimer = setTimeout(() => {
      setShowTooltip(true);
      setTooltipText(TOOLTIPS[Math.floor(Math.random() * TOOLTIPS.length)]);
    }, 15000);

    return () => clearTimeout(showTimer);
  }, [hasInteracted, TOOLTIPS]);

  // Ocultar tooltip después de 5 segundos y rotar
  useEffect(() => {
    if (!showTooltip) return;

    const hideTimer = setTimeout(() => setShowTooltip(false), 5000);

    const rotateTimer = setInterval(() => {
      setShowTooltip(true);
      setTooltipText(TOOLTIPS[Math.floor(Math.random() * TOOLTIPS.length)]);
    }, 40000);

    return () => {
      clearTimeout(hideTimer);
      clearInterval(rotateTimer);
    };
  }, [showTooltip, TOOLTIPS]);

  // Eliminar prefix de locale del pathname (ex: /ca/servicios/bodas -> /servicios/bodas)
  const cleanPathname = pathname.replace(/^\/(ca|es|en|fr|ar|zh)/, '') || '/';
  const messageType = PAGE_MESSAGES[cleanPathname] || 'general';
  const whatsappUrl = getWhatsAppUrl(messageType);

  const handleClick = () => {
    setHasInteracted(true);
    setShowTooltip(false);
    
    // Analytics
    if (typeof window !== 'undefined') {
      (window as any).gtag?.('event', 'whatsapp_click', {
        page: pathname,
        message_type: messageType,
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="absolute bottom-full right-0 mb-3"
          >
            <div className="relative bg-white text-zinc-800 px-4 py-2.5 rounded-2xl shadow-2xl">
              <span className="text-sm font-medium whitespace-nowrap flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--oe-gold)]" />
                {tooltipText}
              </span>
              {/* Arrow */}
              <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-3 h-3 bg-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full
                   bg-gradient-to-br from-green-400 to-green-600
                   shadow-[0_8px_30px_rgba(34,197,94,0.4)]
                   hover:shadow-[0_8px_40px_rgba(34,197,94,0.6)]
                   active:scale-95
                   transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('ariaLabel')}
      >
        {/* Icono */}
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />

        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
        <span 
          className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-30" 
          style={{ animationDelay: '0.5s' }} 
        />

        {/* Online indicator */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-green-300 rounded-full border-2 border-white">
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping" />
        </span>
      </motion.a>
    </div>
  );
}
