"use client";
import {
  Children, Fragment, cloneElement, createElement, isValidElement, useEffect, useRef,
  type CSSProperties, type ReactElement, type ReactNode,
} from "react";
import { markIn, onReveal } from "@/lib/reveal";

type Props = {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "blockquote" | "div";
  className?: string;
  id?: string;
  /** Delay before the first word, in ms. */
  delay?: number;
  /** Gap between words, in ms. */
  step?: number;
  /** Above-the-fold: play as soon as the loader lifts, no scroll trigger. */
  load?: boolean;
};

// React 19 hands elements created in a Server Component to client children
// as lazy references. Resolve them so SSR and hydration split identically.
const LAZY = Symbol.for("react.lazy");
type Lazy = { $$typeof: symbol; _payload: unknown; _init: (p: unknown) => ReactNode };
const unwrap = (node: ReactNode): ReactNode => {
  const l = node as unknown as Lazy | null;
  if (l && typeof l === "object" && l.$$typeof === LAZY) {
    try { return unwrap(l._init(l._payload)); } catch { return node; }
  }
  return node;
};

const textOf = (raw: ReactNode): string => {
  const node = unwrap(raw);
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) {
    if (node.type === "br") return " ";
    return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  }
  return "";
};

// Headline reveal: each word rises out of its own mask, in sequence. Accepts
// plain text plus inline elements such as <em> and <br />. Screen readers get
// the sentence once, from a visually hidden copy.
export function RevealText({ children, as = "h2", className = "", id, delay = 0, step = 55, load = false }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || load) return;
    return onReveal(el, () => markIn(el));
  }, [load]);

  let n = 0;
  const split = (raw: ReactNode): ReactNode => {
    const node = unwrap(raw);
    if (typeof node === "string" || typeof node === "number") {
      return String(node).split(/(\s+)/).map((part, k) => {
        if (part === "" || /^\s+$/.test(part)) return part;
        const i = n++;
        return (
          <span className="rt-w" key={`${k}-${part}`}>
            <span className="rt-i" style={{ "--i": i } as CSSProperties}>{part}</span>
          </span>
        );
      });
    }
    if (Array.isArray(node)) return Children.map(node, (c) => split(c));
    if (isValidElement(node)) {
      if (node.type === "br") return node;
      const el = node as ReactElement<{ children?: ReactNode }>;
      return cloneElement(el, undefined, split(el.props.children));
    }
    return node;
  };

  return createElement(
    as,
    {
      ref,
      id,
      className: `rt ${className}`.trim(),
      "data-load": load ? "" : undefined,
      style: { "--rt-delay": `${delay}ms`, "--rt-step": `${step}ms` } as CSSProperties,
    },
    <>
      <span className="sr-only">{textOf(children)}</span>
      <span className="rt-vis" aria-hidden="true">{split(children)}</span>
    </>
  );
}

export { Fragment };
