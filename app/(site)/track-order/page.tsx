import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { company } from "@/lib/site";
import { delivery } from "@/lib/offer";

export const metadata: Metadata = { title: "Track an order", description: "Find your DPD tracking link or get help with an order." };

const store = process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL;

export default function TrackOrder() {
  return (
    <LegalPage kicker="Help" title={<>Where&rsquo;s my <em>order?</em></>} lede={`Every order ships with tracked ${delivery.carrier} delivery.`}>
      <h2>Your tracking link</h2>
      <p>As soon as your parcel leaves us, you get a shipping email with a {delivery.carrier} tracking link.</p>
      {store && <p>You can also see every order and its tracking in <a href={store} rel="noopener">your account</a>.</p>}
      <h2>Can&rsquo;t find it?</h2>
      <p>Check your spam or promotions folder for an email from Jod-Z. Still nothing? <Link href="/contact">Send us your order number</Link> or email <a href={`mailto:${company.email}`}>{company.email}</a> and we will chase it for you.</p>
    </LegalPage>
  );
}
