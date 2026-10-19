import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { stills, AUTH_VISUAL_SIZES } from "@/lib/media";
import { Logo } from "@/components/Logo";
import { verifyAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

// The link lands here and the visitor presses a button to finish. Email
// security scanners follow links with GET, so the token is only spent on
// the POST, never on page load.
export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string; expired?: string }> }) {
  const { token, expired } = await searchParams;
  const ok = !!token && !expired;
  return (
    <main className="auth">
      <div className="auth-visual">
        <Image src={stills.stable} alt="Young rider in Jod-Z leggings standing with her horse at the stable" width={1122} height={1402} sizes={AUTH_VISUAL_SIZES} loading="eager" />
      </div>
      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-logo"><Logo /></div>
          <h1 className="serif auth-title">{ok ? "Almost in." : "Link expired."}</h1>
          {ok ? (
            <>
              <p className="auth-sub">Press continue to finish signing in on this device.</p>
              <form action={verifyAction} className="auth-form">
                <input type="hidden" name="token" value={token} />
                <button type="submit" className="btn btn-light btn-block"><span className="btn-label">Continue</span></button>
              </form>
            </>
          ) : (
            <>
              <p className="auth-sub">Sign-in links work once and expire after 15 minutes. Ask for a new one from the page you were signing in to.</p>
              <div className="auth-form">
                <Link href="/retailers" className="btn btn-ghost-light btn-block"><span className="btn-label">Retailer sign in</span></Link>
                <Link href="/affiliates" className="btn btn-ghost-light btn-block"><span className="btn-label">Partner sign in</span></Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
