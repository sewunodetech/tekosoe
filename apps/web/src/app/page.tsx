import { Inter } from "next/font/google";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { ClosingCta, Faq, Footer, GoodToKnow, HowItWorks, TryDemo } from "@/components/landing/Sections";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Landing full-bleed (di luar bingkai ponsel): hero, informasi penting untuk pengguna, dan demo.
export default function LandingPage() {
  return (
    <div className={`${inter.className} landing relative isolate min-h-dvh overflow-x-clip bg-[#fbfbfa] text-black`}>
      {/* Aurora: gumpalan warna lembut (palet Tekosoe) yang dibiaskan oleh permukaan kaca. */}
      <div className="lg-aurora" aria-hidden="true">
        <span className="lg-blob -top-40 -left-32 h-[520px] w-[520px] bg-[#8ed8c6]" />
        <span className="lg-blob top-[4%] -right-40 h-[480px] w-[480px] bg-[#cfc6ff] [--dur:26s] [--dx:-50px] [--dy:40px]" />
        <span className="lg-blob top-[24%] left-[18%] h-[420px] w-[420px] bg-[#ffdccb] [--dur:30s] [--dx:60px] [--dy:30px]" />
        <span className="lg-blob top-[40%] -right-24 h-[460px] w-[460px] bg-[#d6e4ff] [--dur:24s] [--dx:-40px] [--dy:-40px]" />
        <span className="lg-blob top-[58%] -left-24 h-[440px] w-[440px] bg-[#cfc6ff] [--dur:28s]" />
        <span className="lg-blob top-[72%] right-[12%] h-[420px] w-[420px] bg-[#8ed8c6] [--dur:32s] [--dx:-60px] [--dy:20px]" />
        <span className="lg-blob bottom-0 left-[30%] h-[380px] w-[380px] bg-[#ffdccb] [--dur:27s]" />
      </div>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <GoodToKnow />
        <TryDemo />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
