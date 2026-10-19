import type { ReactNode } from "react";
import { stills } from "@/lib/media";
import { Logo } from "./Logo";

/** Shared layout for one-step email confirmations (sign-up, guardian consent). */
export function ConfirmPanel({ title, body, action, token, button, children }: { title: string; body: ReactNode; action?: (f: FormData) => Promise<void>; token?: string; button?: string; children?: ReactNode }) {
  return (
    <main className="auth">
      <div className="auth-visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stills.trio} alt="Three young riders on their ponies in Jod-Z leggings" />
      </div>
      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-logo"><Logo /></div>
          <h1 className="serif auth-title">{title}</h1>
          <div className="auth-sub">{body}</div>
          {action && token && (
            <form action={action} className="auth-form">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn btn-light btn-block"><span className="btn-label">{button}</span></button>
            </form>
          )}
          {children}
        </div>
      </div>
    </main>
  );
}
