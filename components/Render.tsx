import type { ProductKind } from "@/lib/products";

// Tinted garment renders. Stand-ins until studio photography lands;
// the colour is driven by `hex` so swatch changes feel instant.

const Defs = () => (
  <defs>
    <linearGradient id="jz-shade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#000" stopOpacity=".38" />
      <stop offset=".22" stopColor="#fff" stopOpacity=".10" />
      <stop offset=".5" stopColor="#000" stopOpacity=".22" />
      <stop offset=".78" stopColor="#fff" stopOpacity=".10" />
      <stop offset="1" stopColor="#000" stopOpacity=".38" />
    </linearGradient>
    <linearGradient id="jz-fall" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity=".10" />
      <stop offset=".6" stopColor="#000" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity=".18" />
    </linearGradient>
    <pattern id="jz-grip" width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="2.5" cy="2.5" r="1.1" fill="#000" fillOpacity=".32" />
    </pattern>
    <radialGradient id="jz-floor" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#000" stopOpacity=".28" />
      <stop offset="1" stopColor="#000" stopOpacity="0" />
    </radialGradient>
  </defs>
);

const LEG = "M42 50 L158 50 L163 120 C165 200 152 300 147 386 L112 386 C110 300 106 210 100 158 C94 210 90 300 88 386 L53 386 C48 300 35 200 37 120 Z";

function Legging({ hex }: { hex: string }) {
  return (
    <>
      <ellipse cx="100" cy="392" rx="80" ry="7" fill="url(#jz-floor)" />
      <path d={LEG} fill={hex} />
      <path d={LEG} fill="url(#jz-shade)" />
      <path d={LEG} fill="url(#jz-fall)" />
      <path d="M40 18 L160 18 L158 52 L42 52 Z" fill={hex} />
      <path d="M40 18 L160 18 L158 52 L42 52 Z" fill="url(#jz-shade)" opacity=".7" />
      <path d="M42 52 L158 52" stroke="#000" strokeOpacity=".22" strokeWidth="1" />
      <path d="M100 52 L100 158" stroke="#000" strokeOpacity=".18" strokeWidth=".8" />
      <path d="M70 60 C72 200 72 300 71 384 M130 60 C128 200 128 300 129 384" stroke="#fff" strokeOpacity=".08" strokeWidth=".8" fill="none" strokeDasharray="2 2" />
      <path d="M50 214 C52 250 55 285 58 318 L86 318 C88 285 90 250 92 214 C80 206 62 206 50 214 Z" fill="url(#jz-grip)" />
      <path d="M150 214 C148 250 145 285 142 318 L114 318 C112 285 110 250 108 214 C120 206 138 206 150 214 Z" fill="url(#jz-grip)" />
    </>
  );
}

/** Legwear silhouette; `kind` is kept so a breech outline can slot in later. */
export function ProductRender({ hex, className = "", title }: { kind: ProductKind; hex: string; className?: string; title: string }) {
  return (
    <svg className={`render ${className}`} viewBox="0 0 200 400" role="img" aria-label={title}>
      <Defs />
      <Legging hex={hex} />
    </svg>
  );
}
