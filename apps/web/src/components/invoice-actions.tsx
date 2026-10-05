"use client";

import { useState } from "react";
import { Button } from "./ui/button";

/** "Save as PDF" — membuka dialog cetak browser (pilih "Save as PDF"). */
export function PrintButton({ className }: { className?: string }) {
  return <Button label="Save as PDF" variant="outline" className={className} onClick={() => window.print()} />;
}

/** "Share" — lembar bagikan bawaan ponsel; kalau tidak ada, salin tautan. */
export function ShareButton({ title, url, className }: { title: string; url: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // pengguna menutup lembar bagikan
    }
  }

  return <Button label={copied ? "Link copied" : "Share"} className={`h-[52px]! ${className ?? ""}`} onClick={share} />;
}
