import Link from "next/link";
import { PartnerCTA } from "./PartnerCTA";
import { Logo } from "./Logo";
import { Reveal } from "./Reveal";
import { RevealText } from "./RevealText";
import { NewsletterForm } from "./forms/NewsletterForm";
import { CookieSettingsLink } from "./consent/CookieSettingsLink";
import { getProduct } from "@/lib/products";
import { company } from "@/lib/site";

export function Footer() {
  const breech = getProduct("jockey-breech");
  const reg = [company.croNumber && `CRO ${company.croNumber}`, company.vatNumber && `VAT ${company.vatNumber}`].filter(Boolean).join(". ");
  return (
    <>
    <PartnerCTA />
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <RevealText as="p" className="footer-mark serif" step={70}>Made for <em>the yard.</em></RevealText>
          <div className="footer-news">
            <p className="footer-news-title">New colours and restocks, first.</p>
            <NewsletterForm />
          </div>
        </div>
        <Reveal className="footer-grid" stagger={90} delay={200}>
          <div>
            <h4 className="label">Shop</h4>
            <ul>
              <li><Link href="/product/the-jod-z" className="link-u">The Jod-Z Legging</Link></li>
              {breech && <li><Link href={`/product/${breech.slug}`} className="link-u">{breech.name}</Link></li>}
              <li><Link href="/sizing" className="link-u">Sizing</Link></li>
              <li><Link href="/our-story" className="link-u">Our story</Link></li>
              <li><Link href="/journal" className="link-u">Journal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="label">Help</h4>
            <ul>
              <li><Link href="/delivery-returns" className="link-u">Delivery and returns</Link></li>
              <li><Link href="/faq" className="link-u">FAQ</Link></li>
              <li><Link href="/track-order" className="link-u">Track an order</Link></li>
              <li><Link href="/contact" className="link-u">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="label">Partners</h4>
            <ul>
              <li><Link href="/affiliates" className="link-u">Ambassadors</Link></li>
              <li><Link href="/retailers" className="link-u">Stockists</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="label">Follow</h4>
            <ul>
              <li><a href={company.instagram} className="link-u" rel="noopener" target="_blank">Instagram</a></li>
              <li><a href={company.tiktok} className="link-u" rel="noopener" target="_blank">TikTok</a></li>
            </ul>
          </div>
        </Reveal>
        <Reveal className="footer-base" variant="fade" delay={300}>
          <span className="logo"><Logo title="Jod-Z" /></span>
          <nav className="footer-legal" aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/accessibility">Accessibility</Link>
            <CookieSettingsLink />
          </nav>
          <span>© {new Date().getFullYear()} {company.legalName}. {reg ? `${reg}. ` : ""}Designed and tested by riders.</span>
        </Reveal>
      </div>
    </footer>
    </>
  );
}
