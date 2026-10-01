// Commercial settings in one place. Pack pricing, delivery and the
// free-shipping message are proposals: confirm with Jody before launch.

export type Pack = { pairs: number; price: number; label: string; tag?: string };

export const legPacks: Pack[] = [
  { pairs: 1, price: 59, label: "1 pair" },
  { pairs: 2, price: 109, label: "2 pairs", tag: "Save €9" },
  { pairs: 3, price: 149, label: "3 pairs", tag: "Save €28" },
];

export const delivery = {
  carrier: "DPD",
  window: "1 to 3 working days",
  freeMessage: "Free shipping unlocked on your order",
};

export const announcements = [
  { icon: "truck", text: `${delivery.window} delivery with ${delivery.carrier}` },
  { icon: "clover", text: "Irish-owned brand" },
  { icon: "klarna", text: "Pay in 3, interest free with" },
  { icon: "globe", text: "Ships to Ireland, the UK and Europe" },
] as const;

export const trustPoints = [
  { icon: "clover", title: "Irish-owned brand", sub: "Designed and tested by riders" },
  { icon: "truck", title: `${delivery.window}`, sub: `Tracked ${delivery.carrier} delivery` },
  { icon: "horse", title: "Made for the saddle", sub: "Silicone grip, fully opaque" },
] as const;
