import type { Metadata } from "next";
import Image from "next/image";
import { stills, AUTH_VISUAL_SIZES } from "@/lib/media";
import { TradeAuth } from "@/components/TradeAuth";
import { safeNext } from "@/lib/auth/constants";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const { next, denied } = await searchParams;
  return (
    <main className="auth">
      <div className="auth-visual">
        <Image src={stills.stable} alt="Young rider in Jod-Z leggings standing with her horse at the stable" width={1122} height={1402} sizes={AUTH_VISUAL_SIZES} loading="eager" />
      </div>
      <TradeAuth portal="admin" next={safeNext(next, "/admin")} denied={!!denied} />
    </main>
  );
}
