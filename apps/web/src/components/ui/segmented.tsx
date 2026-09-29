import Link from "next/link";
import { cn } from "@/lib/cn";

/** Kontrol segmen berbasis tautan (state di query string) — track sand, pil aktif teal. */
export function Segmented({
  options,
  activeId,
}: {
  options: { id: string; label: string; href: string }[];
  activeId: string;
}) {
  return (
    <nav aria-label="View as" className="flex gap-1 rounded-[18px] bg-sand p-1">
      {options.map((o) => (
        <Link
          key={o.id}
          href={o.href}
          replace
          scroll={false}
          aria-current={o.id === activeId ? "true" : undefined}
          className={cn(
            "flex h-10 flex-1 items-center justify-center rounded-[14px] px-2 text-center text-[13px] font-bold transition-colors",
            o.id === activeId ? "bg-teal text-white" : "text-slate hover:text-ink",
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
