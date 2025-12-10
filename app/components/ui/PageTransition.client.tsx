"use client";
import type { PropsWithChildren } from "react";
import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const DURATION = 180; // ms

function PageTransitionContent({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const search = useSearchParams();
  const key = `${pathname}?${search?.toString() || ""}`;

  const first = useRef(true);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // Fade in with breathe
    el.style.opacity = "0";
    el.style.transition = `opacity ${DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`;

    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.classList.add("breathe");
    });

    const t = setTimeout(() => {
      el.style.transition = "";
      el.classList.remove("breathe");
    }, DURATION + 50);

    return () => clearTimeout(t);
  }, [key]);

  return <div ref={ref} className="min-h-screen">{children}</div>;
}

export default function PageTransition({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<div className="min-h-screen">{children}</div>}>
      <PageTransitionContent>{children}</PageTransitionContent>
    </Suspense>
  );
}
