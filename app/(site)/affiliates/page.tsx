import type { Metadata } from "next";
import Image from "next/image";
import { stills, AUTH_VISUAL_SIZES } from "@/lib/media";
import { TradeAuth } from "@/components/TradeAuth";
import { safeNext } from "@/lib/auth/constants";
import { AmbassadorForm } from "@/components/forms/AmbassadorForm";

export const metadata: Metadata = { title: "Partner portal", description: "Join the Jod-Z Ambassador programme: your own rider code, a discount for your friends, and first look at new colours." };

export default async function Affiliates({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const { next, denied } = await searchParams;
  return (
    <main className="auth">
      <div className="auth-visual">
        <Image src={stills.trio} alt="Three young riders on their ponies in Jod-Z leggings" width={1672} height={941} sizes={AUTH_VISUAL_SIZES} loading="eager" />
      </div>
      <TradeAuth portal="affiliate" next={safeNext(next, "/affiliates/portal")} denied={!!denied} apply={<AmbassadorForm source="partner-page" />} />
    </main>
  );
}
