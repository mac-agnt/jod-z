import Link from "next/link";
import { PartnerCTA } from "./PartnerCTA";
import { Logo } from "./Logo";
import { Reveal } from "./Reveal";
import { RevealText } from "./RevealText";
import { getProduct } from "@/lib/products";

export function Footer() {
  const breech = getProduct("jockey-breech");
  return (
    <>
    <PartnerCTA />
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <RevealText as="p" className="footer-mark serif" step={70}>Made for <em>the yard.</em></RevealText>
        </div>
        <Reveal className="footer-grid" stagger={90} delay={200}>
          <div>
            <h4 className="label">Shop</h4>
            <ul>
              <li><Link href="/product/the-jod-z" className="link-u">The Jod-Z Legging</Link></li>
              {breech && <li><Link href={`/product/${breech.slug}`} className="link-u">{breech.name}</Link></li>}
              <li><Link href="/sizing" className="link-u">Sizing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="label">Partners</h4>
            <ul>
              <li><Link href="/affiliates" className="link-u">Affiliate portal</Link></li>
              <li><Link href="/retailers" className="link-u">Retailer portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="label">Help</h4>
            <ul>
              <li><Link href="/sizing#delivery" className="link-u">Delivery and returns</Link></li>
              <li><a href="mailto:hello@jod-z.com" className="link-u">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="label">Follow</h4>
            <ul>
              <li><a href="https://instagram.com/" className="link-u">Instagram</a></li>
              <li><a href="https://tiktok.com/" className="link-u">TikTok</a></li>
            </ul>
          </div>
        </Reveal>
        <Reveal className="footer-base" variant="fade" delay={300}>
          <span className="logo"><Logo title="Jod-Z" /></span>
          <span>© {new Date().getFullYear()} Jod-Z. Designed and tested by riders.</span>
        </Reveal>
      </div>
    </footer>
    </>
  );
}
