import type { CSSProperties, ReactNode } from "react";

/**
 * Teko, maskot Tekosue — port dari apps/mobile/src/components/teko.tsx (10 ekspresi).
 * Gambar tiap pose sama persis dengan app; gerakan naik-turun dan goyang memakai CSS
 * (`.tk-bob`, `.tk-sway` di globals.css) sehingga mati otomatis saat "reduce motion".
 */
export type TekoMood =
  | "idle"
  | "cheer"
  | "pour"
  | "fill"
  | "wink"
  | "love"
  | "think"
  | "worry"
  | "sad"
  | "sleep";

type EyeKind = "open" | "look" | "happy" | "wink" | "sleep" | "heart";
type MouthKind = "cat" | "open" | "o" | "tongue" | "wavy" | "frown" | "hmm" | "snore";
type Fx = "steam" | "spark" | "pour" | "fill" | "hearts" | "think" | "sweat" | "tear" | "zzz" | "none";

type Pose = {
  eyes: EyeKind;
  mouth: MouthKind;
  fx: Fx;
  open?: boolean;
  brows?: boolean;
  blush?: boolean;
  /** Transform badan Teko (di dalam viewBox 200). */
  body?: string;
  /** Transform tutup teko. */
  lid: string;
  /** Sudut goyang (derajat) dan durasi satu siklus (ms). */
  sway: number;
  swayMs: number;
  label: string;
};

const POSES: Record<TekoMood, Pose> = {
  idle: { eyes: "open", mouth: "cat", fx: "steam", lid: "", sway: 2.5, swayMs: 3600, label: "Teko, happy and ready" },
  cheer: {
    eyes: "happy",
    mouth: "open",
    fx: "spark",
    open: true,
    lid: "translate(0 -16) rotate(-10 100 82)",
    sway: 6,
    swayMs: 1100,
    label: "Teko cheering",
  },
  pour: {
    eyes: "happy",
    mouth: "cat",
    fx: "pour",
    body: "translate(54.5 30) translate(15.5 54.6) rotate(-32) translate(-15.5 -54.6) scale(0.62)",
    lid: "",
    sway: 0,
    swayMs: 3000,
    label: "Teko filling all three glasses",
  },
  fill: {
    eyes: "open",
    mouth: "o",
    fx: "fill",
    open: true,
    lid: "translate(20 -22) rotate(26 100 82)",
    sway: 1.5,
    swayMs: 2400,
    label: "Teko receiving coins",
  },
  wink: { eyes: "wink", mouth: "tongue", fx: "none", lid: "translate(-3 -3) rotate(-9 100 82)", sway: 3, swayMs: 2600, label: "Teko winking" },
  love: { eyes: "heart", mouth: "open", fx: "hearts", blush: true, lid: "translate(0 -6)", sway: 3, swayMs: 2000, label: "Teko in love" },
  think: {
    eyes: "look",
    mouth: "hmm",
    fx: "think",
    body: "rotate(-5 100 176)",
    lid: "rotate(6 100 82)",
    sway: 1.5,
    swayMs: 3400,
    label: "Teko thinking",
  },
  worry: { eyes: "open", mouth: "wavy", fx: "sweat", brows: true, lid: "", sway: 1.2, swayMs: 450, label: "Teko a little worried" },
  sad: {
    eyes: "open",
    mouth: "frown",
    fx: "tear",
    brows: true,
    body: "translate(0 4)",
    lid: "translate(-2 2) rotate(-7 100 82)",
    sway: 0.8,
    swayMs: 4000,
    label: "Teko sad",
  },
  sleep: { eyes: "sleep", mouth: "snore", fx: "zzz", lid: "translate(5 -1) rotate(10 100 82)", sway: 1.2, swayMs: 4800, label: "Teko sleeping" },
};

const INK = "#2a3436";
const BODY = "#9fe0cf";
const BODY_SHADE = "#86d2bf";
const TEA = "#ffc56b";
const HEART = "M0 7 C-14 -2 -10 -13 -3 -11 C-1.5 -10.5 0 -8.5 0 -7 C0 -8.5 1.5 -10.5 3 -11 C10 -13 14 -2 0 7 Z";
const STAR = "M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z";
const DROP = "M0 -9 C5 -2 7 2 7 5 A7 7 0 0 1 -7 5 C-7 2 -5 -2 0 -9 Z";

type Props = {
  mood?: TekoMood;
  size?: number;
  /** Naik-turun pelan (kelas `bob` di desain). */
  bob?: boolean;
  className?: string;
};

export function Teko({ mood = "idle", size = 160, bob = true, className }: Props) {
  const pose = POSES[mood];
  const bobStyle = { "--bob": `${size * 0.04}px`, "--bob-ms": "3200ms", width: size, height: size } as CSSProperties;
  const swayStyle = { "--sway": `${pose.sway}deg`, "--sway-ms": `${pose.swayMs}ms` } as CSSProperties;

  const art =
    mood === "pour" ? (
      <PourArt size={size} pose={pose} />
    ) : (
      <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx={100} cy={186} rx={54} ry={7} fill="#1d2426" opacity={0.08} />
        <g transform={pose.body}>
          <Character pose={pose} />
        </g>
        <Effects fx={pose.fx} />
      </svg>
    );

  return (
    <div
      role="img"
      aria-label={pose.label}
      className={`${bob ? "tk-bob" : ""} ${className ?? ""}`}
      style={bobStyle}
    >
      {pose.sway > 0 ? (
        <div className="tk-sway" style={swayStyle}>
          {art}
        </div>
      ) : (
        art
      )}
    </div>
  );
}

function Character({ pose }: { pose: Pose }) {
  return (
    <g>
      {pose.fx === "steam" && (
        <g>
          <path d="M24 66 q-7 -8 0 -16 q7 -8 0 -16" fill="none" stroke="#8fcfbe" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
          <path d="M38 60 q-5 -6 0 -12 q5 -6 0 -12" fill="none" stroke="#8fcfbe" strokeWidth={3.5} strokeLinecap="round" opacity={0.5} />
        </g>
      )}
      {/* corong */}
      <path d="M56 118 Q30 114 25 88" fill="none" stroke={INK} strokeWidth={24} strokeLinecap="round" />
      <path d="M56 118 Q30 114 25 88" fill="none" stroke={BODY} strokeWidth={15} strokeLinecap="round" />
      {/* pegangan */}
      <path d="M146 104 C180 98 182 152 146 152" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d="M146 104 C180 98 182 152 146 152" fill="none" stroke={BODY} strokeWidth={5} strokeLinecap="round" />
      {/* kaki */}
      <ellipse cx={76} cy={174} rx={13} ry={8} fill={BODY_SHADE} stroke={INK} strokeWidth={4} />
      <ellipse cx={124} cy={174} rx={13} ry={8} fill={BODY_SHADE} stroke={INK} strokeWidth={4} />
      {/* badan */}
      <path
        d="M42 134 C42 94 68 80 100 80 C132 80 158 94 158 134 C158 166 134 178 100 178 C66 178 42 166 42 134 Z"
        fill={BODY}
        stroke={INK}
        strokeWidth={4.5}
      />
      <ellipse cx={100} cy={162} rx={34} ry={11} fill="#c9f0e4" />
      <path d="M56 114 Q60 98 74 91" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.75} />
      {pose.open && <ellipse cx={100} cy={84} rx={30} ry={6.5} fill="#2f4a46" />}
      {pose.fx === "fill" && (
        <g>
          <g transform="translate(0 6)">
            <circle cx={100} cy={36} r={11} fill="#ffd66b" stroke={INK} strokeWidth={3.5} />
            <path d="M100 30 v12 M96.5 33.5 h7" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          </g>
          <circle cx={94} cy={4} r={9} fill="#ffd66b" stroke={INK} strokeWidth={3.5} />
        </g>
      )}
      {/* tutup */}
      <g transform={pose.lid}>
        <path d="M68 86 C68 66 132 66 132 86 Z" fill={BODY} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <rect x={62} y={82} width={76} height={9} rx={4.5} fill={BODY_SHADE} stroke={INK} strokeWidth={4.5} />
        <circle cx={100} cy={62} r={9} fill="#ff9a62" stroke={INK} strokeWidth={4} />
        <circle cx={97} cy={59} r={2.5} fill="#ffffff" />
      </g>
      {pose.brows && (
        <g>
          <path d="M71 116 L87 110" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M113 110 L129 116" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      <Eyes kind={pose.eyes} />
      <ellipse cx={64} cy={142} rx={9} ry={5.5} fill="#ffb3a1" opacity={pose.blush ? 1 : 0.85} />
      <ellipse cx={136} cy={142} rx={9} ry={5.5} fill="#ffb3a1" opacity={pose.blush ? 1 : 0.85} />
      <Mouth kind={pose.mouth} />
      {pose.fx === "tear" && (
        <path d="M0 -7 C4 -1 5 2 5 4 A5 5 0 0 1 -5 4 C-5 2 -4 -1 0 -7 Z" transform="translate(73 148)" fill="#bfe3ff" stroke={INK} strokeWidth={2.5} />
      )}
    </g>
  );
}

function Eyes({ kind }: { kind: EyeKind }): ReactNode {
  switch (kind) {
    case "open":
      return (
        <g>
          <ellipse cx={80} cy={128} rx={7} ry={8.5} fill={INK} />
          <ellipse cx={120} cy={128} rx={7} ry={8.5} fill={INK} />
          <circle cx={82.5} cy={124.5} r={2.6} fill="#ffffff" />
          <circle cx={78} cy={131} r={1.2} fill="#ffffff" />
          <circle cx={122.5} cy={124.5} r={2.6} fill="#ffffff" />
          <circle cx={118} cy={131} r={1.2} fill="#ffffff" />
        </g>
      );
    case "look":
      return (
        <g>
          <ellipse cx={84} cy={124} rx={6.5} ry={7.5} fill={INK} />
          <ellipse cx={124} cy={124} rx={6.5} ry={7.5} fill={INK} />
          <circle cx={86.5} cy={121} r={2.4} fill="#ffffff" />
          <circle cx={126.5} cy={121} r={2.4} fill="#ffffff" />
        </g>
      );
    case "happy":
      return (
        <g>
          <path d="M72 131 Q80 120 88 131" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M112 131 Q120 120 128 131" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
        </g>
      );
    case "wink":
      return (
        <g>
          <path d="M72 131 Q80 120 88 131" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <ellipse cx={120} cy={128} rx={7} ry={8.5} fill={INK} />
          <circle cx={122.5} cy={124.5} r={2.6} fill="#ffffff" />
          <circle cx={118} cy={131} r={1.2} fill="#ffffff" />
        </g>
      );
    case "sleep":
      return (
        <g>
          <path d="M72 129 Q80 135 88 129" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M112 129 Q120 135 128 129" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case "heart":
      return (
        <g>
          <path d={HEART} transform="translate(80 128)" fill="#ff7a85" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d={HEART} transform="translate(120 128)" fill="#ff7a85" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        </g>
      );
  }
}

function Mouth({ kind }: { kind: MouthKind }): ReactNode {
  const line = { fill: "none", stroke: INK, strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (kind) {
    case "cat":
      return <path d="M93 140 Q96.5 145 100 140 Q103.5 145 107 140" {...line} />;
    case "open":
      return (
        <g>
          <path d="M90 139 Q100 156 110 139 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <ellipse cx={100} cy={144.5} rx={5} ry={2.6} fill="#ff8f7a" />
        </g>
      );
    case "o":
      return <ellipse cx={100} cy={144} rx={4.5} ry={5.5} fill={INK} />;
    case "tongue":
      return (
        <g>
          <path d="M101 142 q0 9 5 9 q5 0 5 -9 Z" fill="#ff8f7a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M90 140 Q100 148 112 139" {...line} />
        </g>
      );
    case "wavy":
      return <path d="M89 144 q3.5 -4 7 0 q3.5 4 7 0 q3.5 -4 7 0" {...line} />;
    case "frown":
      return <path d="M92 147 Q100 138 108 147" {...line} />;
    case "hmm":
      return <path d="M95 144 L107 141" {...line} />;
    case "snore":
      return <ellipse cx={100} cy={144} rx={3} ry={3.5} fill={INK} />;
  }
}

function Effects({ fx }: { fx: Fx }): ReactNode {
  switch (fx) {
    case "sweat":
      return <path d={DROP} transform="translate(154 96)" fill="#bfe3ff" stroke={INK} strokeWidth={3} />;
    case "zzz":
      return (
        <g fill="none" stroke="#6f8fcf" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M150 70 h10 l-10 10 h10" opacity={0.5} />
          <path d="M164 50 h13 l-13 13 h13" opacity={0.8} />
          <path d="M178 24 h15 l-15 15 h15" />
        </g>
      );
    case "think":
      return (
        <g>
          <circle cx={150} cy={84} r={4} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
          <circle cx={160} cy={68} r={6} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
          <rect x={148} y={22} width={48} height={32} rx={16} fill="#ffffff" stroke={INK} strokeWidth={3} />
          <circle cx={161} cy={38} r={3.5} fill={INK} opacity={0.3} />
          <circle cx={172} cy={38} r={3.5} fill={INK} opacity={0.65} />
          <circle cx={183} cy={38} r={3.5} fill={INK} />
        </g>
      );
    case "hearts":
      return (
        <g>
          <path d={HEART} transform="translate(168 62)" fill="#ff9aa3" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={HEART} transform="translate(30 70)" fill="#ffb3a1" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      );
    case "spark":
      return (
        <g>
          <path d={STAR} transform="translate(34 52)" fill="#ff9a62" />
          <path d={STAR} transform="translate(168 48) scale(0.8)" fill="#ffd66b" />
          <path d={STAR} transform="translate(178 128) scale(0.6)" fill="#b9aef5" />
          <path d={STAR} transform="translate(20 124) scale(0.6)" fill="#ffd66b" />
        </g>
      );
    default:
      return null;
  }
}

// --- Animasi "pour" (Welcome) -----------------------------------------------------------------
// Timeline 7 detik sama dengan app: Teko pindah ke tiap gelas, miring, aliran turun, gelas terisi
// bergantian, lalu semua kosong. Di web dipakai SMIL (seperti di desain asli). Saat "reduce motion"
// aktif, CSS menyembunyikan versi bergerak dan menampilkan frame diam (`.tk-still`).

const POUR_DUR = "7s";
const GLASS_X = [34, 70, 106] as const;
const GLASS_TINT = ["#ffdccb", "#cdeedd", "#d6e4ff"] as const;
/** [mulai isi, penuh] tiap gelas, sebagai fraksi dari 7 detik. */
const FILL = [
  [0.07, 0.2],
  [0.4, 0.53],
  [0.73, 0.86],
] as const;
/** [aliran muncul, aliran hilang]. */
const STREAM = [
  [0.08, 0.19],
  [0.41, 0.52],
  [0.74, 0.85],
] as const;
const MOVE_T = [0, 0.26, 0.295, 0.33, 0.59, 0.625, 0.66, 0.92, 0.96, 1];
const MOVE_X = [18.5, 18.5, 36.5, 54.5, 54.5, 72.5, 90.5, 90.5, 54.5, 18.5];
const MOVE_Y = [30, 30, 18, 30, 30, 18, 30, 30, 8, 30];
const TILT_T = [0, 0.05, 0.22, 0.26, 0.295, 0.33, 0.38, 0.55, 0.59, 0.625, 0.66, 0.71, 0.88, 0.92, 0.96, 1];
const TILT = [-6, -32, -32, -6, 4, -6, -32, -32, -6, 4, -6, -32, -32, -6, 6, -6];

const kt = (a: number[]) => a.join(";");

function glassPath(x: number) {
  return `M${x - 13} 146 L${x + 13} 146 L${x + 11} 180 Q${x} 183 ${x - 11} 180 Z`;
}

function PourArt({ size, pose }: { size: number; pose: Pose }) {
  return (
    <>
      <svg className="tk-motion" width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        {GLASS_X.map((x, i) => (
          <path key={x} d={glassPath(x)} fill={GLASS_TINT[i]} />
        ))}
        {GLASS_X.map((x, i) => {
          const [f0, f1] = FILL[i];
          const [s0, s1] = STREAM[i];
          const fillT = [0, f0, f1, 0.94, 0.99, 1];
          return (
            <g key={x}>
              <rect x={x - 10.5} width={21} fill={TEA} y={178} height={0}>
                <animate attributeName="height" dur={POUR_DUR} repeatCount="indefinite" keyTimes={kt(fillT)} values="0;0;24;24;0;0" />
                <animate attributeName="y" dur={POUR_DUR} repeatCount="indefinite" keyTimes={kt(fillT)} values="178;178;154;154;178;178" />
              </rect>
              <g opacity={0}>
                <animate attributeName="opacity" dur={POUR_DUR} repeatCount="indefinite" keyTimes={kt([0, s0 - 0.015, s0, s1, s1 + 0.015, 1])} values="0;0;1;1;0;0" />
                <rect x={x - 4.5} y={86} width={9} height={64} rx={4.5} fill={INK} />
                <rect x={x - 2.5} y={88} width={5} height={60} rx={2.5} fill={TEA} />
              </g>
              <path opacity={0} transform={`translate(${x + 12} 138)`} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#ffd66b" stroke={INK} strokeWidth={1.5}>
                <animate attributeName="opacity" dur={POUR_DUR} repeatCount="indefinite" keyTimes={kt([0, f1, f1 + 0.03, f1 + 0.1, 1])} values="0;0;1;0;0" />
              </path>
            </g>
          );
        })}
        {GLASS_X.map((x) => (
          <g key={x}>
            <path d={glassPath(x)} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
            <path d={`M${x - 8} 152 L${x - 7} 172`} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
          </g>
        ))}
        <g>
          <animateTransform attributeName="transform" type="translate" dur={POUR_DUR} repeatCount="indefinite" keyTimes={kt(MOVE_T)} values={MOVE_X.map((x, i) => `${x} ${MOVE_Y[i]}`).join(";")} />
          <g transform="translate(15.5 54.6)">
            <g>
              <animateTransform attributeName="transform" type="rotate" dur={POUR_DUR} repeatCount="indefinite" keyTimes={kt(TILT_T)} values={kt(TILT)} />
              <g transform="translate(-15.5 -54.6) scale(0.62)">
                <Character pose={pose} />
              </g>
            </g>
          </g>
        </g>
      </svg>
      <svg className="tk-still" width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <StillGlasses />
        <g transform={pose.body}>
          <Character pose={pose} />
        </g>
      </svg>
    </>
  );
}

/** Frame diam pose "pour": gelas pertama penuh, gelas tengah sedang dituang. */
function StillGlasses() {
  const glass = (x: number, tint: string, level: number) => (
    <g key={x}>
      <path d={glassPath(x)} fill={tint} />
      {level > 0 && <rect x={x - 10.5} y={178 - level} width={21} height={level} fill={TEA} />}
      <path d={glassPath(x)} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={`M${x - 8} 152 L${x - 7} 172`} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
    </g>
  );

  return (
    <g>
      {glass(34, "#ffdccb", 24)}
      {glass(70, "#cdeedd", 12)}
      {glass(106, "#d6e4ff", 0)}
      <path d="M70 88 L70 164" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M70 88 L70 164" stroke={TEA} strokeWidth={5} strokeLinecap="round" />
      <circle cx={63} cy={140} r={2.2} fill={TEA} stroke={INK} strokeWidth={1.4} />
      <circle cx={77} cy={142} r={1.8} fill={TEA} stroke={INK} strokeWidth={1.4} />
    </g>
  );
}
