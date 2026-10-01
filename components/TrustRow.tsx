import { trustPoints } from "@/lib/offer";
import { Icon } from "./Icon";

/** `saddle` swaps the product line under "Made for the saddle". */
export function TrustRow({ saddle }: { saddle?: string }) {
  return (
    <ul className="trust-row">
      {trustPoints.map((t) => (
        <li key={t.title}>
          <span className="trust-ico"><Icon name={t.icon} size={22} /></span>
          <strong>{t.title}</strong>
          <span>{t.icon === "horse" && saddle ? saddle : t.sub}</span>
        </li>
      ))}
    </ul>
  );
}
