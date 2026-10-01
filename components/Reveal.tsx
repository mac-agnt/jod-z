"use client";
import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { markIn, onReveal } from "@/lib/reveal";

type Tag = "div" | "section" | "ul" | "ol" | "li" | "figure" | "p" | "header" | "footer" | "blockquote" | "span";

type Props = {
  children: ReactNode;
  as?: Tag;
  className?: string;
  /** up: fade and rise. fade: opacity only. clip: curtain wipe upward, inner media settles. scale: fade in from 96%.
   *  none: the wrapper stays still; CSS choreographs its descendants off `data-in`. */
  variant?: "up" | "fade" | "clip" | "scale" | "none";
  /** Delay before the reveal starts, in ms. */
  delay?: number;
  /** Animate direct children in sequence, this many ms apart, instead of the wrapper (order comes from CSS nth-child). */
  stagger?: number;
  /** Above-the-fold content: animate as soon as the loader lifts, no scroll trigger. */
  load?: boolean;
  id?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export function Reveal({ children, as = "div", className = "", variant = "up", delay = 0, stagger, load = false, style, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || load) return;
    return onReveal(el, () => markIn(el));
  }, [load]);

  return createElement(
    as,
    {
      ref,
      className: `reveal rv-${variant} ${className}`.trim(),
      "data-stagger": stagger ? "" : undefined,
      "data-load": load ? "" : undefined,
      style: { "--rv-delay": `${delay}ms`, ...(stagger ? { "--rv-stagger": `${stagger}ms` } : {}), ...style } as CSSProperties,
      ...rest,
    },
    children
  );
}
