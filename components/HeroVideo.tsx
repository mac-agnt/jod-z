"use client";
import { useEffect, useRef } from "react";
import { heroMedia } from "@/lib/media";

// React sets `muted` as a property after load, which some browsers treat as
// unmuted and block autoplay. Force it, then play; stay on the poster for
// reduced motion.
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Play while on screen and the tab is visible, unless the viewer paused
    // it with the film control (data-user-paused). Browsers pause background
    // video and do not always resume it.
    let onScreen = true;
    const sync = () => {
      if (v.dataset.userPaused) return;
      if (onScreen && document.visibilityState === "visible") v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);
  return (
    <video ref={ref} id="hero-video" className="hero-video" muted loop playsInline preload="auto" poster={heroMedia.poster} aria-label={heroMedia.alt}>
      <source src={heroMedia.videoMobile} type="video/mp4" media="(max-width: 720px)" />
      <source src={heroMedia.video} type="video/mp4" />
    </video>
  );
}
