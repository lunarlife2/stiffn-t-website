"use client";

import { useEffect, useRef, useState } from "react";
import type { Interaction } from "@/config/catalog";
import { Badge } from "@/components/Badge";
import { FocusRing } from "@/components/BrushStroke";
import styles from "./LaserVideo.module.css";

/**
 * The interaction's preview video, big, with the Shop's look (ShopView.CardVideo): muted, looping, a progress bar
 * along the bottom (greenPrimary100 track, greenPrimary500 fill), the "Active" badge, and a play/pause button
 * that is always visible. Until it plays, the poster frame shows. Loaded only when it first plays (preload none).
 *
 * When it plays: on every device, while it's on screen (at least 60% visible), muted and looping. It stops when it
 * scrolls away. With reduced motion it only plays after a press on the play button. Pausing by hand stops autoplay.
 */
export function LaserVideo({ item, active, className }: { item: Interaction; active?: boolean; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const pausedByHand = useRef(false);

  const play = () => {
    video.current?.play().catch(() => setPlaying(false));
  };
  const stop = () => {
    video.current?.pause();
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !box.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (!pausedByHand.current) play();
        } else {
          stop();
        }
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    if (playing) {
      pausedByHand.current = true;
      stop();
    } else {
      pausedByHand.current = false;
      play();
    }
  };

  return (
    <div ref={box} className={`${styles.box} ${className ?? ""}`}>
      <video
        ref={video}
        className={styles.video}
        src={item.video}
        poster={item.poster}
        preload="none"
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const element = event.currentTarget;
          if (element.duration) setProgress(element.currentTime / element.duration);
        }}
      />
      {active && (
        <span className={styles.badge}>
          <Badge>Active</Badge>
        </span>
      )}
      <button
        type="button"
        className={styles.control}
        onClick={toggle}
        aria-label={playing ? `Pause the ${item.name} preview` : `Play the ${item.name} preview`}
      >
        <FocusRing />
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 18 18" style={{ position: "relative" }}>
          {playing ? (
            <path d="M5 3.5v11M13 3.5v11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          ) : (
            <path d="M5.5 3.2v11.6c0 .6.7 1 1.2.7l8.7-5.8c.5-.3.5-1 0-1.3L6.7 2.5c-.5-.3-1.2.1-1.2.7Z" fill="currentColor" />
          )}
        </svg>
      </button>
      {(playing || progress > 0) && (
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} style={{ width: `${progress * 100}%` }} />
        </span>
      )}
    </div>
  );
}
