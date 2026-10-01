import type { Metadata } from "next";
import { stills } from "@/lib/media";
import { TradeAuth } from "@/components/TradeAuth";

export const metadata: Metadata = { title: "Retailer portal | Jod-Z" };

export default function Retailers() {
  return (
    <main className="auth">
      <div className="auth-visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stills.sunset} alt="Rider and horse at sunset in Jod-Z" />
      </div>
      <TradeAuth />
    </main>
  );
}
