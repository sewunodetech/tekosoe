"use client";

import { Canvas, useThree, type CanvasProps } from "@react-three/fiber";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

/** `true` bila pengguna memilih "kurangi gerakan" — scene dirender diam (satu frame). */
const REDUCED = "(prefers-reduced-motion: reduce)";
export function useReducedMotion() {
  return useSyncExternalStore(
    (on) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

/**
 * R3F tidak menyalakan ulang loop render global saat `frameloop` berganti ke "always"
 * (setFrameloop tidak memanggil invalidate). Kalau semua scene sempat diam, loop berhenti;
 * komponen ini memicu satu frame setiap kali scene mulai berjalan lagi.
 */
function KickLoop({ running }: { running: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (running) invalidate();
  }, [running, invalidate]);
  return null;
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

type Props = Omit<CanvasProps, "children" | "frameloop"> & {
  children: ReactNode;
  /** Ditampilkan bila WebGL tidak tersedia. */
  fallback?: ReactNode;
  className?: string;
};

/**
 * Wrapper Canvas untuk landing: hanya menggambar saat terlihat di layar (hemat baterai),
 * diam saat "kurangi gerakan", dan jatuh ke `fallback` tanpa WebGL. Canvas dekoratif
 * (`aria-hidden`); isi yang penting tetap ada di HTML.
 */
export function SceneCanvas({ children, fallback = null, className, camera, ...rest }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // Scene hanya dimuat di browser (ssr: false), jadi `document` sudah ada di sini.
  const [webgl] = useState(hasWebGL);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className={className} aria-hidden="true">
      {webgl ? (
        <Canvas
          flat
          dpr={[1, 2]}
          camera={camera ?? { position: [0, 0, 8], fov: 40 }}
          frameloop={!reduced && visible ? "always" : "demand"}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          {...rest}
        >
          <KickLoop running={!reduced && visible} />
          {children}
        </Canvas>
      ) : (
        fallback
      )}
    </div>
  );
}
