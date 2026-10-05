import type { CSSProperties, ReactNode } from "react";

/** Hiasan dari desain — port dari apps/mobile/src/components/decor.tsx. Semua animasi CSS, mati saat reduce-motion. */

/** Bintang empat sudut yang berkelip (kelas `tw` di desain). Posisikan lewat `className`/`style`. */
export function Sparkle({
  size = 20,
  color = "var(--color-orange)",
  delay = 0,
  className = "",
  style,
}: {
  size?: number;
  color?: string;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`tk-sparkle pointer-events-none absolute ${className}`}
      style={{ ...style, ["--delay" as string]: `${delay}ms` }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z" fill={color} />
      </svg>
    </span>
  );
}

/** Koin kuning bergaris ink dengan tanda $. */
export function Coin({ size = 28, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute flex items-center justify-center rounded-full border-[2.5px] border-ink bg-coin font-extrabold text-ink ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.43), ...style }}
    >
      $
    </span>
  );
}

/** Wrapper naik-turun pelan (kelas `bob` di desain). */
export function Bob({
  children,
  distance = 6,
  duration = 3200,
  delay = 0,
  className = "",
  style,
}: {
  children: ReactNode;
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`tk-bob ${className}`}
      style={{
        ...style,
        ["--bob" as string]: `${distance}px`,
        ["--bob-ms" as string]: `${duration}ms`,
        ["--delay" as string]: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Muncul membesar sekali (kelas `pop` di desain: 0.4 → 1.06 → 1). */
export function Pop({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`tk-pop ${className}`} style={style}>
      {children}
    </div>
  );
}

/** Titik hijau berdenyut untuk aktivitas yang baru terjadi (kelas `pulse`). */
export function PulseDot({ color = "var(--color-green)", size = 7 }: { color?: string; size?: number }) {
  return (
    <span aria-hidden="true" className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="tk-pulse-ring absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

const PIECES = [
  { left: 24, color: "var(--color-orange)", ms: 5200, delay: 0 },
  { left: 70, color: "var(--color-mint-bright)", ms: 6100, delay: 1200 },
  { left: 118, color: "var(--color-coin)", ms: 4800, delay: 500 },
  { left: 166, color: "var(--color-lilac)", ms: 5600, delay: 2000 },
  { left: 214, color: "var(--color-orange)", ms: 6400, delay: 900 },
  { left: 262, color: "var(--color-mint-bright)", ms: 5000, delay: 2600 },
  { left: 310, color: "var(--color-coin)", ms: 5800, delay: 200 },
  { left: 352, color: "var(--color-lilac)", ms: 4600, delay: 1600 },
  { left: 44, color: "var(--color-coin)", ms: 6600, delay: 3100 },
  { left: 238, color: "var(--color-orange)", ms: 5400, delay: 3600 },
];

/** Confetti jatuh untuk layar Settled. Taruh di dalam elemen `relative`. */
export function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="tk-fall absolute top-0 h-[14px] w-[9px] rounded-[3px]"
          style={{
            left: p.left,
            backgroundColor: p.color,
            ["--fall-ms" as string]: `${p.ms}ms`,
            ["--delay" as string]: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
