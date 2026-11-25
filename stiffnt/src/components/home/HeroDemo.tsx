"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./HeroDemo.module.css";

/** Seconds into the recording where the person appears (the first two seconds are the Start screen). */
const LOOP_START = 2;

/**
 * The hero's picture: a MacBook with the stretch screen recording playing on it (a person doing a neck turn while
 * Steven's stretch window checks them with the camera), so the page says "stretching" straight away.
 * `children` is Steven, who sits across the laptop's bottom left corner.
 *
 * The video is muted and repeats, and plays on every device. With reduced motion it stays on its poster frame.
 * The laptop frame (public/images/hero/laptop.png) has a see-through screen; the video sits behind it.
 */
export function HeroDemo({ children }: { children?: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null);

  // The recording opens with two seconds of the Start screen (camera still black). It plays once, then every
  // repeat starts at the person, so the loop never flashes black.
  const restart = () => {
    const el = video.current;
    if (!el) return;
    el.currentTime = LOOP_START;
    el.play().catch(() => {});
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.current?.pause();
  }, []);

  return (
    <div className={styles.stage}>
      <div className={styles.screen}>
        <video
          ref={video}
          className={styles.video}
          src="/videos/stretch-demo.mp4"
          poster="/videos/posters/stretch-demo.jpg"
          autoPlay
          muted
          playsInline
          onEnded={restart}
          preload="auto"
          aria-label="Screen recording: Steven's stretch window checking a neck turn with the camera"
        />
      </div>
      <Image
        src="/images/hero/laptop.png"
        alt=""
        width={1600}
        height={1053}
        sizes="(min-width: 900px) 640px, 90vw"
        className={styles.laptop}
        priority
      />
      {children && <div className={styles.buddy}>{children}</div>}
    </div>
  );
}
