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

/** Ikon brand: maskot Teko tanpa latar — bentuk sama persis dengan apps/mobile/assets/tekosoe-mark.svg. */
export function TekoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="9 28 180 180" className={className} aria-hidden="true" focusable="false">
      <path d="M56 118 Q30 114 25 88" fill="none" stroke="#2a3436" strokeWidth="24" strokeLinecap="round" />
      <path d="M56 118 Q30 114 25 88" fill="none" stroke="#9fe0cf" strokeWidth="15" strokeLinecap="round" />
      <path d="M146 104 C180 98 182 152 146 152" fill="none" stroke="#2a3436" strokeWidth="14" strokeLinecap="round" />
      <path d="M146 104 C180 98 182 152 146 152" fill="none" stroke="#9fe0cf" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="76" cy="174" rx="13" ry="8" fill="#86d2bf" stroke="#2a3436" strokeWidth="4" />
      <ellipse cx="124" cy="174" rx="13" ry="8" fill="#86d2bf" stroke="#2a3436" strokeWidth="4" />
      <path d="M42 134 C42 94 68 80 100 80 C132 80 158 94 158 134 C158 166 134 178 100 178 C66 178 42 166 42 134 Z" fill="#9fe0cf" stroke="#2a3436" strokeWidth="4.5" />
      <ellipse cx="100" cy="162" rx="34" ry="11" fill="#c9f0e4" />
      <path d="M56 114 Q60 98 74 91" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
      <path d="M68 86 C68 66 132 66 132 86 Z" fill="#9fe0cf" stroke="#2a3436" strokeWidth="4.5" strokeLinejoin="round" />
      <rect x="62" y="82" width="76" height="9" rx="4.5" fill="#86d2bf" stroke="#2a3436" strokeWidth="4.5" />
      <circle cx="100" cy="62" r="9" fill="#ff9a62" stroke="#2a3436" strokeWidth="4" />
      <circle cx="97" cy="59" r="2.5" fill="#ffffff" />
      <ellipse cx="80" cy="128" rx="7" ry="8.5" fill="#2a3436" />
      <ellipse cx="120" cy="128" rx="7" ry="8.5" fill="#2a3436" />
      <circle cx="82.5" cy="124.5" r="2.6" fill="#ffffff" />
      <circle cx="122.5" cy="124.5" r="2.6" fill="#ffffff" />
      <ellipse cx="64" cy="142" rx="9" ry="5.5" fill="#ffb3a1" opacity="0.85" />
      <ellipse cx="136" cy="142" rx="9" ry="5.5" fill="#ffb3a1" opacity="0.85" />
      <path d="M93 140 Q96.5 145 100 140 Q103.5 145 107 140" fill="none" stroke="#2a3436" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
