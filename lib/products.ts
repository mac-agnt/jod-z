// Catalogue: one PDP per garment, colourways as variants.
// Names, prices, sizes from jod-z.com. Hex values approximate until Jody
// supplies fabric references. Drop photography into /public/media and set
// `image` on a colourway to replace the tinted render.

export type Colourway = {
  slug: string;
  name: string;
  hex: string;
  note: string;
  image?: string;
};

export type ProductKind = "legging" | "breech";

export type Product = {
  slug: string;
  kind: ProductKind;
  name: string;
  short: string;
  descriptor: string;
  price: number;
  sizes: string[];
  /** Shown beside the size label. Defaults to "True to size." */
  sizeHint?: string;
  /** Replaces the default "Made for the saddle" trust line on the PDP. */
  saddle?: string;
  colourways: Colourway[];
  features: string[];
  fit: string;
  care: string;
};

export const products: Product[] = [
  {
    slug: "the-jod-z",
    kind: "legging",
    name: "The Jod-Z Legging",
    short: "Leggings",
    descriptor: "High-waisted riding leggings with silicone knee grip. Fully opaque, made for the yard and the ring.",
    price: 59,
    sizes: ["2XS", "XS", "S", "M", "L"],
    colourways: [
      { slug: "midnight-black", name: "Midnight Black", hex: "#18181b", note: "The original. Goes with every show shirt.", image: "/media/colours/midnight-black.webp" },
      { slug: "admiral-navy", name: "Admiral Navy", hex: "#1d2642", note: "Deep, clean, competition ready.", image: "/media/colours/admiral-navy.webp" },
      { slug: "mazarine-blue", name: "Mazarine Blue", hex: "#2c408a", note: "Saturated blue with a quiet sheen.", image: "/media/colours/mazarine-blue.webp" },
      { slug: "petrol-blue", name: "Petrol Blue", hex: "#1f4c5a", note: "Blue-green, cool and understated.", image: "/media/colours/petrol-blue.webp" },
      { slug: "stone-grey", name: "Stone Grey", hex: "#94918b", note: "Soft neutral that hides the arena dust.", image: "/media/colours/stone-grey.webp" },
      { slug: "macaroon-maroon", name: "Macaroon Maroon", hex: "#5c2331", note: "Rich burgundy for autumn yards.", image: "/media/colours/macaroon-maroon.webp" },
      { slug: "merry-berry", name: "Merry Berry", hex: "#8b2f5b", note: "Bold berry. Made to be seen.", image: "/media/colours/merry-berry.webp" },
      { slug: "candy-floss-pink", name: "Candy Floss Pink", hex: "#e6b3c1", note: "Soft pink, never see-through.", image: "/media/colours/candy-floss-pink.webp" },
      { slug: "buttermilk-beige", name: "Buttermilk Beige", hex: "#dbc9ad", note: "Warm neutral, schooling to showing.", image: "/media/colours/buttermilk-beige.webp" },
      { slug: "cotton-candy-white", name: "Cotton Candy White", hex: "#eee6ea", note: "A blush-tinted white.", image: "/media/colours/cotton-candy-white.webp" },
      { slug: "the-ultimate-white", name: "The Ultimate White", hex: "#f5f3ee", note: "Show-ring white. Fully opaque.", image: "/media/colours/the-ultimate-white.webp" },
    ],
    features: [
      "Silicone knee grips",
      "4-way stretch, fully opaque fabric",
      "Breathable and quick-dry",
      "High-waisted fit",
      "Phone and treat pockets",
      "Machine washable",
    ],
    fit: "High-waisted, close through the leg, full length. Sizes go by age. If your rider is tall or broad for their age, size up.",
    care: "Machine wash cold, inside out. No fabric softener. Line dry to protect the knee grip.",
  },
  {
    // Live store sells these as two products (The Monarch Breech (Navy), The
    // Eclipse Breech (Black)); here they are colourways of one PDP. Care copy
    // is a placeholder: the live store lists none.
    slug: "jockey-breech",
    kind: "breech",
    name: "The Jockey Breech",
    short: "Breeches",
    descriptor: "High-waisted breeches with suede knee panels and an adjustable waistband. Developed with professional jockeys for riding, training and yard work.",
    price: 59,
    sizes: ['26"', '28"', '30"', '32"'],
    sizeHint: "Waist, in inches.",
    saddle: "Suede panels, rider tested",
    colourways: [
      { slug: "monarch-navy", name: "Monarch Navy", hex: "#2b2c4a", note: "Deep navy with tan suede knee panels.", image: "/media/breeches/monarch-navy.webp" },
      { slug: "eclipse-black", name: "Eclipse Black", hex: "#1f1c1b", note: "All black, with tonal suede knee panels.", image: "/media/breeches/eclipse-black.webp" },
    ],
    features: [
      "Developed with professional jockeys",
      "Luxury suede knee panels",
      "High waist with adjustable waistband",
      "Lightweight, breathable fabric",
      "Zipped hip pockets",
      "Stretch ankle cuffs",
    ],
    fit: "High-waisted and close through the leg. Sized by waist in inches, with an adjustable waistband to fine-tune the fit. Between sizes, size up.",
    care: "Machine wash cold, inside out, on a gentle cycle. Line dry to keep the suede panels soft.",
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

/** Spoken size for breeches, so 28" reads as "28 inch waist". */
export const sizeLabel = (p: Product, s: string) => (p.kind === "breech" ? `${parseInt(s, 10)} inch waist` : undefined);

export type Review = { quote: string; name: string; role: string };

// Real names from jod-z.com. Live-site quotes are truncated: get full text
// and permission from Jody before launch.
export const reviews: Review[] = [
  { quote: "My daughter absolutely loves Jod-Z. So comfortable and smart, whether she is at the yard or in the ring.", name: "Suzanne McGee", role: "Parent" },
  { quote: "So comfortable and flattering to wear. They have not moved once in the saddle.", name: "Paula Doherty", role: "Rider" },
  { quote: "This brand is excellent. I'm officially hooked.", name: "Claire Lewis", role: "Parent and rider" },
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/** Light colourways need dark UI on top of them. */
export const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
};
