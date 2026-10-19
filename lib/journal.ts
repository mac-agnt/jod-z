// Journal entries. Slugs match the old Shopify blog so /blogs/news/* links
// redirect here. Short versions written for this site; Jody can replace the
// body with the full original articles.

export type Post = { slug: string; title: string; date: string; author: string; image: string; alt: string; excerpt: string; body: string[] };

export const posts: Post[] = [
  {
    slug: "tested-beyond-the-arena",
    title: "Tested beyond the arena",
    date: "2026-01-19",
    author: "Jod-Z",
    image: "/media/lifestyle-gallop.webp",
    alt: "Young rider cantering in Jod-Z leggings",
    excerpt: "Hunting days, Pony Games and Pony Club rallies are where our legwear earns its place.",
    body: [
      "Most riding does not happen on a groomed surface in perfect weather. It happens out hunting, in Pony Games heats, and across long Pony Club rallies that start before sunrise.",
      "So that is where we test. Every pair goes through real days: turning fast, jumping, sitting in a wet saddle and walking back to the lorry covered in mud.",
      "If a pair keeps its shape, stays opaque and keeps the rider secure through all of that, it is ready for anything else.",
    ],
  },
  {
    slug: "specialists-not-generalists",
    title: "Specialists, not generalists",
    date: "2026-01-19",
    author: "Jod-Z",
    image: "/media/lifestyle-saddle.webp",
    alt: "Rider in the saddle wearing Jod-Z leggings",
    excerpt: "We make legwear for riders, and we work on it with riders every day.",
    body: [
      "We are not trying to be everything to everyone. We make legwear for riding, and we put all of our attention there.",
      "That means time in real yards with real riders, listening to what works and what does not, then changing the pattern, the grip or the fabric and testing again.",
      "Different riders need different things, so each style is shaped around how it will actually be worn. Small improvements, made again and again, so our riders never have to compromise.",
    ],
  },
  {
    slug: "it-starts-with-the-fabric",
    title: "It starts with the fabric",
    date: "2026-01-19",
    author: "Jod-Z",
    image: "/media/flatlay.webp",
    alt: "Jod-Z leggings laid flat on marble",
    excerpt: "How a fabric behaves in the saddle matters more than how it looks on a hanger.",
    body: [
      "Every Jod-Z style starts with choosing the fabric, and we choose it for how it behaves when you ride: stretch that recovers, weight that stays opaque, and a hand that feels good on long days.",
      "We test materials in heat, cold, rain and the constant friction of the saddle, because legwear that loses its shape after a season is not good enough.",
      "We do not follow trends. We focus on construction, performance and how long a pair lasts.",
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
