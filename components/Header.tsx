"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./Cart";
import { AnnouncementBar } from "./AnnouncementBar";
import { Logo } from "./Logo";

const shop = [
  { href: "/product/the-jod-z", label: "Leggings" },
  { href: "/product/jockey-breech", label: "Breeches" },
  { href: "/sizing", label: "Sizing" },
];
const portals = [
  { href: "/affiliates", label: "Affiliates" },
  { href: "/retailers", label: "Retailers" },
];

export function Header() {
  const path = usePathname();
  const overHero = path === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const { count, setOpen } = useCart();

  useEffect(() => {
    setMenu(false);
    if (!overHero) return;
    const s = document.getElementById("hero-end");
    if (!s) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-68px 0px 0px 0px" });
    io.observe(s);
    return () => io.disconnect();
  }, [overHero, path]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const solid = !overHero || scrolled || menu;

  return (
    <>
      <AnnouncementBar />
      <header className={`header ${solid ? "solid" : ""}`}>
        <div className="wrap header-inner">
          <nav aria-label="Shop" className="nav-left">
            <button type="button" className="burger" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(!menu)}>
              <span /><span />
            </button>
            {shop.map((l) => <Link key={l.href} href={l.href} className={`nav-link ${path === l.href ? "on" : ""}`}>{l.label}</Link>)}
          </nav>
          <Link href="/" className="logo" aria-label="Jod-Z home"><Logo /></Link>
          <div className="nav-right">
            {portals.map((l) => <Link key={l.href} href={l.href} className={`nav-link portal ${path === l.href ? "on" : ""}`}>{l.label}</Link>)}
            <button type="button" className="nav-link bag" onClick={() => setOpen(true)} aria-label={`Bag, ${count} items`}>
              Bag <span className="bag-count">{count}</span>
            </button>
          </div>
        </div>
      </header>
      <div className={`menu ${menu ? "open" : ""}`} aria-hidden={!menu}>
        <div className="wrap">
          {shop.map((l) => <Link key={l.href} href={l.href} className="menu-link serif" tabIndex={menu ? 0 : -1}>{l.label}</Link>)}
          <div className="menu-sub">
            {portals.map((l) => <Link key={l.href} href={l.href} className="label" tabIndex={menu ? 0 : -1}>{l.label} portal</Link>)}
          </div>
        </div>
      </div>
    </>
  );
}
