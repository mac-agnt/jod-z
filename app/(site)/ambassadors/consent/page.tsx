import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmPanel } from "@/components/ConfirmPanel";
import { guardianConsentAction } from "@/lib/forms/actions";

export const metadata: Metadata = { title: "Parent or guardian permission", robots: { index: false } };

export default async function GuardianConsent({ searchParams }: { searchParams: Promise<{ token?: string; done?: string; expired?: string }> }) {
  const { token, done, expired } = await searchParams;
  if (done) return <ConfirmPanel title="Thank you." body={`${done}'s application is now with the Jod-Z team. We will email them once it is reviewed.`} />;
  if (expired || !token) return <ConfirmPanel title="Link expired." body="This permission link has already been used or is out of date. Email hello@jod-z.com if you need help." />;
  return (
    <ConfirmPanel
      title="Permission needed."
      body={<>A rider in your care has applied to the Jod-Z Ambassador programme. Agreeing lets us store their name, email and social handle to review the application and, if accepted, send them a personal discount code. You can withdraw permission at any time by emailing hello@jod-z.com. <Link href="/privacy" className="auth-link">Privacy policy</Link></>}
      action={guardianConsentAction}
      token={token}
      button="I give permission"
    />
  );
}
