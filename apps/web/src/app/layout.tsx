import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tekosoe — One pot for the whole trip",
    template: "%s · Tekosoe",
  },
  description:
    "Friends from any country chip in to one shared pot, spend together, and Tekosoe settles everyone up on the last day. Sign in with your passkey — no passwords.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf8f3",
  colorScheme: "light",
};

/**
 * Web ini mobile-only: semua halaman hidup di satu kolom ~430px.
 * Di layar lebar kolom itu tampil sebagai bingkai ponsel di tengah.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${manrope.variable}`}>
      <body className="min-h-dvh font-body text-ink antialiased">
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-ivory md:my-6 md:min-h-[min(880px,calc(100dvh-3rem))] md:rounded-[44px] md:border md:border-line md:shadow-[0_24px_60px_rgba(29,36,38,0.12)]">
          {children}
        </div>
      </body>
    </html>
  );
}
