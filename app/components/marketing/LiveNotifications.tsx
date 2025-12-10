"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Sparkles, Heart, Building, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Notification {
  id: string;
  name: string;
  city: string;
  service: string;
  icon: 'check' | 'sparkles' | 'heart' | 'building';
  timeAgo: string;
  isReal: boolean;
}

const iconMap = {
  check: CheckCircle,
  sparkles: Sparkles,
  heart: Heart,
  building: Building,
};

// Configuració
const NOTIFICATIONS_ENABLED = true;
const SHOW_INTERVAL = 15000; // Mostrar cada 15 segons
const DISPLAY_DURATION = 6000; // Mostrar durant 6 segons

export default function LiveNotifications() {
  const t = useTranslations('common');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch notificacions de l'API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/recent-bookings');
      const data = await res.json();
      if (data.bookings?.length > 0) {
        setNotifications(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED) return;
    fetchNotifications();
    // Refrescar cada 5 minuts
    const refreshInterval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [fetchNotifications]);

  // Cicle de mostrar notificacions
  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED || notifications.length === 0 || isDismissed) return;

    const showNotification = () => {
      const nextNotification = notifications[currentIndex % notifications.length];
      setNotification(nextNotification);
      setIsVisible(true);

      // Amagar després de DISPLAY_DURATION
      setTimeout(() => {
        setIsVisible(false);
        setCurrentIndex(prev => prev + 1);
      }, DISPLAY_DURATION);
    };

    // Mostrar primera notificació després de 5 segons
    const initialDelay = setTimeout(showNotification, 5000);

    // Després, mostrar cada SHOW_INTERVAL
    const interval = setInterval(showNotification, SHOW_INTERVAL);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [notifications, currentIndex, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  // Si està desactivat o no hi ha notificació, no renderitzar res
  if (!NOTIFICATIONS_ENABLED || !notification) return null;

  const Icon = iconMap[notification.icon];

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.5, ease: [0.22, 0.9, 0.32, 1] }}
            className="pointer-events-auto"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-purple-600/20 blur-xl opacity-60" />

            <div className="relative flex items-start gap-3 p-4 pr-10 rounded-2xl bg-gradient-to-br from-black/90 via-black/85 to-black/90 backdrop-blur-xl border-2 border-purple-500/50 shadow-[0_0_40px_rgba(147,51,234,0.5)] max-w-sm">
              {/* Botó tancar */}
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label={t('closeNotifications')}
              >
                <X className="w-4 h-4 text-white/50 hover:text-white/80" />
              </button>

              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                <Icon className="w-5 h-5 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-0.5">
                  <span className="text-purple-300">{notification.name}</span> de{' '}
                  {notification.city}
                </p>
                <p className="text-xs text-white/70 mb-1">{notification.service}</p>
                <p className="text-xs text-white/50 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                  {notification.timeAgo}
                </p>
              </div>

              {/* Indicador de reserva real */}
              {notification.isReal && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] animate-pulse" />
                </div>
              )}
              {!notification.isReal && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.9)] animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
