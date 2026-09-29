import type { ReactNode } from "react";

/**
 * Bingkai mobile-only untuk semua halaman app-like (dashboard, undangan, verifikasi).
 * Satu kolom maks. 430px; di layar lebar tampil sebagai bingkai ponsel di tengah.
 * Landing (`/`) tidak memakai ini — ia full-bleed.
 */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-ivory md:my-6 md:min-h-[min(880px,calc(100dvh-3rem))] md:rounded-[44px] md:border md:border-line md:shadow-[0_24px_60px_rgba(29,36,38,0.12)]">
      {children}
    </div>
  );
}
