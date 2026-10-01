import type { Metadata } from "next";
import { Portal } from "./Portal";

export const metadata: Metadata = { title: "Trade portal | Jod-Z", robots: { index: false } };

export default function Page() {
  return <Portal />;
}
