"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../icons";
import { cn } from "@/lib/cn";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/trips", label: "Trips", icon: "home" },
  { href: "/card", label: "Card", icon: "card" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

/** Tab bar bawah: putih, tinggi 80, ikon 22 + label 11 ExtraBold (apps/mobile/src/app/(tabs)/_layout.tsx). */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-10 flex h-20 shrink-0 items-start justify-around bg-white pt-2.5 pb-[env(safe-area-inset-bottom)] md:rounded-b-[44px]"
    >
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex w-24 flex-col items-center gap-1 text-[11px] font-extrabold", active ? "text-teal" : "text-slate-light")}
          >
            <Icon name={t.icon} size={22} strokeWidth={active ? 2.4 : 2} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
