"use client";
import { useEffect, useState } from "react";
import { announcements, delivery } from "@/lib/offer";
import { useCart } from "./Cart";
import { Icon } from "./Icon";
import { Klarna } from "./Klarna";

// Rotates brand messages; once the bag has something in it the bar
// switches to the free-shipping confirmation and stays there.
export function AnnouncementBar() {
  const { count } = useCart();
  const [i, setI] = useState(0);
  const unlocked = count > 0;

  useEffect(() => {
    if (unlocked || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % announcements.length), 4200);
    return () => clearInterval(t);
  }, [unlocked]);

  return (
    <div className={`announce ${unlocked ? "unlocked" : ""}`} role="status" aria-live="polite">
      {unlocked ? (
        <p className="announce-msg in" key="free">
          <Icon name="check" size={16} />
          <span>{delivery.freeMessage}</span>
          <span className="announce-sep" />
          <span className="announce-sub">Arrives in {delivery.window.toLowerCase()}</span>
        </p>
      ) : (
        announcements.map((a, n) => (
          <p key={a.text} className={`announce-msg ${n === i ? "in" : ""}`} aria-hidden={n !== i}>
            {a.icon !== "klarna" && <Icon name={a.icon} size={16} />}
            <span>{a.text}</span>
            {a.icon === "klarna" && <Klarna />}
          </p>
        ))
      )}
    </div>
  );
}
