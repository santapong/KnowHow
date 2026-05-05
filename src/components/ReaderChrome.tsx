"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const IDLE_MS = 3000;

/**
 * Floating reader chrome that dissolves after IDLE_MS of no pointer/keyboard
 * activity and re-emerges on movement. Captures pointer events only on its
 * own children, so clicks anywhere else on the page (e.g. a 3D book) still
 * propagate.
 */
export function ReaderChrome({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function bump() {
      setActive(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setActive(false), IDLE_MS);
    }
    bump();
    window.addEventListener("pointermove", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("touchstart", bump, { passive: true });
    return () => {
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("touchstart", bump);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0 }}
    >
      {children}
    </div>
  );
}
