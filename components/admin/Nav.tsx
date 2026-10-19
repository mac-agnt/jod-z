"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; count?: number };

export function AdminNav({ groups }: { groups: { title: string; items: Item[] }[] }) {
  const path = usePathname();
  return (
    <nav className="ad-nav" aria-label="Dashboard">
      {groups.map((g) => (
        <div key={g.title} style={{ display: "contents" }}>
          <p className="ad-nav-group">{g.title}</p>
          {g.items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={(i.href === "/admin" ? path === i.href : path.startsWith(i.href)) ? "page" : undefined}>
              <span>{i.label}</span>
              {!!i.count && <span className="ad-count" aria-label={`${i.count} waiting`}>{i.count}</span>}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
