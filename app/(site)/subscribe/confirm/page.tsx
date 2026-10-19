import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmPanel } from "@/components/ConfirmPanel";
import { confirmSubscriptionAction } from "@/lib/forms/actions";

export const metadata: Metadata = { title: "Confirm subscription", robots: { index: false } };

export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string; done?: string; expired?: string }> }) {
  const { token, done, expired } = await searchParams;
  if (done) return <ConfirmPanel title="You are on the list." body="New colours, restocks and rider stories, straight to your inbox."><Link href="/product/the-jod-z" className="btn btn-light btn-block"><span className="btn-label">Shop leggings</span></Link></ConfirmPanel>;
  if (expired || !token) return <ConfirmPanel title="Link expired." body="That confirmation link has already been used or is out of date. Sign up again from the bottom of any page." />;
  return <ConfirmPanel title="One more step." body="Press confirm to join the Jod-Z list." action={confirmSubscriptionAction} token={token} button="Confirm subscription" />;
}
