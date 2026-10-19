import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { company, returnsWindowDays } from "@/lib/site";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <LegalPage kicker="Policy" title={<>Terms of <em>sale.</em></>} lede="The agreement between you and Jod-Z when you shop with us or join one of our programmes." updated="19 October 2026">
      <h2>1. Who we are</h2>
      <p>This shop is run by {company.legalName}{company.croNumber ? `, company number ${company.croNumber}` : ""}{company.vatNumber ? `, VAT ${company.vatNumber}` : ""}, {company.address}. Email <a href={`mailto:${company.email}`}>{company.email}</a>.</p>

      <h2>2. Ordering</h2>
      <p>You place an order through our secure checkout, which is run by Shopify. Your order is an offer to buy; the contract is formed when we email to confirm it. If an item turns out to be unavailable after you order, we tell you and refund you in full.</p>

      <h2>3. Prices and payment</h2>
      <p>Prices are in euro and include VAT where it applies. Any delivery charge, and any import duties for addresses outside the EU, are shown at checkout before you pay. Multi-pair pack prices apply to pairs of the same style bought together. We take card, Apple Pay, Google Pay, PayPal and Klarna. If you pay with Klarna, Klarna&rsquo;s own terms also apply.</p>

      <h2>4. Delivery</h2>
      <p>We deliver to Ireland, the UK and Europe by tracked courier. Delivery times are estimates; see <Link href="/delivery-returns">Delivery and returns</Link>. Responsibility for the goods passes to you when they are delivered.</p>

      <h2>5. Cancelling and returns</h2>
      <p>If you are a consumer in the EU you can cancel your order within 14 days of receiving it, without giving a reason. On top of that legal right, our returns policy gives you {returnsWindowDays} days from delivery to return unworn items with tags attached. We refund the price you paid, including standard delivery for a full-order cancellation, within 14 days of receiving the goods back. Full details are on <Link href="/delivery-returns">Delivery and returns</Link>.</p>

      <h2>6. Faulty goods</h2>
      <p>Our products must match their description, be of satisfactory quality and fit for purpose. If something is faulty, contact us and we will repair, replace or refund it. Nothing in these terms affects your rights under the Consumer Rights Act 2022.</p>

      <h2>7. Discount codes</h2>
      <p>One code per order unless stated. Codes have no cash value, cannot be applied to past orders and may be withdrawn if misused.</p>

      <h2 id="ambassadors">8. Ambassador programme</h2>
      <ul>
        <li>Ambassadors are chosen by us. We can decline or end a place in the programme at any time, and will tell you why if you ask.</li>
        <li>Your personal code gives your followers the discount shown when you are accepted. Commission, where offered, is paid on orders that use your code, after refunds, at the rate we confirm to you in writing.</li>
        <li>When you post about Jod-Z, make clear you are an ambassador, for example with #ad or #ambassador, as advertising rules require.</li>
        <li>Do not bid on Jod-Z search ads, post your code on coupon sites or make claims about the products that are not true.</li>
        <li>Under-16s need a parent or guardian&rsquo;s permission to take part. Payments to under-18s are made to the parent or guardian.</li>
      </ul>

      <h2 id="trade">9. Trade accounts</h2>
      <p>Trade accounts are for businesses that resell Jod-Z. Trade prices, payment terms and minimum order quantities are confirmed when your account is approved and shown in the trade portal. Trade orders are confirmed by us before dispatch. Recommended retail prices are guidance only.</p>

      <h2>10. Our liability</h2>
      <p>We are responsible for loss or damage you suffer that is a foreseeable result of us breaking these terms. We are not responsible for losses that were not foreseeable, or for business losses if you are buying as a consumer. Nothing here limits liability for death or personal injury caused by negligence, for fraud, or anything else that cannot be limited by law.</p>

      <h2>11. Website</h2>
      <p>Content on this site, including photographs, belongs to Jod-Z or its licensors. Please do not reuse it without permission. Product colours on screen can differ slightly from the fabric.</p>

      <h2>12. Law and disputes</h2>
      <p>These terms are governed by Irish law. If you live elsewhere in the EU you keep the protection of the consumer law of your country. If something goes wrong, contact us first: most things are sorted within a day.</p>
    </LegalPage>
  );
}
