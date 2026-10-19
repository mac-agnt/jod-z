// Every photo/video slot on the site. Files live in /public/media.

export const heroMedia = {
  video: "/media/hero.mp4", // H.264 960w, 40s loop, muted
  videoWebm: "/media/hero.webm", // VP9 1280w, preferred where supported
  videoMobile: "/media/hero-mobile.mp4", // 9:16 crop of the same footage, H.264 540w
  videoMobileWebm: "/media/hero-mobile.webm", // VP9 720w
  poster: "/media/hero-poster.webp", // 1920x1030, from hero-poster.jpg (kept for social cards)
  posterTall: "/media/hero-poster-tall.webp", // centre 1160x1030 of the same frame, for portrait screens
  alt: "Young riders show jumping in Jod-Z",
};

export const stills = {
  render: "/media/product-render.webp",
  flatlay: "/media/flatlay.webp",
  pocket: "/media/detail-pocket.webp",
  stable: "/media/lifestyle-stable.webp",
  saddle: "/media/lifestyle-saddle.webp",
  gallop: "/media/lifestyle-gallop.webp",
  door: "/media/lifestyle-door.webp",
  sunset: "/media/lifestyle-sunset.webp",
  trio: "/media/lifestyle-trio.webp",
  seat: "/media/detail-seat.webp",
};

// Sign-in and partner pages: 5/12 of the screen beside the form, full width
// above it on small screens.
export const AUTH_VISUAL_SIZES = "(max-width: 860px) 100vw, 42vw";

// Breech details. Colourway studio shots are set on the product.
export const breechStills = {
  detail: "/media/breeches/monarch-detail.webp",
  flat: "/media/breeches/eclipse-flat.webp",
};

export type Reel = {
  kind: "video" | "image";
  src: string;
  /** smaller VP9 copy of a video `src`, offered first */
  webm?: string;
  poster?: string;
  caption: string;
  alt: string;
  /** colourway slug worn, links "Shop this colour" */
  colour?: string;
};

// Rider content roll. First card is the lead video; the rest are 720x1280
// stills. Cards are clamp(220px, 20vw, 300px) wide.
export const REEL_SIZES = "(min-width: 1500px) 300px, (min-width: 1100px) 20vw, 220px";
export const reels: Reel[] = [
  { kind: "video", src: "/media/ugc/rider-clip.mp4", webm: "/media/ugc/rider-clip.webm", poster: "/media/ugc/rider-clip-poster.webp", caption: "Show day", alt: "Rider in Buttermilk Beige Jod-Z leggings in the saddle at a show", colour: "buttermilk-beige" },
  { kind: "image", src: "/media/ugc/mirror-selfie.webp", caption: "Tack room check", alt: "Young rider taking a mirror selfie in Buttermilk Beige Jod-Z leggings", colour: "buttermilk-beige" },
  { kind: "image", src: "/media/ugc/muck-coffee.webp", caption: "Muck, coffee and Jod-Z", alt: "Rider's legs in Admiral Navy Jod-Z leggings holding a coffee in a muddy yard", colour: "admiral-navy" },
  { kind: "image", src: "/media/ugc/best-purchase.webp", caption: "Best purchase ever", alt: "Rider hugging her chestnut horse, wearing Midnight Black Jod-Z leggings", colour: "midnight-black" },
  { kind: "image", src: "/media/ugc/yard-day.webp", caption: "Yard day", alt: "Rider with her horse and dog in Admiral Navy Jod-Z leggings", colour: "admiral-navy" },
  { kind: "image", src: "/media/ugc/lorry-coffee.webp", caption: "Lorry, coffee, done", alt: "Rider relaxing in the lorry in Buttermilk Beige Jod-Z leggings", colour: "buttermilk-beige" },
  { kind: "image", src: "/media/ugc/match-your-day.webp", caption: "Match your day", alt: "Rider pulling on gloves in the stable in Buttermilk Beige Jod-Z leggings", colour: "buttermilk-beige" },
  { kind: "image", src: "/media/ugc/good-horses.webp", caption: "Good horses, better days", alt: "Three riders hacking out in navy, beige and brown Jod-Z leggings" },
  { kind: "image", src: "/media/ugc/every-rider.webp", caption: "For every rider", alt: "Rider grooming his horse in Stone Grey Jod-Z leggings", colour: "stone-grey" },
  { kind: "image", src: "/media/ugc/different-days.webp", caption: "Different days, same comfort", alt: "Stack of folded Jod-Z leggings in beige, brown, navy and black" },
  { kind: "image", src: "/media/ugc/folded-trio.webp", caption: "The everyday three", alt: "Three folded Jod-Z leggings in beige, navy and brown" },
];
