import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Dock, Header } from "@/components/Header";
import Tape from "@/components/Tape";
import { MarketProvider } from "@/components/Market";
import { ToastProvider } from "@/components/Toast";
import { fetchSnapshot, type Snapshot } from "@/lib/hyperliquid";
import "./globals.css";

// Fonts. Next.js downloads them at build time and serves them itself.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-bricolage" });

export const metadata: Metadata = {
  title: "perpy · show the receipts",
  description: "Verified perp trades from real wallets, printed as receipts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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

// Runs before the page paints so a saved light/dark choice doesn't flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await loadSnapshot();
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
