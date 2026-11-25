import type { CSSProperties, ReactNode } from "react";
import { Sunburst } from "@/components/Sunburst";
import {
  BACKGROUNDS,
  PREVIEW,
  previewPlacements,
  type BackgroundId,
  type FrameId,
} from "@/lib/photobooth";
import styles from "./PreviewFrame.module.css";

const pct = (value: number, of: number) => `${(value / of) * 100}%`;

/**
 * The setup preview (and the frame thumbnails): ONE 4:3 photo with a thin band of the frame colour round it and the
 * frame's Stevens on it — what the photos will look like, without the printed footer (that's only on the result).
 * Laid out from lib/photobooth.ts PREVIEW in percentages, so it scales to any size.
 */
export function PreviewFrame({
  background,
  frame,
  children,
  mini = false,
}: {
  background: BackgroundId;
  frame: FrameId;
  /** What's in the photo: the camera and stickers, or a placeholder (thumbnails). */
  children: ReactNode;
  mini?: boolean;
}) {
  const look = BACKGROUNDS[background];
  const { width, height, inset, radius } = PREVIEW;
  return (
    <div
      className={`${styles.frame} ${mini ? styles.mini : ""}`}
      style={{ background: look.fill }}
    >
      {look.burst && (
        <Sunburst
          dark={look.burst.dark}
          light={look.burst.light}
          spin={false}
          fit
        />
      )}
      <div
        className={styles.photo}
        style={{
          left: pct(inset, width),
          top: pct(inset, height),
          right: pct(inset, width),
          bottom: pct(inset, height),
          borderRadius: `${(radius / width) * 100}cqw`,
        }}
      >
        {children}
      </div>
      {previewPlacements(frame).map((place, index) => {
        // Thumbnails: the small ×20 Stevens drawn 1.5× bigger around the same spot, so they're recognisable.
        const grow = mini && place.size < 300 ? 1.5 : 1;
        const size = place.size * grow;
        const left = place.left - (size - place.size) / 2;
        const top = place.top - (size - place.size) / 2;
        return (
          // eslint-disable-next-line @next/next/no-img-element -- placed in % on the photo
          <img
            key={index}
            src={place.src}
            alt=""
            className={`${styles.steven} steven-outline`}
            style={
              {
                left: pct(left, width),
                top: pct(top, height),
                width: pct(size, width),
                transform: `rotate(${place.rotate}deg)${place.flip ? " scaleX(-1)" : ""}`,
                "--outline-w": mini ? "1px" : "3px",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
