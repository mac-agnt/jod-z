"use client";
import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import { heroMedia } from "@/lib/media";

// Portrait screens get a centre crop of the poster; it is what object-fit
// shows there anyway, at half the bytes.
const TALL = "(max-aspect-ratio: 1/1)";
const WIDE = "(min-aspect-ratio: 1/1)";

// The poster is a real <img> under the video so it can be preloaded, sized
// per screen and paint as the LCP element. It takes the video's class, so it
// gets the same grade and settle animation. The video has no poster of its
// own: it stays transparent, showing this image, until the film plays.
//
// React sets `muted` as a property after load, which some browsers treat as
// unmuted and block autoplay. Force it, then play once the page has loaded so
// the film never competes with the poster, fonts and scripts. Reduced motion
// stays on the poster and downloads no video at all.
export function HeroVideo() {
  preload(heroMedia.posterTall, { as: "image", fetchPriority: "high", media: TALL });
  preload(heroMedia.poster, { as: "image", fetchPriority: "high", media: WIDE });
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
    let loaded = false;
    const sync = () => {
      if (!loaded || v.dataset.userPaused) return;
      if (onScreen && document.visibilityState === "visible") v.play().catch(() => {});
      else v.pause();
    };
    const start = () => { loaded = true; sync(); };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("load", start);
    };
  }, []);
  return (
    <>
      <picture>
        <source media={TALL} srcSet={heroMedia.posterTall} />
        <img className="hero-video" src={heroMedia.poster} alt="" fetchPriority="high" />
      </picture>
      <video ref={ref} id="hero-video" className="hero-video" muted loop playsInline preload="none" aria-label={heroMedia.alt}>
        <source src={heroMedia.videoMobileWebm} type='video/webm; codecs="vp9"' media="(max-width: 720px)" />
        <source src={heroMedia.videoMobile} type="video/mp4" media="(max-width: 720px)" />
        <source src={heroMedia.videoWebm} type='video/webm; codecs="vp9"' />
        <source src={heroMedia.video} type="video/mp4" />
      </video>
    </>
  );
}
