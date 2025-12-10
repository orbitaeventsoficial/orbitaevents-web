"use client";

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * CustomCursor - Cursor Personalitzat Premium WOW Edition
 *
 * Característiques:
 * - Només visible en desktop (>1024px)
 * - Efecte hover amb glow multicolor (daurat + púrpura)
 * - Click state amb animació
 * - Glow trail que segueix el mouse
 * - Mix-blend-mode per contrast
 */
export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Spring physics per moviment suau del cursor principal
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Spring més lent pel trail (efecte lag)
  const trailSpringConfig = { damping: 20, stiffness: 150 };
  const trailXSpring = useSpring(cursorX, trailSpringConfig);
  const trailYSpring = useSpring(cursorY, trailSpringConfig);

  useEffect(() => {
    // Només mostrar en desktop sense touch
    const checkDevice = () => {
      const shouldShow = window.innerWidth >= 1024 && !('ontouchstart' in window);
      setIsVisible(shouldShow);

      // Afegir/treure classe per amagar cursor natiu
      if (shouldShow) {
        document.body.classList.add('custom-cursor-active');
      } else {
        document.body.classList.remove('custom-cursor-active');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => {
      if (window.innerWidth >= 1024) setIsVisible(true);
    };

    // Click handlers
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', moveCursor);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Listeners per elements interactius
    const addHoverListeners = () => {
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], input, textarea, select, .cursor-pointer, [data-cursor-hover]'
      );
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => setIsHovering(true));
        el.addEventListener('mouseleave', () => setIsHovering(false));
      });
    };

    addHoverListeners();

    // Observer per nous elements dinàmics
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('resize', checkDevice);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('custom-cursor-active');
      observer.disconnect();
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Cursor principal - punt amb efecte click */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isClicking ? 8 : isHovering ? 18 : 12,
          height: isClicking ? 8 : isHovering ? 18 : 12,
          scale: isClicking ? 0.8 : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        <div
          className="w-full h-full rounded-full transition-colors duration-200"
          style={{
            backgroundColor: isHovering ? '#d7b86e' : '#ffffff',
          }}
        />
      </motion.div>

      {/* Halo exterior amb glow multicolor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isClicking ? 32 : isHovering ? 64 : 44,
          height: isClicking ? 32 : isHovering ? 64 : 44,
          opacity: isHovering ? 0.7 : 0.4,
        }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="w-full h-full rounded-full border-2 transition-all duration-200"
          style={{
            borderColor: isHovering ? 'rgba(215, 184, 110, 0.6)' : 'rgba(147, 51, 234, 0.4)',
          }}
        />
      </motion.div>

      {/* Glow trail effect (segueix amb lag) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{
          x: trailXSpring,
          y: trailYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 120 : 80,
          height: isHovering ? 120 : 80,
          opacity: isHovering ? 0.4 : 0.2,
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="w-full h-full rounded-full blur-2xl transition-all duration-300"
          style={{
            background: isHovering
              ? 'radial-gradient(circle, rgba(215, 184, 110, 0.4) 0%, rgba(217, 70, 239, 0.2) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(217, 70, 239, 0.15) 50%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* Extra glow per hover states */}
      {isHovering && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9996]"
          style={{
            x: trailXSpring,
            y: trailYSpring,
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-40 h-40 rounded-full blur-3xl bg-gradient-radial from-amber-500/30 via-fuchsia-500/20 to-transparent" />
        </motion.div>
      )}
    </>
  );
}
