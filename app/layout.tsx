import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { LeftNav, MobileBar, MobileTabs } from "@/components/Nav";
import RightColumn from "@/components/RightColumn";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

// Fonts from the design. Next.js downloads them at build time and serves them itself.
const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-geist" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-bricolage" });

export const metadata: Metadata = {
  title: "perpy",
  description: "Verified perp trades from real wallets, shared as posts.",
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
    <html lang="en" className={`${geist.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>
          <div className="shell">
            <LeftNav />
            <main className="center">
              <MobileBar />
              {children}
            </main>
            <RightColumn />
          </div>
          <MobileTabs />
        </ToastProvider>
      </body>
    </html>
  );
}
