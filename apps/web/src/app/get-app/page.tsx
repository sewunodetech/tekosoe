import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import QRCode from "qrcode";
import { ArrowRight, Download, Info, Lock, MailOpen, ScanFace, ShieldCheck, Smartphone, Wifi, type LucideIcon } from "lucide-react";
import { TekoMark } from "@/components/Logo";
import { Teko } from "@/components/Teko";
import { DownloadButtons } from "@/components/landing/DownloadButtons";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Sections";
import { androidApkUrl } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Get the app",
  description: "Install the Tekosue preview on Android, sign in with your passkey, and join your friends' trip pot.",
};

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Download, title: "Download the app", body: "Tap “Download for Android” on your phone, or scan the code from your computer." },
  { icon: ShieldCheck, title: "Allow the install", body: "It's a preview, so it doesn't come from the Play Store yet. Android asks once to allow installs from your browser." },
  { icon: ScanFace, title: "Sign in with your passkey", body: "Open Tekosue and confirm with your fingerprint or face. No password, nothing to write down." },
  { icon: MailOpen, title: "Join your trip", body: "Open the invite link a friend sent you. Tekosue goes straight to the trip so you can join." },
];

const NEEDS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Smartphone, title: "An Android phone", body: "The iPhone app is on the way." },
  { icon: Lock, title: "A screen lock", body: "PIN, fingerprint or face. Your passkey is kept by Google Password Manager." },
  { icon: Wifi, title: "An internet connection", body: "To join trips, pay and see the pot update." },
];

/** QR ke file APK, dibuat saat build (halaman tetap statis). */
async function apkQr() {
  return QRCode.toString(androidApkUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#0000" } });
}

// Halaman unduh app, bergaya landing (full-bleed, di luar bingkai ponsel). Tujuan semua tombol "Get the app".
export default async function GetAppPage() {
  const qr = await apkQr();

  return (
    <div className={`${inter.className} landing relative isolate min-h-dvh overflow-x-clip bg-[#f6f6f4] text-black`}>
      <Navbar base="/" />
      <main id="main">
        {/* Hero */}
        <section id="top" className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pt-14 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="lg-dots" aria-hidden="true" />
          <div className="text-center lg:text-left">
            <div className="lg-glass mb-7 inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
                <TekoMark className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Free preview for Android</span>
            </div>
            <h1 className="mb-5 text-5xl leading-[1.08] font-normal tracking-tight md:text-6xl lg:text-7xl">
              Get Tekosue
              <br />
              <span className="lg-shimmer">on your phone.</span>
            </h1>
            <p className="mx-auto mb-9 max-w-xl text-lg text-gray-600 md:text-xl lg:mx-0">
              Install the app, sign in with your passkey, and join your friends&apos; trip pot in about a minute.
            </p>
            <DownloadButtons apkUrl={androidApkUrl} />
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="lg-scene absolute inset-x-4 top-10 bottom-0 -z-10 rounded-[3rem]" aria-hidden="true" />
            <div className="lg-glass mx-auto w-[64%] max-w-[270px] rounded-[2.6rem] p-2">
              <Image
                src="/landing/trip.jpg"
                alt="The Tekosue app: a trip pot with $150.00, balances for each friend, and recent payments"
                width={750}
                height={1624}
                priority
                sizes="270px"
                className="h-auto w-full rounded-[2.1rem]"
              />
            </div>
            {/* QR untuk laptop: pindai dengan HP Android untuk mengunduh. */}
            <div className="lg-glass absolute bottom-8 -left-2 hidden w-44 flex-col items-center gap-2 rounded-3xl p-4 text-center sm:flex md:-left-10">
              <span
                role="img"
                aria-label="QR code that downloads the Android app"
                className="block h-28 w-28 rounded-xl bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <span className="text-xs font-medium text-gray-700">Scan with your Android phone</span>
            </div>
            <div className="absolute top-4 -right-1 md:-right-6">
              <span className="lg-glass flex h-24 w-24 items-center justify-center rounded-full">
                <Teko mood="wink" size={72} bob={false} />
              </span>
            </div>
          </div>
        </section>

        {/* Langkah instal */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="lg-reveal mx-auto mb-12 max-w-2xl text-center">
              <p className="lg-glass mb-4 inline-block rounded-full px-3.5 py-1 text-xs font-medium text-gray-700">Install</p>
              <h2 className="text-4xl leading-[1.1] font-normal tracking-tight md:text-5xl">Ready in four steps</h2>
              <p className="mt-4 text-lg text-gray-600">Your account is created the moment you join your first trip.</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="lg-glass lg-reveal relative flex flex-col rounded-3xl p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-[inset_0_1px_0_#fff,0_4px_12px_-4px_rgba(15,23,42,0.18)]">
                      <step.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-gray-400">Step {i + 1}</span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Yang dibutuhkan + undangan */}
        <section className="pb-24">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="lg-glass lg-reveal rounded-[2rem] p-7 md:p-9">
              <h2 className="mb-6 text-2xl font-normal tracking-tight">What you need</h2>
              <ul className="flex flex-col gap-5">
                {NEEDS.map((need) => (
                  <li key={need.title} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-[inset_0_1px_0_#fff,0_4px_12px_-4px_rgba(15,23,42,0.18)]">
                      <need.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{need.title}</h3>
                      <p className="text-sm leading-relaxed text-gray-600">{need.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg-reveal lg-scene relative isolate flex flex-col justify-center overflow-hidden rounded-[2rem] p-7 md:flex-row md:items-center md:gap-8 md:p-10">
              <span className="mx-auto mb-4 flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white/70 md:mx-0 md:mb-0">
                <Teko mood="love" size={104} bob={false} />
              </span>
              <div className="text-center md:text-left">
                <h2 className="mb-3 text-2xl font-normal tracking-tight md:text-3xl">Got an invite link?</h2>
                <p className="mb-6 text-gray-700">
                  Install the app first, then open the link on the same phone. Tekosue opens straight to the trip and you join with your passkey.
                </p>
                <Link href="/j/japan" className="group inline-flex items-center gap-1.5 text-sm font-medium">
                  See what an invite looks like
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer base="/" />
    </div>
  );
}
