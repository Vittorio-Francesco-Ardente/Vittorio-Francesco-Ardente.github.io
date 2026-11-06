"use client";

import React, { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export interface LocationMapProps {
  location?: string;
  coordinates?: string;
  className?: string;
}

/**
 * Theme-matched adaptation of the supplied expand-map.tsx component.
 * The actual Dalmine municipal shape is supplied by an ISTAT-derived SVG.
 * The static GitHub Pages build uses its zero-dependency equivalent instead.
 */
export function LocationMap({
  location = "Dalmine, BG",
  coordinates = "45.65° N · 9.60° E",
  className = "",
}: LocationMapProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-50, 50], [8, -8]), {
    stiffness: 300,
    damping: 30,
  });
  const ry = useSpring(useTransform(x, [-50, 50], [-8, 8]), {
    stiffness: 300,
    damping: 30,
  });

  const onMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    x.set(Math.max(-50, Math.min(50, event.clientX - (bounds.left + bounds.width / 2))));
    y.set(Math.max(-50, Math.min(50, event.clientY - (bounds.top + bounds.height / 2))));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  return (
    <div className={`relative flex flex-col items-center gap-4 ${className}`}>
      <div className="relative" style={{ perspective: 1000 }}>
        <motion.button
          type="button"
          ref={ref}
          onClick={() => setExpanded((value) => !value)}
          onMouseMove={onMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={reset}
          onBlur={reset}
          aria-expanded={expanded}
          aria-label={expanded ? "Riduci la mappa di Dalmine" : "Espandi la mappa di Dalmine"}
          className="relative block cursor-pointer select-none overflow-hidden rounded-[21px] border border-[#0B2A8C]/20 bg-[#F3F5F8] text-[#0B2A8C] shadow-xl outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B2A8C]"
          style={{
            rotateX: rx,
            rotateY: ry,
            transformStyle: "preserve-3d",
          }}
          animate={{ width: expanded ? 425 : 254, height: expanded ? 322 : 154 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{
            backgroundImage: "linear-gradient(#0B2A8C0F 1px, transparent 1px), linear-gradient(90deg, #0B2A8C0F 1px, transparent 1px)",
            backgroundSize: "21px 21px",
          }} />
          <div className="absolute inset-x-[18px] top-[18px] z-20 flex items-center justify-between">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#0B2A8C" strokeWidth="1.7" strokeLinejoin="round">
              <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
              <path d="M9 3v15M15 6v15" />
            </svg>
            <span className="rounded-full border border-[#0B2A8C]/10 bg-white/80 px-2 py-1 text-[10px] font-semibold">
              Lombardia · Italia
            </span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                className="absolute inset-x-3 bottom-[71px] top-[59px] overflow-hidden rounded-xl"
                initial={{ opacity: 0, y: 12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.94 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <img src="/_assets/vfa-dalmine-profile-20261106.svg"
                  alt="Confini comunali reali di Dalmine, ISTAT 2026"
                  className="h-full w-full object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-[18px] bottom-[17px] z-20 flex items-end justify-between text-left">
            <div>
              <h3 className="font-semibold text-[#0B2A8C]">{location}</h3>
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    className="mt-1 font-mono text-[10px] text-[#63718B]"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {coordinates}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <motion.span
              className="grid size-7 place-items-center rounded-full bg-[#0B2A8C] text-xl text-white"
              animate={{ rotate: expanded ? 45 : 0 }}
            >
              +
            </motion.span>
          </div>
        </motion.button>
      </div>
      <motion.p className="text-[10px] font-medium text-[#63718B]"
        animate={{ opacity: hovered && !expanded ? 1 : 0 }}>
        Clicca per esplorare
      </motion.p>
    </div>
  );
}
