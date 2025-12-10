import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  enabled?: boolean;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function useCountUp({
  end,
  start = 0,
  duration = 2000,
  delay = 0,
  enabled = true,
  suffix = '',
  prefix = '',
  decimals = 0,
}: UseCountUpOptions) {
  const [count, setCount] = useState(start);
  const [isComplete, setIsComplete] = useState(false);
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      setCount(start);
      setIsComplete(false);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay;
      }

      if (timestamp < startTimeRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = start + (end - start) * eased;
      setCount(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsComplete(true);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      startTimeRef.current = undefined;
    };
  }, [start, end, duration, delay, enabled, decimals]);

  const formattedCount = `${prefix}${count.toLocaleString('es-ES')}${suffix}`;

  return { count, formattedCount, isComplete };
}
