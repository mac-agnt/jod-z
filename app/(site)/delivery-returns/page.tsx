import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { company, returnsWindowDays } from "@/lib/site";
import { delivery } from "@/lib/offer";

export const metadata: Metadata = { title: "Delivery and returns", description: `Tracked ${delivery.carrier} delivery across Ireland, the UK and Europe. ${returnsWindowDays} days to return or swap a size.` };

export default function DeliveryReturns() {
  return (
    <LegalPage kicker="Help" title={<>Delivery and <em>returns.</em></>} lede={`Tracked ${delivery.carrier} delivery, and ${returnsWindowDays} days to change your mind or swap a size.`}>
      <h2>Delivery</h2>
      <table>
        <thead><tr><th>Where</th><th>How</th><th>Usually arrives</th></tr></thead>
        <tbody>
          <tr><td>Ireland</td><td>Tracked {delivery.carrier}</td><td>{delivery.window}</td></tr>
          <tr><td>Northern Ireland, Great Britain and the rest of Europe</td><td>Tracked {delivery.carrier}</td><td>Shown at checkout for your address</td></tr>
        </tbody>
      </table>
      <p>You get a tracking link by email as soon as your parcel is on its way. The delivery cost, if any, is shown at checkout before you pay.</p>
      <p className="note">Shipping outside the EU, including Great Britain, can involve import duties set by the destination country. Checkout shows anything due before you pay.</p>

      <h2>Returns and exchanges</h2>
      <p>You have <strong>{returnsWindowDays} days from delivery</strong> to request a return. Items need to be unworn and unwashed, with tags attached and in the original packaging.</p>
      <ol>
        <li>Email <a href={`mailto:${company.email}`}>{company.email}</a> or use the <Link href="/contact">contact form</Link> with your order number and what you are sending back.</li>
        <li>We send you a returns label and instructions.</li>
        <li>Once the parcel reaches us and is checked, we refund your original payment method and email you to confirm. Your bank may take a few days to show it.</li>
      </ol>
      <p><strong>Wrong size?</strong> The quickest swap is to return the pair and place a new order for the size you need, so it is on its way straight away.</p>
      <p>Please do not send items back without contacting us first, so we can match the parcel to your order.</p>

      <h2>Your legal rights</h2>
      <p>If you live in the EU you also have the legal right to cancel any online order within 14 days of receiving it, without giving a reason, including sale items. Our {returnsWindowDays}-day returns policy sits on top of that right and does not replace it. To cancel, tell us by email or the contact form. You pay the cost of returning the goods unless they are faulty or we sent the wrong item.</p>

      <h2>Damaged or wrong item</h2>
      <p>Check your order when it arrives. If anything is faulty, damaged or not what you ordered, contact us straight away with a photo and we will put it right at no cost to you. This does not affect your rights under the Consumer Rights Act 2022.</p>

      <h2>Questions</h2>
      <p>Email <a href={`mailto:${company.email}`}>{company.email}</a>. A real person replies within one working day.</p>
    </LegalPage>
  );
}
