import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "dark" | "light" | "ghost-light" | "ghost-dark" | "gold";
type Common = { variant?: Variant; children: ReactNode; arrow?: boolean; block?: boolean; className?: string };
type AsLink = Common & { href: string; onClick?: never; type?: never; disabled?: never };
type AsButton = Common & { href?: never; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean };

export const Arrow = () => (
  <svg className="btn-arrow" width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
    <path d="M0 5h16M12 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export function Button(props: AsLink | AsButton) {
  const { variant = "dark", children, arrow = true, block, className = "" } = props;
  const cls = `btn btn-${variant}${block ? " btn-block" : ""} ${className}`;
  const inner = (
    <>
      <span className="btn-label">{children}</span>
      {arrow && <Arrow />}
    </>
  );
  if (props.href !== undefined) {
    return <Link href={props.href} className={cls}>{inner}</Link>;
  }
  return (
    <button type={props.type ?? "button"} className={cls} onClick={props.onClick} disabled={props.disabled}>
      {inner}
    </button>
  );
}
