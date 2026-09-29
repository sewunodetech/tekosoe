import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../icons";

type Props = {
  title?: string;
  /** Tujuan tombol bulat di kiri. */
  href: string;
  /** "back" untuk layar biasa, "close" untuk modal. */
  action?: "back" | "close";
  right?: ReactNode;
};

/** Header layar: tombol bulat putih 44px + judul Bricolage 20px. */
export function ScreenHeader({ title, href, action = "back", right }: Props) {
  return (
    <header className="flex h-12 items-center gap-3">
      <Link
        href={href}
        aria-label={action === "back" ? "Back" : "Close"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-sand"
      >
        <Icon name={action} />
      </Link>
      <h1 className="type-h3 min-w-0 flex-1 truncate">{title}</h1>
      {right}
    </header>
  );
}
