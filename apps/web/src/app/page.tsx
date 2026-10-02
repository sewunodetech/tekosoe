import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Teko } from '@/components/Teko';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#1d2426] flex flex-col selection:bg-[#dcf0ea]">
      {/* Top Navbar */}
      <header className="max-w-5xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Logo size={24} />
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/sewunodetech/tekosoe"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#5f6b6d] hover:text-[#1d2426] transition-colors hidden sm:inline"
          >
            GitHub
          </a>
          <Link
            href="/j/japan"
            className="px-4 py-2 bg-[#1f7a6e] hover:bg-[#16574e] text-white text-sm font-display font-bold rounded-full transition-colors shadow-sm"
          >
            Trip Invite Demo
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 sm:py-12 flex flex-col items-center text-center gap-6">
        
        {/* Animated Mascot Hero Stage */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-[#dcf0ea] -z-10 animate-pulse duration-1000" />
          <div className="absolute -top-1 right-6 text-xl select-none animate-bounce">
            ✨
          </div>
          <div className="absolute bottom-4 left-6 text-lg text-[#ff9a62] select-none">
            ✦
          </div>
          <Teko mood="cheer" size={170} />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dcf0ea] text-[#16574e] text-xs font-bold tracking-wide uppercase">
          ⚡ For friends travelling across borders
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-2xl text-[#1d2426]">
          One pot for the whole trip. It settles up by itself.
        </h1>

        <p className="text-base sm:text-xl text-[#5f6b6d] max-w-xl leading-relaxed">
          Everyone puts dollars into one shared pot, from any country. Anyone can pay from it, and on the last day Tekosoe works out who owes whom and pays everyone back.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto pt-2">
          <Link
            href="/j/japan"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#1f7a6e] hover:bg-[#16574e] text-white text-base font-display font-bold rounded-2xl transition-all shadow-md active:scale-98"
          >
            Open Invite Demo
          </Link>
          <Link
            href="/v/TK-84920"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#1d2426] border border-[#e6e2d8] text-base font-display font-bold rounded-2xl hover:bg-[#f1eee6] transition-all shadow-sm active:scale-98"
          >
            Verify Invoice
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full mt-8 text-left">
          <div className="p-6 rounded-3xl bg-white border border-[#e6e2d8] shadow-sm flex flex-col gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#dcf0ea] flex items-center justify-center text-[#1f7a6e] text-xl font-bold">
              🔑
            </div>
            <h3 className="font-display font-extrabold text-lg text-[#1d2426]">Sign in with a passkey</h3>
            <p className="text-sm text-[#5f6b6d] leading-relaxed">
              Log in with your device passkey: Face ID, fingerprint or PIN. Nothing to install, nothing to pay for.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#e6e2d8] shadow-sm flex flex-col gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffe8da] flex items-center justify-center text-[#ff9a62] text-xl font-bold">
              🍵
            </div>
            <h3 className="font-display font-extrabold text-lg text-[#1d2426]">One Shared Pot</h3>
            <p className="text-sm text-[#5f6b6d] leading-relaxed">
              Everyone sees every payment as it happens. Big payments wait for one friend to say yes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#e6e2d8] shadow-sm flex flex-col gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#cfe9e1] flex items-center justify-center text-[#16574e] text-xl font-bold">
              🧾
            </div>
            <h3 className="font-display font-extrabold text-lg text-[#1d2426]">Settles up by itself</h3>
            <p className="text-sm text-[#5f6b6d] leading-relaxed">
              No chasing friends for money. Everyone gets an invoice, and anyone can check it hasn&apos;t been changed.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto px-6 py-8 border-t border-[#e6e2d8] text-center text-xs text-[#5f6b6d]">
        Built for the Monad Metropolis Hackathon · Consumer Products & Payments
      </footer>
    </div>
  );
}
