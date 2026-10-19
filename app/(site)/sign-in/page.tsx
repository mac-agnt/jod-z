import type { Metadata } from "next";
import { stills } from "@/lib/media";
import { TradeAuth } from "@/components/TradeAuth";
import { safeNext } from "@/lib/auth/constants";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const { next, denied } = await searchParams;
  return (
    <main className="auth">
      <div className="auth-visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stills.stable} alt="Young rider in Jod-Z leggings standing with her horse at the stable" />
      </div>
      <TradeAuth portal="admin" next={safeNext(next, "/admin")} denied={!!denied} />
    </main>
  );
}
