import { Inter } from "next/font/google";
import { Landing } from "@/components/landing/Landing";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Landing full-bleed (di luar bingkai ponsel): hero putih dengan tab otomatis dan video.
export default function LandingPage() {
  return (
    <div className={inter.className}>
      <Landing />
    </div>
  );
}
