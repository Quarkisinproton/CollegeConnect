"use client";

import { useEffect, useState } from "react";

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export default function CursorRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    let rippleId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newRipple = {
        x: e.clientX,
        y: e.clientY,
        id: rippleId++,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 800);
    };

    // Throttle mousemove to avoid too many ripples
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledMouseMove = (e: MouseEvent) => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        handleMouseMove(e);
        throttleTimer = null;
      }, 80);
    };

    window.addEventListener("mousemove", throttledMouseMove);

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        >
          <div className="h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/30 bg-primary/5" />
        </div>
      ))}
    </div>
  );
}
