"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution, track } from "@/lib/analytics/client";

// Module-level so React's development double-mount does not count twice.
let last = "";

/** Records the landing source once per visit and a page view per route. */
export function Tracking() {
  const path = usePathname();
  useEffect(() => { captureAttribution(); }, []);
  useEffect(() => {
    if (path === last) return;
    last = path;
    track("page_view");
  }, [path]);
  return null;
}
