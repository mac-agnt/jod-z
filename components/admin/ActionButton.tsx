"use client";
import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/admin/actions";

/** Runs a bound server action and shows its result next to the button. */
export function ActionButton({ action, children, confirm, tone }: { action: () => Promise<ActionResult>; children: ReactNode; confirm?: string; tone?: "primary" | "danger" }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  return (
    <span className="ad-actions" style={{ alignItems: "center" }}>
      <button
        type="button"
        className={`ad-btn${tone ? ` ${tone}` : ""}`}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => setMsg(await action()));
        }}
      >
        {pending ? "Working" : children}
      </button>
      {msg && <span role="status" className="ad-note" style={{ color: msg.ok ? undefined : "#ef7b7b" }}>{msg.message}</span>}
    </span>
  );
}

/** A small form posting to a bound server action, with the result inline. */
export function ActionForm({ action, children, submit }: { action: (f: FormData) => Promise<ActionResult>; children: ReactNode; submit: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  return (
    <form
      className="ad-actions"
      style={{ alignItems: "center" }}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => setMsg(await action(data)));
      }}
    >
      {children}
      <button type="submit" className="ad-btn" disabled={pending}>{pending ? "Working" : submit}</button>
      {msg && <span role="status" className="ad-note" style={{ color: msg.ok ? undefined : "#ef7b7b" }}>{msg.message}</span>}
    </form>
  );
}
