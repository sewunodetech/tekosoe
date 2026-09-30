import { Inter } from "next/font/google";
import { Hero } from "@/components/landing/Hero";
import { BuiltWith } from "@/components/landing/Integrations";
import { Navbar } from "@/components/landing/Navbar";
import { ClosingCta, Faq, Footer, GoodToKnow, HowItWorks, TryDemo } from "@/components/landing/Sections";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Landing full-bleed (di luar bingkai ponsel): hero, informasi penting untuk pengguna, dan demo.
export default function LandingPage() {
  return (
    <div className={`${inter.className} landing relative isolate min-h-dvh overflow-x-clip bg-[#f6f6f4] text-black`}>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <GoodToKnow />
        <BuiltWith />
        <TryDemo />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
