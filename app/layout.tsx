import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Dock, Header } from "@/components/Header";
import Tape from "@/components/Tape";
import { ToastProvider } from "@/components/Toast";
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

// Runs before the page paints so a saved light/dark choice doesn't flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>
          <Tape />
          <Header />
          <main className="page">{children}</main>
          <Dock />
        </ToastProvider>
      </body>
    </html>
  );
}
