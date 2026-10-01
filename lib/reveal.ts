"use client";
import { useEffect, type RefObject } from "react";

// One IntersectionObserver for every reveal on the page. An element is
// revealed once its top edge crosses 90% of the viewport, by setting `data-in` (an attribute React never manages, so a
// re-render can't strip it). CSS in globals.css does the actual motion and
// waits for the loader (`html[data-loader="done"]`).
type Cb = () => void;
let io: IntersectionObserver | null = null;
const cbs = new WeakMap<Element, Cb>();

function observer() {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        cbs.get(e.target)?.();
        cbs.delete(e.target);
        io?.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0 }
  );
  return io;
}

export function onReveal(el: Element, cb: Cb): () => void {
  if (typeof IntersectionObserver === "undefined") {
    cb();
    return () => {};
  }
  cbs.set(el, cb);
  observer().observe(el);
  return () => {
    cbs.delete(el);
    io?.unobserve(el);
  };
}

export const markIn = (el: Element) => el.setAttribute("data-in", "");

/** Sets `data-in` on the ref'd element when it scrolls into view. Pass `key`
 *  when the element can mount later (e.g. after a route change). */
export function useReveal(ref: RefObject<Element>, key?: unknown) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return onReveal(el, () => markIn(el));
  }, [ref, key]);
}
