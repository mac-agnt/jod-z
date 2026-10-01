import { CheckCircle, Clover, GlobeHemisphereWest, Horse, Truck } from "@phosphor-icons/react/dist/ssr";

const map = { truck: Truck, clover: Clover, horse: Horse, globe: GlobeHemisphereWest, check: CheckCircle } as const;
export type IconName = keyof typeof map;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const C = map[name];
  return <C size={size} weight="light" aria-hidden="true" />;
}
