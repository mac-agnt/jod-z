"use client";
import { useEffect, useState } from "react";

// Handwritten wordmark draws itself, then the panel slides away.
// Plays once per session; skipped entirely for reduced motion.
export function Loader() {
  const [stage, setStage] = useState<"draw" | "exit" | "gone">("draw");

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.loader === "done") { setStage("gone"); return; }
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>;
    const start = () => {
      root.classList.add("loader-go");
      t1 = setTimeout(() => { setStage("exit"); root.dataset.loader = "done"; }, 2500);
      t2 = setTimeout(() => {
        setStage("gone");
        try { sessionStorage.setItem("jz-loaded", "1"); } catch {}
      }, 3500);
    };
    Promise.race([document.fonts.load("120px 'Mrs Saint Delafield'"), new Promise((r) => setTimeout(r, 1200))]).then(start);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (stage === "gone") return null;
  return (
    <div className={`loader ${stage === "exit" ? "exit" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 700 260" className="loader-mark">
        <text x="50%" y="62%" textAnchor="middle" className="loader-text">Jod-Z</text>
        <path d="M230 214 L470 214" className="loader-rule" />
      </svg>
    </div>
  );
}

/** Runs before paint: skip the loader on repeat visits / reduced motion. */
export const loaderBootScript = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem('jz-loaded')||matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.loader='done'}setTimeout(function(){d.dataset.loader='done'},5000)}catch(e){document.documentElement.dataset.loader='done'}})();`;
