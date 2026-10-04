'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Teko } from '@/components/Teko';
import { Logo } from '@/components/Logo';
import { androidApkUrl, apiUrl } from '@/lib/site';

/** Kode undangan = `<groupId>-<rahasia>` (apps/mobile/src/lib/invite.ts). Rahasia tidak dikirim ke mana pun. */
function groupIdFromCode(code: string): string | null {
  const id = code.split('-')[0];
  return /^\d+$/.test(id) ? id : null;
}

/**
 * Link undangan https://<domain>/j/<kode>. Kalau app terpasang, Android App Links / iOS Universal Links
 * membuka app langsung dan halaman ini tidak terlihat. Kalau belum, halaman ini menawarkan unduh app.
 */
export default function InviteWebPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const deepLink = `tekosoe://invite/${code}`;
  const groupId = groupIdFromCode(code);
  const [tripName, setTripName] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    let alive = true;
    fetch(`${apiUrl}/api/groups/${groupId}/meta`)
      .then((res) => (res.ok ? res.json() : null))
      .then((meta: { name?: string } | null) => alive && meta?.name && setTripName(meta.name))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [groupId]);

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#1d2426] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#dcf0ea]">
      <div className="max-w-[420px] w-full flex flex-col gap-5">
        <div className="h-[250px] rounded-[30px] bg-[#dcf0ea] relative overflow-hidden flex flex-col items-center justify-center shadow-sm">
          <div className="absolute top-5 left-5">
            <Logo size={20} dot={false} />
          </div>
          <div className="absolute left-14 top-20 text-[#ff9a62] text-xl select-none animate-pulse">✦</div>
          <div className="absolute right-14 top-14 text-[#ffd66b] text-base select-none animate-pulse">✦</div>
          <div className="mt-4">
            <Teko mood="love" size={150} />
          </div>
        </div>

        <div className="flex flex-col gap-1 px-1">
          <span className="text-sm font-semibold text-[#5f6b6d]">You&apos;re invited to</span>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-[#1d2426]">
            {tripName ?? 'a trip on Tekosoe'}
          </h1>
          <p className="text-sm text-[#5f6b6d] mt-1">
            One pot for the whole trip. Everyone chips in, anyone can pay, and Teko settles everyone up on the last day.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <a
            href={deepLink}
            className="w-full h-14 bg-[#1f7a6e] hover:bg-[#16574e] text-white font-display font-bold text-base rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-[0.99]"
          >
            Open in Tekosoe
          </a>
          <a
            href={androidApkUrl}
            className="w-full h-12 bg-white border border-[#e6e2d8] text-[#1d2426] font-bold text-sm rounded-2xl flex items-center justify-center hover:bg-[#f1eee6] transition-all"
          >
            Get the app for Android
          </a>
          <span className="text-xs text-[#5f6b6d] text-center font-medium">
            No app yet? Install it, then open this link again. Your account is created with your passkey as you join.
          </span>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs font-semibold text-[#1f7a6e] hover:underline">
            About Tekosoe
          </Link>
        </div>
      </div>
    </div>
  );
}
