'use client';

import { use } from 'react';
import Link from 'next/link';
import { Teko } from '@/components/Teko';
import { Logo } from '@/components/Logo';

export default function InviteWebPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const deepLink = `tekosoe://invite/${code}`;

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#1d2426] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#dcf0ea]">
      <div className="max-w-[420px] w-full flex flex-col gap-5">
        
        {/* Hero Card matching Mobile F05Invite */}
        <div className="h-[250px] rounded-[30px] bg-[#dcf0ea] relative overflow-hidden flex flex-col items-center justify-center shadow-sm">
          <div className="absolute top-5 left-5">
            <Logo size={20} dot={false} />
          </div>

          {/* Sparkles */}
          <div className="absolute left-14 top-20 text-[#ff9a62] text-xl select-none animate-pulse">
            ✦
          </div>
          <div className="absolute right-14 top-14 text-[#ffd66b] text-base select-none animate-pulse">
            ✦
          </div>

          {/* Teko Mascot */}
          <div className="mt-4 transform hover:scale-105 transition-transform duration-300">
            <Teko mood="love" size={150} />
          </div>
        </div>

        {/* Invite Title Stack */}
        <div className="flex flex-col gap-1 px-1">
          <span className="text-sm font-semibold text-[#5f6b6d]">
            Jack invited you to
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-[#1d2426]">
            Japan Trip
          </h1>
        </div>

        {/* Members Preview Surface */}
        <div className="bg-white rounded-3xl p-5 border border-[#e6e2d8] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#ff9a62] text-white flex items-center justify-center font-bold text-sm">
                J
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#1d2426]">Jack</span>
                <span className="text-xs text-[#5f6b6d]">Tokyo, Japan</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#f1eee6] text-[#5f6b6d] text-xs font-bold">
              Organizer
            </span>
          </div>

          <div className="h-px bg-[#f1eee6] w-full" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#cfe9e1] text-[#16574e] flex items-center justify-center font-bold text-sm">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#1d2426]">Rina</span>
              <span className="text-xs text-[#5f6b6d]">Kyoto, Japan</span>
            </div>
          </div>
        </div>

        {/* Facts Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3 border border-[#e6e2d8] flex flex-col">
            <span className="text-xs text-[#5f6b6d]">Ends</span>
            <span className="font-display font-extrabold text-sm text-[#1d2426]">Oct 14</span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-[#e6e2d8] flex flex-col">
            <span className="text-xs text-[#5f6b6d]">In the pot</span>
            <span className="font-display font-extrabold text-sm text-[#1d2426]">$200</span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-[#e6e2d8] flex flex-col">
            <span className="text-xs text-[#5f6b6d]">Approval</span>
            <span className="font-display font-extrabold text-sm text-[#1d2426]">Over $100</span>
          </div>
        </div>

        {/* Action Button & Caption */}
        <div className="flex flex-col gap-2.5 pt-2">
          <a
            href={deepLink}
            className="w-full h-14 bg-[#1f7a6e] hover:bg-[#16574e] text-white font-display font-bold text-base rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-[0.99]"
          >
            Open in Tekosoe App
          </a>
          <span className="text-xs text-[#5f6b6d] text-center font-medium">
            New here? Your account is created as you join with your passkey.
          </span>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link href="/" className="text-xs font-semibold text-[#1f7a6e] hover:underline">
            About Tekosoe
          </Link>
        </div>

      </div>
    </div>
  );
}
