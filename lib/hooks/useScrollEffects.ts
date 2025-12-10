'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCROLL REVEAL SYSTEM - Animaciones automáticas al hacer scroll
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este hook añade animaciones de entrada a cualquier elemento cuando
 * entra en el viewport. Super útil para crear esa sensación de "página viva".
 * 
 * USO:
 * 1. Añade data-reveal="up" (o "scale", "left", "right") a cualquier elemento
 * 2. El hook añadirá la clase "revealed" cuando entre en viewport
 * 3. Los estilos CSS en orbita-premium.css hacen el resto
 * 
 * EJEMPLO:
 * <div data-reveal="up">Este elemento aparecerá desde abajo</div>
 * <div data-reveal="scale">Este escalará</div>
 * <div data-reveal-stagger>
 *   <div>Child 1</div>
 *   <div>Child 2</div>
 *   <div>Child 3</div>
 * </div>
 */

import { useEffect, useRef, useState, RefObject } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER HOOK
// ═══════════════════════════════════════════════════════════════════════════

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView<T extends Element>(
  options: UseInViewOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.1, rootMargin = '-50px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isInView];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL REVEAL INITIALIZER
// ═══════════════════════════════════════════════════════════════════════════

export function useScrollReveal() {
  useEffect(() => {
    // Get all elements with data-reveal attribute
    const revealElements = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
    
    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '-50px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER HOOK
// ═══════════════════════════════════════════════════════════════════════════

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
}

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
}: UseCountUpOptions): number {
  const [count, setCount] = useState(start);
  const [ref, isInView] = useInView<HTMLDivElement>();

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      const steps = 60;
      const increment = (end - start) / steps;
      const stepDuration = duration / steps;
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, start, end, duration, delay]);

  return count;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARALLAX HOOK
// ═══════════════════════════════════════════════════════════════════════════

interface UseParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
}

export function useParallax(options: UseParallaxOptions = {}) {
  const { speed = 0.5, direction = 'up' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Calculate how much the element has scrolled relative to viewport
      const elementTop = rect.top + scrolled;
      const relativeScroll = scrolled - elementTop + viewportHeight;
      
      // Apply parallax based on direction
      const parallaxOffset = relativeScroll * speed * (direction === 'up' ? -1 : 1);
      
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction]);

  return { ref, style: { transform: `translateY(${offset}px)` } };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOUSE POSITION HOOK (for spotlight effects)
// ═══════════════════════════════════════════════════════════════════════════

interface MousePosition {
  x: number;
  y: number;
  isInside: boolean;
}

export function useMousePosition<T extends HTMLElement>(): [RefObject<T>, MousePosition] {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    isInside: false,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setPosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        isInside: true,
      });
    };

    const handleMouseLeave = () => {
      setPosition((prev) => ({ ...prev, isInside: false }));
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return [ref, position];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL PROGRESS HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(Math.max(scrollProgress, 0), 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL DIRECTION HOOK
// ═══════════════════════════════════════════════════════════════════════════

type ScrollDirection = 'up' | 'down' | null;

export function useScrollDirection(): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > prevScrollY) {
        setDirection('down');
      } else if (currentScrollY < prevScrollY) {
        setDirection('up');
      }
      
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY]);

  return direction;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  useInView,
  useScrollReveal,
  useCountUp,
  useParallax,
  useMousePosition,
  useScrollProgress,
  useScrollDirection,
};
