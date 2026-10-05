import Link from "next/link";
import { cn } from "@/lib/cn";

/** Pemilih anggota di invoice: pil putih bergaris, yang aktif teal. State ada di URL (tautan). */
export function Segmented({
  options,
  activeId,
  label = "View as",
}: {
  options: { id: string; label: string; href: string }[];
  activeId: string;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="flex gap-1.5 py-0.5">
      {options.map((o) => {
        const active = o.id === activeId;
        return (
          <Link
            key={o.id}
            href={o.href}
            replace
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center rounded-2xl border px-1 py-2 text-center text-xs transition-colors",
              active ? "border-teal bg-teal font-extrabold text-white" : "border-line bg-white font-bold text-slate hover:bg-sand",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
