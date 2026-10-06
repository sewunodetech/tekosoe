"use client";

import { useSyncExternalStore } from "react";
import { Download, Smartphone } from "lucide-react";

type Platform = "android" | "ios" | "other";

const subscribe = () => () => {};
const detect = (): Platform => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
};

/**
 * Tombol unduh di /get-app. Android: unduh langsung. iPhone: belum ada build, jadi tampil catatan.
 * Laptop: tombol tetap ada, tapi petunjuknya mengarah ke QR (pindai dengan HP).
 */
export function DownloadButtons({ apkUrl }: { apkUrl: string }) {
  const platform = useSyncExternalStore(subscribe, detect, () => "other" as Platform);

  return (
    <div className="flex flex-col items-center gap-3 lg:items-start">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <a
          href={apkUrl}
          className="lg-btn inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-base font-medium text-white transition-transform hover:-translate-y-0.5"
        >
          <Download className="h-5 w-5" aria-hidden="true" />
          Download for Android
        </a>
        <span
          className="lg-glass inline-flex cursor-default items-center gap-2.5 rounded-full px-6 py-3.5 text-base font-medium text-gray-500"
          aria-disabled="true"
        >
          <Smartphone className="h-5 w-5" aria-hidden="true" />
          iPhone · coming soon
        </span>
      </div>
      <p className="text-sm text-gray-600" aria-live="polite">
        {platform === "android"
          ? "You're on Android. Tap download, then open the file to install."
          : platform === "ios"
            ? "The iPhone app isn't ready yet. You can still look around the demo on this site."
            : "On a computer? Scan the code with your Android phone to download it there."}
      </p>
    </div>
  );
}
