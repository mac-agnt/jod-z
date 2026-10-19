import { CartProvider } from "@/components/Cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { AmbassadorPopup } from "@/components/AmbassadorPopup";
import { Tracking } from "@/components/Tracking";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { Analytics } from "@/components/consent/Analytics";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Loader />
      <Header />
      {children}
      <Footer />
      <AmbassadorPopup />
      <Tracking />
      <Analytics />
      <ConsentBanner />
    </CartProvider>
  );
}
