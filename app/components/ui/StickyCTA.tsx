"use client";

// app/components/ui/StickyCTA.tsx
// CTA flotante que lleva al formulario - SIN WHATSAPP
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface StickyCTAProps {
  position?: "left" | "right";
  showAfterScroll?: number;
}

export default function StickyCTA({
  position = "left",
  showAfterScroll = 400,
}: StickyCTAProps) {
  const t = useTranslations("stickyCta");
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    lastScrollY.current = window.scrollY;

    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        setIsVisible(lastScrollY.current > showAfterScroll);
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [showAfterScroll]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Track click para analytics
  const handleClick = useCallback(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "click_sticky_cta", {
        event_category: "CTA",
        event_label: "Formulario contacto",
        position,
      });
    }
  }, [position]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-6 ${position === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6"} z-40`}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 0.9, 0.32, 1] }}
        >
          <Link
            href="/contacto"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative flex items-center gap-3 
                     bg-gradient-to-r from-[var(--oe-gold)] to-yellow-500
                     hover:from-yellow-500 hover:to-[var(--oe-gold)]
                     text-black font-bold
                     px-5 py-3.5 sm:px-6 sm:py-4
                     rounded-full shadow-[0_8px_30px_rgba(218,165,32,0.4)]
                     hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)]
                     transition-all duration-300 ease-out
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--oe-gold)]/50
                     active:scale-95"
            aria-label={t("ariaLabel")}
          >
            {/* Icono con animación */}
            <motion.div
              animate={{
                rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>

            {/* Texto */}
            <span className="text-sm sm:text-base whitespace-nowrap">
              {t("requestQuote")}
            </span>

            {/* Badge de respuesta rápida */}
            <motion.span
              className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              ⚡ 2h
            </motion.span>

            {/* Efecto de ping sutil */}
            <span
              className="absolute inset-0 rounded-full bg-[var(--oe-gold)] animate-ping opacity-20"
              aria-hidden="true"
            />
          </Link>

          {/* Tooltip expandido en hover - desktop - ARRIBA para no cortarse */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="hidden lg:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-[#1a1a1a] border-2 border-[var(--oe-gold)]/60 text-white px-4 py-3 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_50px_rgba(218,165,32,0.5)] whitespace-nowrap">
                  <p className="font-semibold text-[var(--oe-gold)] text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t("responseIn2h")}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {t("noCommitment")}
                  </p>
                </div>
                {/* Flecha del tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[var(--oe-gold)]/60"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
