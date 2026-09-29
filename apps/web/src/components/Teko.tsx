type Props = {
  mood?: 'idle' | 'love' | 'cheer' | 'think';
  size?: number;
};

export function Teko({ mood = 'idle', size = 120 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      {/* Steam / Stars effects */}
      {mood === 'idle' && (
        <g opacity="0.6">
          <path d="M96 28 C92 20 102 12 98 4" stroke="#1f7a6e" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M106 32 C102 24 112 16 108 8" stroke="#1f7a6e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      )}
      {mood === 'love' && (
        <g fill="#ff9a62">
          <path d="M70 42 C70 38 74 34 78 37 C82 34 86 38 86 42 C86 47 78 52 78 52 C78 52 70 47 70 42 Z" />
          <path d="M134 32 C134 29 137 26 140 28 C143 26 146 29 146 32 C146 36 140 40 140 40 C140 40 134 36 134 32 Z" transform="scale(0.8) translate(30 0)" />
        </g>
      )}
      {mood === 'cheer' && (
        <g fill="#ffd66b">
          <path d="M60 40 L64 48 L72 52 L64 56 L60 64 L56 56 L48 52 L56 48 Z" />
          <path d="M145 35 L148 41 L154 44 L148 47 L145 53 L142 47 L136 44 L142 41 Z" />
        </g>
      )}

      {/* Handle (right) */}
      <path
        d="M142 86 C172 86 172 144 138 144"
        stroke="#1d2426"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      {/* Spout (left) */}
      <path
        d="M62 122 C44 116 34 94 38 78 C42 76 50 82 54 86 C48 98 54 110 66 114"
        fill="#cfe9e1"
        stroke="#1d2426"
        strokeWidth="8"
        strokeLinejoin="round"
      />

      {/* Main Body */}
      <ellipse
        cx="102"
        cy="124"
        rx="52"
        ry="42"
        fill="#cfe9e1"
        stroke="#1d2426"
        strokeWidth="8"
      />

      {/* Lid & Knob */}
      <g>
        <circle cx="102" cy="74" r="7" fill="#ff9a62" stroke="#1d2426" strokeWidth="5" />
        <path
          d="M74 86 C74 80 86 78 102 78 C118 78 130 80 130 86 Z"
          fill="#bfe4da"
          stroke="#1d2426"
          strokeWidth="7"
          strokeLinejoin="round"
        />
      </g>

      {/* Eyes & Mouth */}
      {mood === 'love' ? (
        <g fill="#ff9a62">
          {/* Heart eyes */}
          <path d="M85 116 C85 112 89 108 93 111 C97 108 101 112 101 116 C101 121 93 126 93 126 C93 126 85 121 85 116 Z" transform="scale(0.8) translate(14 16)" />
          <path d="M125 116 C125 112 129 108 133 111 C137 108 141 112 141 116 C141 121 133 126 133 126 C133 126 125 121 125 116 Z" transform="scale(0.8) translate(14 16)" />
          {/* Cute open smile */}
          <path d="M98 126 Q103 132 108 126" stroke="#1d2426" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <g>
          {/* Eyes */}
          <circle cx="88" cy="116" r="4.5" fill="#1d2426" />
          <circle cx="118" cy="116" r="4.5" fill="#1d2426" />
          {/* Eye shine */}
          <circle cx="86.5" cy="114.5" r="1.5" fill="#ffffff" />
          <circle cx="116.5" cy="114.5" r="1.5" fill="#ffffff" />
          {/* Mouth */}
          <path d="M98 122 Q103 127 108 122" stroke="#1d2426" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* Blush Cheeks */}
      <circle cx="78" cy="122" r="5" fill="#ffe0cc" />
      <circle cx="128" cy="122" r="5" fill="#ffe0cc" />
    </svg>
  );
}
