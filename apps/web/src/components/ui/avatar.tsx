import { cn } from "@/lib/cn";

/** Enam warna avatar dari theme.ts `avatarColors`. */
export const AVATAR_TINTS = ["bg-apricot", "bg-green-soft", "bg-sky", "bg-violet-soft", "bg-butter", "bg-peach-soft"] as const;
export type AvatarTint = (typeof AVATAR_TINTS)[number];

type Props = {
  name: string;
  size?: number;
  tint?: AvatarTint;
  /** Warna cincin (kelas `border-*`), dipakai di AvatarStack. */
  ring?: string;
  className?: string;
};

/** Lingkaran berinisial untuk anggota trip. */
export function Avatar({ name, size = 34, tint = "bg-apricot", ring, className }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-ink",
        tint,
        ring && `border-2 ${ring}`,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
