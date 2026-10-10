import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Press_Start_2P, Silkscreen } from "next/font/google";
import { Dock, Header } from "@/components/Header";
import { MarketProvider } from "@/components/Market";
import Tape from "@/components/Tape";
import { ToastProvider } from "@/components/Toast";
import { fetchSnapshot, type Snapshot } from "@/lib/hyperliquid";
import "./globals.css";

// Fonts. Next.js downloads them at build time and serves them itself.
// Press Start 2P = big pixel titles, Silkscreen = pixel labels and buttons,
// Geist = reading text, Geist Mono = numbers.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel" });
const silk = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-silk" });

export const metadata: Metadata = {
  title: "perpy · trading is a game, play it in public",
  description: "Verified perp trades from real wallets. Live from Hyperliquid.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07060D",
};

// Pages are rebuilt at most once a minute with fresh Hyperliquid prices, so
// visitors see real numbers immediately; the browser then streams live updates.
export const revalidate = 60;

async function loadSnapshot(): Promise<Snapshot | null> {
  try {
    return await fetchSnapshot({ next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) });
  } catch {
    return null; // the browser will load it instead
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await loadSnapshot();
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable} ${pixel.variable} ${silk.variable}`}>
      <body>
        <MarketProvider initial={snapshot}>
          <ToastProvider>
            <Tape />
            <Header />
            <main className="page">{children}</main>
            <Dock />
          </ToastProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
