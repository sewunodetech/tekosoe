/** Wordmark "tekosoe" teal + titik oranye — port dari apps/mobile/src/components/logo.tsx. */
export function Logo({ size = 24, dot = true }: { size?: number; dot?: boolean }) {
  const dotSize = Math.max(6, Math.round(size / 3));
  return (
    <div className="flex select-none items-center gap-1.5" role="img" aria-label="Tekosoe">
      <span
        className="font-display font-bold text-teal"
        style={{ fontSize: size, lineHeight: `${size * 1.2}px`, letterSpacing: -size / 48 }}
        aria-hidden="true"
      >
        tekosoe
      </span>
      {dot && (
        <span
          className="inline-block rounded-full bg-orange"
          style={{ width: dotSize, height: dotSize }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
