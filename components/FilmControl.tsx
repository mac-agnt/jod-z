"use client";
import { useEffect, useRef, useState } from "react";

const R = 20;
const C = 2 * Math.PI * R;

// Pause/play for the autoplaying hero film (WCAG 2.2.2). The ring traces
// playback progress; it is written straight to the DOM, not React state.
export function FilmControl({ target }: { target: string }) {
  const ring = useRef<SVGCircleElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = document.getElementById(target);
    if (!(v instanceof HTMLVideoElement)) return;
    let raf = 0;
    const tick = () => {
      if (ring.current && v.duration) ring.current.style.strokeDashoffset = String(C * (1 - v.currentTime / v.duration));
      raf = requestAnimationFrame(tick);
    };
    const on = () => { setPlaying(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    const off = () => { setPlaying(false); cancelAnimationFrame(raf); };
    v.addEventListener("play", on);
    v.addEventListener("pause", off);
    if (!v.paused) on();
    return () => {
      v.removeEventListener("play", on);
      v.removeEventListener("pause", off);
      cancelAnimationFrame(raf);
    };
  }, [target]);

  const toggle = () => {
    const v = document.getElementById(target);
    if (!(v instanceof HTMLVideoElement)) return;
    if (v.paused) {
      delete v.dataset.userPaused;
      v.play().catch(() => {});
    } else {
      v.dataset.userPaused = "1";
      v.pause();
    }
  };

  return (
    <button type="button" className="film" onClick={toggle} aria-label={playing ? "Pause film" : "Play film"}>
      <svg className="film-svg" viewBox="0 0 48 48" aria-hidden="true">
        <circle className="film-track" cx="24" cy="24" r={R} />
        <circle ref={ring} className="film-ring" cx="24" cy="24" r={R} style={{ strokeDasharray: C, strokeDashoffset: C }} />
      </svg>
      <svg className="film-glyph" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        {playing ? (
          <>
            <rect x="2" y="1.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
            <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8" fill="currentColor" />
          </>
        ) : (
          <path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}
