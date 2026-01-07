/**
 * HeroPortalLogo.tsx
 *
 * ANIMACIÓN PORTAL ÓRBITA EVENTS - VERSIÓN ULTRA CINEMATOGRÁFICA v2.0
 * ✨ Logo compacte - Tipografia premium - Màgia pura
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus_Jakarta_Sans } from "next/font/google";

// Tipografia premium pel text màgic
const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

type GlowColor = "gold" | "fuchsia" | "none";

interface HeroPortalLogoProps {
  endColor?: string;
  glowColor?: GlowColor;
  glowStrength?: number;
  onFinish?: () => void;
  svgUrl?: string;
  totalMs?: number;
  fadeMs?: number;
  introHoldMs?: number;
  introFadeMs?: number;
  speedMultiplier?: number;
}

// Extra global per allargar transicions
const TRANSITION_EXTRA_MS = 500;
// Offset extra per aguantar una mica més el logo abans del fade
const FADE_OFFSET_MS = 400;

export default function HeroPortalLogo({
  endColor = "#0a0a0a",
  glowColor = "gold",
  glowStrength = 0.65,
  onFinish,
  svgUrl = "/img/orbita-glyph-anim.svg",
  // més temps total perquè el text i el logo respirin
  totalMs = 7500,
  // fade final ULTRA llarg i cinematogràfic
  fadeMs = 3500,
  introHoldMs = 800,
  introFadeMs = 900,
  speedMultiplier = 1,
}: HeroPortalLogoProps) {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [mounted, setMounted] = useState(true);
  const [visible, setVisible] = useState(true);
  const [_svgError, setSvgError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Bloquejar scroll durant intro (el CSS ja oculta contingut amb :not(.intro-done))
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);
  const hasAnimated = useRef(false);

  // Detectar móvil i configurar duració més curta (5s màx)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 ||
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);

      if (mobile) {
        // En mòbil: màxim 5 segons total amb fade suau
        const MOBILE_TOTAL_MS = 5000;
        const MOBILE_FADE_MS = 1200;

        const tid = window.setTimeout(() => {
          setVisible(false);
        }, MOBILE_TOTAL_MS - MOBILE_FADE_MS);
        timers.current.push(tid);

        const tid2 = window.setTimeout(() => {
          setMounted(false);
          onFinish?.();
        }, MOBILE_TOTAL_MS);
        timers.current.push(tid2);
      }
    };

    checkMobile();
  }, [onFinish]);

  const SPEED = speedMultiplier;

  // Telón negro inicial
  const TELON_HOLD = Math.round(introHoldMs * SPEED);
  const TELON_FADE = Math.round(introFadeMs * SPEED);
  const SEQ_TELON_END = TELON_HOLD + TELON_FADE;

  // Delays entre elementos - MÁS JUNTOS, aparición progresiva
  const BUBBLES_DELAY = Math.round(-200 * SPEED); // Aparecen ANTES (negativo)
  const PLANET_DELAY = Math.round(150 * SPEED);
  const RING_DELAY = Math.round(200 * SPEED);
  const SAT_DELAY = Math.round(180 * SPEED);
  const WORDMARK_DELAY = Math.round(220 * SPEED);

  // Duraciones de animación (totes +500 ms)
  const DUR_PLANET = Math.round((800 + TRANSITION_EXTRA_MS) * SPEED);
  const DUR_RING = Math.round((900 + TRANSITION_EXTRA_MS) * SPEED);
  const DUR_SAT = Math.round((750 + TRANSITION_EXTRA_MS) * SPEED);
  const DUR_WORDMARK = Math.round((900 + TRANSITION_EXTRA_MS) * SPEED);

  // Timestamps absolutos
  const PLANET_START = SEQ_TELON_END + PLANET_DELAY;
  const RING_START = PLANET_START + RING_DELAY;
  const SAT_START = RING_START + SAT_DELAY;
  const WORDMARK_START = SAT_START + WORDMARK_DELAY;

  const EFFECTIVE_TOTAL_MS = Math.round(totalMs * SPEED);
  const EFFECTIVE_FADE_MS = Math.round(fadeMs * SPEED);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  // Tap to skip en mòbil
  const handleTapToSkip = useCallback(() => {
    if (!isMobile) return;

    // Vibració hàptica
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }

    // Skip immediat amb fade ràpid
    clearTimers();
    setVisible(false);

    const tid = window.setTimeout(() => {
      setMounted(false);
      onFinish?.();
    }, 400);
    timers.current.push(tid);
  }, [isMobile, clearTimers, onFinish]);

  // Fetch SVG
  useEffect(() => {
    let alive = true;

    fetch(svgUrl, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (alive) {
          setSvgMarkup(text);
          setSvgError(false);
          // 🆕 Pequeño delay para asegurar que el SVG está listo
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsReady(true);
            });
          });
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[HeroPortalLogo] Error loading SVG: ${err.message}`);
        }
        if (alive) {
          setSvgError(true);
          setSvgMarkup(null);
          setIsReady(true); // Continuar aunque falle
        }
      });

    return () => {
      alive = false;
    };
  }, [svgUrl]);

  // Centrado del SVG en viewport
  useEffect(() => {
    if (!svgMarkup || !hostRef.current) return;

    const svg = hostRef.current.querySelector("svg") as SVGSVGElement | null;
    if (!svg?.viewBox?.baseVal) return;

    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    (svg.style as any).overflow = "visible";

    let wrap = svg.querySelector("#__wrap_center__") as SVGGElement | null;
    if (!wrap) {
      wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      wrap.setAttribute("id", "__wrap_center__");
      const kids = Array.from(svg.childNodes);
      for (const k of kids) wrap.appendChild(k);
      svg.appendChild(wrap);
    }

    const targetGrp =
      (svg.querySelector("#planet, #planeta, #ring, #anillo") as SVGGraphicsElement | null) || wrap;

    const centerNow = () => {
      try {
        const vb = svg.viewBox.baseVal;
        const b = targetGrp.getBBox();
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        const desiredX = vb.x + vb.width / 2;
        const desiredY = vb.y + vb.height / 2;
        wrap!.setAttribute("transform", `translate(${desiredX - cx}, ${desiredY - cy})`);
      } catch {
        // ignore
      }
    };

    centerNow();
    const ro = new ResizeObserver(centerNow);
    ro.observe(document.documentElement);

    return () => ro.disconnect();
  }, [svgMarkup]);

  // Secuencia principal
  useEffect(() => {
    if (!svgMarkup || !hostRef.current || hasAnimated.current || !isReady) return;

    const svg = hostRef.current.querySelector("svg");
    if (!svg) return;

    hasAnimated.current = true;

    const findElements = (selectors: string[]): SVGElement[] => {
      for (const sel of selectors) {
        const els = Array.from(svg.querySelectorAll<SVGElement>(sel));
        if (els.length > 0) return els;
      }
      return [];
    };

    let planetEls = findElements([
      "#planet",
      "#planeta",
      "[id*='planet' i]",
      "[class*='planet' i]",
    ]);
    let ringEls = findElements([
      "#ring",
      "#anillo",
      "[id*='ring' i]",
      "[id*='anillo' i]",
      "[class*='ring' i]",
    ]);
    let satEls = findElements([
      "#satellite",
      "#satelite",
      "[id*='satellite' i]",
      "[id*='satelite' i]",
      "[class*='sat' i]",
    ]);
    let wmEls = findElements([
      "#wordmark",
      "#texto",
      "#logotype",
      "[id*='wordmark' i]",
      "[id*='texto' i]",
      "[id*='logotype' i]",
      "text",
      "tspan",
    ]);

    if (planetEls.length === 0 || ringEls.length === 0 || satEls.length === 0) {
      const groups = Array.from(svg.querySelectorAll("g")).filter((g) => {
        try {
          const bb = (g as SVGGraphicsElement).getBBox();
          return bb && bb.width + bb.height > 0;
        } catch {
          return false;
        }
      });

      if (groups.length >= 3) {
        if (planetEls.length === 0) planetEls = [groups[0]];
        if (ringEls.length === 0) ringEls = [groups[1]];
        if (satEls.length === 0) satEls = [groups[2]];
      }
    }

    if (wmEls.length === 0) {
      const textNodes = Array.from(svg.querySelectorAll("text, tspan"));
      if (textNodes.length > 0) {
        wmEls = textNodes as unknown as SVGElement[];
      } else {
        const alt = Array.from(
          svg.querySelectorAll("[class*='logo' i], [id*='logo' i], [class*='word' i]")
        );
        if (alt.length > 0) wmEls = alt as unknown as SVGElement[];
      }
    }

    const allElements = Array.from(new Set([...planetEls, ...ringEls, ...satEls, ...wmEls]));

    // 🆕 PREPARAR ELEMENTOS SIN FLASH - opacity 0 ANTES de mostrarse
    for (const el of allElements) {
      try {
        el.removeAttribute("style");
        el.removeAttribute("opacity");

        (el as ElementCSSInlineStyle).style.cssText = `
          opacity: 0 !important;
          visibility: visible !important;
          transform-origin: 50% 50% !important;
          transform: translateY(8px) scale(0.98) !important;
          will-change: opacity, transform !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
        `;
      } catch {
        // ignore
      }
    }

    const animateElements = (
      elements: Element[],
      options: {
        transform?: string;
        duration?: number;
        delay?: number;
      } = {}
    ) => {
      const { transform = "none", duration = 400, delay = 0 } = options;

      const animate = () => {
        for (const el of elements) {
          try {
            const htmlEl = el as HTMLElement;

            // 🆕 Transición más suave con cubic-bezier cinematográfico
            htmlEl.style.transition = `
              opacity ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1),
              transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)
            `;

            requestAnimationFrame(() => {
              htmlEl.style.opacity = "1";
              htmlEl.style.transform = transform;
            });
          } catch {
            try {
              (el as HTMLElement).style.opacity = "1";
            } catch {
              // ignore
            }
          }
        }
      };

      if (delay > 0) {
        const tid = window.setTimeout(animate, delay);
        timers.current.push(tid);
      } else {
        animate();
      }
    };

    clearTimers();

    // PLANETA - CON BRUTAL GLOW
    animateElements(planetEls, {
      transform: "scale(1.02) translateY(0)",
      duration: Math.max(400 + TRANSITION_EXTRA_MS, DUR_PLANET),
      delay: PLANET_START,
    });

    // Añadir glow suave al planeta - PROGRESIVO (amber/carbassa)
    timers.current.push(
      window.setTimeout(() => {
        for (const el of planetEls) {
          try {
            const htmlEl = el as any;
            // Empezar con filter sin intensidad
            htmlEl.style.filter = "drop-shadow(0 0 0px rgba(245, 158, 11, 0))";
            htmlEl.style.transition = "filter 1800ms ease-out";

            // Después de un frame, aplicar el glow progresivamente
            requestAnimationFrame(() => {
              htmlEl.style.filter = "drop-shadow(0 0 12px rgba(245, 158, 11, 0.3)) drop-shadow(0 0 24px rgba(245, 158, 11, 0.15))";

              // Una vez llegado a intensidad máxima, añadir pulso
              setTimeout(() => {
                htmlEl.style.animation = "glow-pulse 4s ease-in-out infinite";
              }, 1800);
            });
          } catch {
            // ignore
          }
        }
      }, PLANET_START + DUR_PLANET)
    );

    // ANILLO - CON SHIMMER BRUTAL
    animateElements(ringEls, {
      transform: "translateX(0) rotate(0deg) scale(1)",
      duration: Math.max(420 + TRANSITION_EXTRA_MS, DUR_RING),
      delay: RING_START,
    });

    // Shimmer suave en el anillo - PROGRESIVO (amber/carbassa)
    timers.current.push(
      window.setTimeout(() => {
        for (const el of ringEls) {
          try {
            const htmlEl = el as any;
            // Empezar sin filter
            htmlEl.style.filter = "drop-shadow(0 0 0px rgba(251, 191, 36, 0))";
            htmlEl.style.transition = "filter 1500ms ease-out";

            // Aplicar glow progresivamente
            requestAnimationFrame(() => {
              htmlEl.style.filter = "drop-shadow(0 0 10px rgba(251, 191, 36, 0.25))";
            });

            // Crear efecto shimmer con pseudo-elemento usando custom animation
            const parent = htmlEl.parentElement;
            if (parent && !parent.querySelector('.ring-shimmer')) {
              const shimmer = document.createElement('div');
              shimmer.className = 'ring-shimmer';
              shimmer.style.cssText = `
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
                animation: shimmer 4s ease-in-out infinite;
                pointer-events: none;
                mix-blend-mode: overlay;
                opacity: 0;
                transition: opacity 1500ms ease-out;
              `;
              parent.style.position = 'relative';
              parent.appendChild(shimmer);

              // Hacer aparecer el shimmer progresivamente
              requestAnimationFrame(() => {
                shimmer.style.opacity = '1';
              });
            }
          } catch {
            // ignore
          }
        }
      }, RING_START + DUR_RING)
    );

    // SATÉLITE - BRUTAL CON SCALE-PULSE + GLOW
    timers.current.push(
      window.setTimeout(() => {
        animateElements(satEls, {
          transform: "scale(1) translateY(0)",
          duration: Math.max(360 + TRANSITION_EXTRA_MS, DUR_SAT),
        });

        if (!document.getElementById("__hp_float_kf")) {
          const style = document.createElement("style");
          style.id = "__hp_float_kf";
          style.textContent = `
            @keyframes __hp_float {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-8px) scale(1.01); }
            }
          `;
          document.head.appendChild(style);
        }

        for (const el of satEls) {
          try {
            const htmlEl = el as any;
            // Empezar sin glow (amber/carbassa)
            htmlEl.style.filter = "drop-shadow(0 0 0px rgba(245, 158, 11, 0))";
            htmlEl.style.transition = "filter 1600ms ease-out";

            // Aplicar glow progresivamente
            requestAnimationFrame(() => {
              htmlEl.style.filter = "drop-shadow(0 0 8px rgba(245, 158, 11, 0.3)) drop-shadow(0 0 16px rgba(245, 158, 11, 0.15))";
            });

            setTimeout(() => {
              // Float + scale-pulse combinados suave
              htmlEl.style.animation = "__hp_float 5s ease-in-out infinite, scale-pulse 4s ease-in-out infinite";
            }, DUR_SAT);
          } catch {
            // ignore
          }
        }
      }, SAT_START)
    );

    // WORDMARK / TEXTO - CON GLOW + FADE-IN SUAVE
    animateElements(wmEls, {
      transform: "translateY(0) scale(1)",
      duration: DUR_WORDMARK,
      delay: WORDMARK_START,
    });

    // Añadir glow amber/carbassa suave al texto - PROGRESIVO
    timers.current.push(
      window.setTimeout(() => {
        for (const el of wmEls) {
          try {
            const htmlEl = el as any;
            // Empezar sin glow (amber/carbassa)
            htmlEl.style.filter = "drop-shadow(0 0 0px rgba(245, 158, 11, 0))";
            htmlEl.style.transition = "filter 1400ms ease-out";

            // Aplicar glow progresivamente
            requestAnimationFrame(() => {
              htmlEl.style.filter = "drop-shadow(0 0 6px rgba(245, 158, 11, 0.4)) drop-shadow(0 0 12px rgba(245, 158, 11, 0.2))";
            });

            htmlEl.style.animation = "fade-in-up 1.5s ease-out forwards";
          } catch {
            // ignore
          }
        }
      }, WORDMARK_START + DUR_WORDMARK)
    );

    // Glow - PROGRESIVO DESDE EL INICIO, AL MISMO TIEMPO QUE EL PLANETA
    if (glowColor !== "none") {
      timers.current.push(
        window.setTimeout(() => {
          const glowEl = document.getElementById("brand-glow");
          if (glowEl) {
            try {
              glowEl.style.opacity = "0";
              // Transición MUY larga y progresiva (2.5 segundos)
              glowEl.style.transition = `opacity ${Math.round(
                2500 * SPEED
              )}ms ease-out`;

              requestAnimationFrame(() => {
                // Subir intensidad progresivamente
                glowEl.style.opacity = String(Math.min(0.6, glowStrength));
                // Añadir animación de pulso suave al glow después de llegar a intensidad máxima
                setTimeout(() => {
                  glowEl.style.animation = "glow-pulse 4s ease-in-out infinite";
                }, Math.round(2500 * SPEED));
              });
            } catch {
              // ignore
            }
          }
        }, PLANET_START) // Empieza al mismo tiempo que el planeta
      );
    }

    // Fade final: aguanta una mica més abans de començar a desaparèixer
    timers.current.push(
      window.setTimeout(() => {
        setVisible(false);
      }, Math.max(0, EFFECTIVE_TOTAL_MS - EFFECTIVE_FADE_MS + FADE_OFFSET_MS))
    );

    timers.current.push(
      window.setTimeout(() => {
        setMounted(false);
        clearTimers();
        onFinish?.();
      }, EFFECTIVE_TOTAL_MS + FADE_OFFSET_MS)
    );

    return () => {
      clearTimers();
    };
  }, [
    svgMarkup,
    isReady,
    glowColor,
    glowStrength,
    SPEED,
    PLANET_START,
    DUR_PLANET,
    RING_START,
    DUR_RING,
    SAT_START,
    DUR_SAT,
    WORDMARK_START,
    DUR_WORDMARK,
    SEQ_TELON_END,
    EFFECTIVE_TOTAL_MS,
    EFFECTIVE_FADE_MS,
    clearTimers,
    onFinish,
  ]);

  // Glow ambient styles - Amber/carbassa corporate color
  const glowStyle =
    glowColor === "gold"
      ? {
          background:
            "radial-gradient(70% 60% at 50% 45%, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.08) 40%, transparent 70%)",
          opacity: 0,
        }
      : glowColor === "fuchsia"
      ? {
          background:
            "radial-gradient(70% 60% at 50% 45%, rgba(192, 38, 211, 0.2) 0%, rgba(192, 38, 211, 0.06) 40%, transparent 70%)",
          opacity: 0,
        }
      : {};

  if (!mounted) return null;

  // 🆕 MÓVIL - Versión simplificada amb tap to skip (5s màx)
  if (isMobile) {
    return (
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key="mobile-intro"
            className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer"
            onClick={handleTapToSkip}
            onTouchStart={handleTapToSkip}
            style={{
              zIndex: 9999,
              background: `linear-gradient(to bottom, #000 0%, ${endColor} 100%)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {/* Logo animat - COMPACTE */}
            {svgMarkup && (
              <motion.div
                className="relative flex items-center justify-center"
                style={{
                  width: "min(75vw, 280px)",
                  height: "auto",
                  aspectRatio: "1 / 1",
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
                initial={{ opacity: 0, scale: 0.85, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 1.2,
                  ease: [0.22, 0.61, 0.36, 1],
                  delay: 0.3
                }}
              />
            )}

            {/* Text subliminal - TIPOGRAFIA PREMIUM DAURAT */}
            <motion.p
              className={`${jakartaSans.className} text-xl font-light tracking-[0.25em] mt-10 uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent`}
              style={{
                textShadow: "0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(245, 158, 11, 0.3)",
                filter: "drop-shadow(0 0 20px rgba(217, 119, 6, 0.4))",
              }}
              initial={{ opacity: 0, y: 20, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.25em" }}
              transition={{
                duration: 1.5,
                delay: 1.0,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            >
              La màgia comença
            </motion.p>

            {/* Hint per saltar */}
            <motion.p
              className="absolute bottom-safe text-white/50 text-xs pb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.3] }}
              transition={{ duration: 2, delay: 2, repeat: Infinity }}
            >
              Toca per saltar
            </motion.p>

            {/* Glow subtil darrere el logo */}
            <motion.div
              className="absolute w-64 h-64 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              transition={{ duration: 2, delay: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="hero-portal"
          className="fixed inset-0"
          style={{
            zIndex: 9999,
            background: `linear-gradient(180deg, #000 0%, #050505 50%, ${endColor} 100%)`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            isolation: "isolate",
          }}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: EFFECTIVE_FADE_MS / 1000,
              ease: [0.22, 0.61, 0.36, 1],
            },
          }}
        >
          {/* Telón negro inicial */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{
              delay: TELON_HOLD / 1000,
              duration: TELON_FADE / 1000 + 0.5,
              ease: [0.22, 0.61, 0.36, 1],
            }}
            style={{
              zIndex: 8,
              pointerEvents: "none",
            }}
          />

          {/* ✨ TEXT SUBLIMINAL - TIPOGRAFIA ULTRA PREMIUM DAURAT */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 7, pointerEvents: "none" }}
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [30, 0, 0, -15],
              filter: ["blur(12px)", "blur(0px)", "blur(0px)", "blur(8px)"]
            }}
            transition={{
              times: [0, 0.15, 0.85, 1],
              duration: 5.5,
              delay: (SEQ_TELON_END + 300) / 1000,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            <span
              className={`${jakartaSans.className} text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.25em] uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent`}
              style={{
                filter: "drop-shadow(0 0 30px rgba(245, 158, 11, 0.5))",
              }}
            >
              La màgia comença
            </span>
          </motion.div>

          {/* Vignette */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
              zIndex: 2,
              pointerEvents: "none",
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0.25 }}
            transition={{
              delay: (TELON_HOLD + TELON_FADE) / 1000,
              duration: 1.0,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          />

          {/* Burbujas/partículas - MÁS BURBUJAS */}
          <motion.div
            className="absolute inset-0"
            style={{ zIndex: 1, pointerEvents: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: Math.max(0, SEQ_TELON_END / 1000 + BUBBLES_DELAY / 1000),
              duration: 1.2,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            <ChampagneBubbles
              key="back"
              count={120}
              blur={18}
              speedFactor={0.5}
              opacity={0.25}
            />
            <ChampagneBubbles
              key="mid"
              count={80}
              blur={12}
              speedFactor={0.7}
              opacity={0.3}
            />
            <ChampagneBubbles
              key="front"
              count={150}
              blur={8}
              speedFactor={0.95}
              opacity={0.4}
            />
          </motion.div>

          {/* 🌟 PARTÍCULAS SUTILES FLOTANTES */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 2 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: Math.max(0, SEQ_TELON_END / 1000 + 0.5),
              duration: 2,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            {/* Partículas grandes con float suave */}
            <div
              className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-oe-gold/15 to-yellow-400/10 blur-3xl top-[20%] left-[15%] animate-float"
              style={{ animationDuration: "6s", animationDelay: "0s" }}
            />
            <div
              className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-oe-gold/12 to-yellow-400/8 blur-3xl bottom-[25%] right-[20%] animate-float"
              style={{ animationDuration: "7s", animationDelay: "1s" }}
            />

            {/* Partículas medianas con scale-pulse suave */}
            <div
              className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/12 to-pink-500/8 blur-2xl top-[45%] right-[25%] animate-scale-pulse"
              style={{ animationDuration: "5s", animationDelay: "0.5s" }}
            />
            <div
              className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/10 to-pink-600/6 blur-2xl bottom-[40%] left-[30%] animate-scale-pulse"
              style={{ animationDuration: "6s", animationDelay: "1.5s" }}
            />

            {/* Partículas pequeñas brillantes con glow-pulse suave */}
            <div
              className="absolute w-16 h-16 rounded-full bg-yellow-300/18 blur-xl top-[35%] left-[40%] animate-glow-pulse"
              style={{ animationDuration: "4s" }}
            />
            <div
              className="absolute w-20 h-20 rounded-full bg-yellow-300/15 blur-xl bottom-[45%] right-[35%] animate-glow-pulse"
              style={{ animationDuration: "4.5s", animationDelay: "1s" }}
            />
          </motion.div>

          {/* Glow */}
          {glowColor !== "none" && (
            <div
              id="brand-glow"
              className="absolute inset-0"
              style={{
                zIndex: 3,
                ...glowStyle,
              }}
            />
          )}

          {/* 🆕 SVG + zoom de cámara - SIN PARPADEO */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              zIndex: 4,
              pointerEvents: "none",
            }}
          >
            <motion.div
              ref={hostRef}
              className="relative overflow-visible"
              style={{
                width: "min(65vw, 380px)",
                height: "auto",
                aspectRatio: "1 / 1",
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                willChange: 'transform, opacity',
              }}
              dangerouslySetInnerHTML={{ __html: svgMarkup || '' }}
              // Empieza VISIBLE (opacity 1) pero los elementos internos están ocultos
              // Esto evita el flash de "aparecer de la nada"
              initial={{ scale: 0.92, opacity: isReady ? 1 : 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: isReady ? (SEQ_TELON_END + Math.round(80 * SPEED)) / 1000 : 0,
                duration: Math.max(1.6, DUR_PLANET / 900),
                ease: [0.22, 0.61, 0.36, 1],
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ChampagneBubblesProps {
  count?: number;
  blur?: number;
  speedFactor?: number;
  opacity?: number;
}

function ChampagneBubbles({
  count = 100,
  blur = 12,
  speedFactor = 1,
  opacity = 0.7,
}: ChampagneBubblesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;

    const resize = () => {
      const w = (canvas.width = Math.floor(window.innerWidth * DPR));
      const h = (canvas.height = Math.floor(window.innerHeight * DPR));
      canvas.style.width = `${w / DPR}px`;
      canvas.style.height = `${h / DPR}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      return { w: w / DPR, h: h / DPR };
    };

    let { w, h } = resize();

    const bubbles = Array.from({ length: count }).map(() => {
      const r = 2 + Math.random() * 8;
      const baseVy = 0.2 + Math.random() * 1.0;
      return {
        x: Math.random() * w,
        y: h + Math.random() * h * 0.5,
        r,
        vy: baseVy * speedFactor,
        vx: (-0.1 + Math.random() * 0.2) * speedFactor,
        a: 0.25 + Math.random() * 0.3,
        blink: Math.random() * Math.PI * 2,
      };
    });

    let raf = 0;

    const paint = () => {
      ctx.clearRect(0, 0, w, h);

      for (const b of bubbles) {
        b.y -= b.vy;
        b.x += b.vx;
        b.blink += 0.01;

        if (b.y < -b.r * 4) {
          b.y = h + 20;
          b.x = Math.random() * w;
        }

        const tw = 0.25 + Math.abs(Math.sin(b.blink)) * 0.35;

        ctx.save();
        ctx.shadowBlur = blur;
        ctx.shadowColor = "rgba(251,191,36,0.45)";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${b.a * tw * opacity})`;
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(paint);
    };

    paint();

    const onResize = () => {
      const s = resize();
      w = s.w;
      h = s.h;
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [count, blur, speedFactor, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        width: "100%",
        height: "100%",
      }}
      aria-hidden="true"
    />
  );
}