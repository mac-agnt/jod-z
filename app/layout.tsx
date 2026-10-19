import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Mrs_Saint_Delafield } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { loaderBootScript } from "@/components/Loader";
import { siteUrl } from "@/lib/site";

// Self-hosted at build time: no request to Google from the visitor's browser.
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const script = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Jod-Z | Riding leggings for young riders", template: "%s | Jod-Z" },
  description: "The Jod-Z Legging. High-waisted, silicone knee grip, fully opaque. Eleven colours. Designed and tested by riders.",
  openGraph: { siteName: "Jod-Z", type: "website", locale: "en_IE", images: [{ url: "/media/hero-poster.jpg", width: 1600, height: 900, alt: "Young riders in Jod-Z leggings" }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0e0c0a", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${script.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="loader-boot" strategy="beforeInteractive">{loaderBootScript}</Script>
        {/* Entrance animations wait for JS; without it, show everything. */}
        <noscript dangerouslySetInnerHTML={{ __html: "<style>.reveal,.reveal>*,.rt-i,.hs{opacity:1!important;transform:none!important;clip-path:none!important;animation:none!important}</style>" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
