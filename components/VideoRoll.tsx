"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Play, X } from "@phosphor-icons/react/dist/ssr";
import { reels, type Reel } from "@/lib/media";
import { Reveal } from "./Reveal";
import { RevealText } from "./RevealText";
import { getProduct } from "@/lib/products";

const legging = getProduct("the-jod-z");
const colourName = (slug?: string) => legging?.colourways.find((c) => c.slug === slug)?.name;

function ReelCard({ r, index, dupe, onOpen }: { r: Reel; index: number; dupe?: boolean; onOpen: (i: number) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const worn = colourName(r.colour);
  return (
    <figure className={`reel ${r.kind === "video" ? "reel-video" : ""}`} aria-hidden={dupe}>
      {r.kind === "video" ? (
        <video ref={ref} src={r.src} poster={r.poster} muted loop playsInline preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.src} alt={dupe ? "" : r.alt} loading="lazy" draggable={false} />
      )}
      <button type="button" className="reel-hit" onClick={() => onOpen(index)} tabIndex={dupe ? -1 : 0} aria-label={`Open: ${r.caption}`}>
        <span className="play" aria-hidden="true"><Play size={18} weight="fill" /></span>
      </button>
      <figcaption>
        <span className="reel-cap">{r.caption}</span>
        {worn && <span className="reel-worn">Wearing {worn}</span>}
      </figcaption>
    </figure>
  );
}

function Lightbox({ i, onClose, onNav }: { i: number; onClose: () => void; onNav: (d: number) => void }) {
  const r = reels[i];
  const worn = colourName(r.colour);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, onNav]);
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={r.caption}>
      <div className="lb-scrim" onClick={onClose} />
      <div className="lb-frame" key={r.src}>
        {r.kind === "video" ? (
          <video src={r.src} poster={r.poster} autoPlay loop playsInline controls />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.src} alt={r.alt} />
        )}
        <div className="lb-foot">
          <div>
            <p className="lb-cap">{r.caption}</p>
            {worn && <p className="lb-worn">Wearing {worn}</p>}
          </div>
          <Link href={`/product/the-jod-z${r.colour ? `?colour=${r.colour}` : ""}`} className="lb-shop" onClick={onClose}>
            {worn ? "Shop this colour" : "Shop leggings"} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <button type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
      <button type="button" className="lb-btn lb-prev" onClick={() => onNav(-1)} aria-label="Previous"><ArrowLeft size={18} /></button>
      <button type="button" className="lb-btn lb-next" onClick={() => onNav(1)} aria-label="Next"><ArrowRight size={18} /></button>
    </div>
  );
}

export function VideoRoll() {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const nav = useCallback((d: number) => setOpen((x) => (x === null ? x : (x + d + reels.length) % reels.length)), []);
  return (
    <section className="roll-section" id="riders" aria-labelledby="roll-title">
      <div className="wrap roll-head">
        <RevealText as="h2" id="roll-title" className="serif">Riders in <em>Jod-Z.</em></RevealText>
        <Reveal as="p" delay={320}>Real riders, real yards. Tag Jod-Z to be featured.</Reveal>
      </div>
      <Reveal className="roll-in" variant="none" delay={200}>
      <div className={`roll ${open !== null ? "paused" : ""}`} aria-label="Rider photos and videos">
        <div className="roll-track">
          {reels.map((r, k) => <ReelCard key={r.src} r={r} index={k} onOpen={setOpen} />)}
          {reels.map((r, k) => <ReelCard key={`${r.src}-b`} r={r} index={k} dupe onOpen={setOpen} />)}
        </div>
      </div>
      </Reveal>
      {open !== null && <Lightbox i={open} onClose={close} onNav={nav} />}
    </section>
  );
}
