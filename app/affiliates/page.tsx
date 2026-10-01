import type { Metadata } from "next";
import { stills } from "@/lib/media";
import { TradeAuth } from "@/components/TradeAuth";

export const metadata: Metadata = { title: "Partner portal | Jod-Z" };

export default function Affiliates() {
  return (
    <main className="auth">
      <div className="auth-visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stills.trio} alt="Three young riders on their ponies in Jod-Z leggings" />
      </div>
      <TradeAuth portal="affiliate" />
    </main>
  );
}
