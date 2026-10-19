import type { Metadata } from "next";
import Image from "next/image";
import { stills, AUTH_VISUAL_SIZES } from "@/lib/media";
import { TradeAuth } from "@/components/TradeAuth";
import { safeNext } from "@/lib/auth/constants";
import { RetailerForm } from "@/components/forms/RetailerForm";

export const metadata: Metadata = { title: "Retailer portal", description: "Stock Jod-Z in your saddlery, yard shop or boutique. Apply for a trade account or sign in to order." };

export default async function Retailers({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const { next, denied } = await searchParams;
  return (
    <main className="auth">
      <div className="auth-visual">
        <Image src={stills.sunset} alt="Rider and horse at sunset in Jod-Z" width={1122} height={1402} sizes={AUTH_VISUAL_SIZES} loading="eager" />
      </div>
      <TradeAuth portal="retailer" next={safeNext(next, "/retailers/portal")} denied={!!denied} apply={<RetailerForm />} />
    </main>
  );
}
