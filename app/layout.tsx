import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/Cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader, loaderBootScript } from "@/components/Loader";
import { AmbassadorPopup } from "@/components/AmbassadorPopup";

export const metadata: Metadata = {
  title: "Jod-Z | Riding leggings for young riders",
  description: "The Jod-Z Legging. High-waisted, silicone knee grip, fully opaque. Eleven colours. Designed and tested by riders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: loaderBootScript }} />
        {/* Entrance animations wait for JS; without it, show everything. */}
        <noscript dangerouslySetInnerHTML={{ __html: "<style>.reveal,.reveal>*,.rt-i,.hs{opacity:1!important;transform:none!important;clip-path:none!important;animation:none!important}</style>" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@400;500;600&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          <Loader />
          <Header />
          {children}
          <Footer />
          <AmbassadorPopup />
        </CartProvider>
      </body>
    </html>
  );
}
