import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "ghost" | "dashed" | "pill";

const base = "inline-flex items-center justify-center gap-2 rounded-button font-bold transition-colors select-none";

/**
 * Tombol dari desain (apps/mobile/src/components/ui/button.tsx):
 * - primary: teal penuh, tinggi 56 (CTA utama)
 * - outline: putih bergaris, tinggi 52
 * - ghost: teks teal, tinggi 44
 * - dashed: garis putus-putus
 * - pill: pil putih kecil
 */
const variants: Record<ButtonVariant, string> = {
  primary: "h-14 w-full bg-teal text-base text-white hover:bg-teal-deep active:bg-teal-deep",
  outline: "h-[52px] w-full border-[1.5px] border-line bg-white text-[15px] text-ink hover:bg-sand active:bg-sand",
  ghost: "h-11 w-full text-base text-teal hover:opacity-70 active:opacity-60",
  dashed: "min-h-14 w-full border-[1.5px] border-dashed border-line-strong px-3.5 text-sm text-ink hover:bg-sand active:bg-sand",
  pill: "h-11 rounded-[22px] bg-white px-[18px] text-sm text-ink hover:bg-sand active:bg-sand",
};

/** Kelas tombol untuk elemen yang bukan <Button> (mis. pemicu AppAction). */
export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

type Common = {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  className?: string;
};

type LinkProps = Common & { href: string; external?: boolean };
type NativeProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & { href?: undefined };

export function Button(props: LinkProps | NativeProps) {
  const { label, variant = "primary", icon, className } = props;
  const classes = cn(base, variants[variant], className);
  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );

  if (props.href !== undefined) {
    // Deep link (tekosue://) dan URL luar memakai <a> biasa; rute internal memakai next/link.
    const external = props.external || /^[a-z][a-z0-9+.-]*:/i.test(props.href);
    return external ? (
      <a href={props.href} className={classes}>
        {content}
      </a>
    ) : (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { label: _l, variant: _v, icon: _i, className: _c, href: _h, ...rest } = props;
  return (
    <button type="button" className={cn(classes, "disabled:opacity-50")} {...rest}>
      {content}
    </button>
  );
}
