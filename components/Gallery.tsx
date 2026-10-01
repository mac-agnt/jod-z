"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export type Slide = { key: string; thumb: ReactNode; view: ReactNode; label: string; info: string };

/**
 * One hero frame, arrows either side, thumbnail strip below.
 * Keyboard arrows and touch swipe move between slides.
 * `resetKey` jumps back to the first slide (e.g. on colour change).
 */
export function Gallery({ slides, resetKey }: { slides: Slide[]; resetKey: string }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const start = useRef<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => setI(0), [resetKey]);

  useEffect(() => {
    const el = strip.current;
    const t = el?.children[i] as HTMLElement | undefined;
    if (!el || !t) return;
    const left = t.offsetLeft - el.offsetLeft;
    if (left < el.scrollLeft || left + t.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: left - (el.clientWidth - t.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [i]);

  const onDown = (e: PointerEvent) => { start.current = e.clientX; };
  const onUp = (e: PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  const s = slides[i];
  return (
    <div className="pg" onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}>
      <div className="pg-stage" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (start.current = null)} role="group" aria-roledescription="carousel" aria-label="Product images">
        {slides.map((x, k) => (
          <div key={x.key} className={`pg-slide ${k === i ? "on" : ""}`} aria-hidden={k !== i}>{x.view}</div>
        ))}
        <div className="pg-info" aria-live="polite">
          <span className="pg-label">{s.label}</span>
          <span className="pg-text">{s.info}</span>
        </div>
        <button type="button" className="pg-arrow prev" onClick={() => go(-1)} aria-label="Previous image"><ArrowLeft size={18} /></button>
        <button type="button" className="pg-arrow next" onClick={() => go(1)} aria-label="Next image"><ArrowRight size={18} /></button>
      </div>
      <div className="pg-thumbs" ref={strip} role="tablist" aria-label="Choose image">
        {slides.map((x, k) => (
          <button key={x.key} type="button" role="tab" aria-selected={k === i} aria-label={x.label} className="pg-thumb" onClick={() => setI(k)}>
            {x.thumb}
          </button>
        ))}
      </div>
    </div>
  );
}
