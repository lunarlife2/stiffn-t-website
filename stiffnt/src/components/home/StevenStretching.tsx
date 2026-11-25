import { useId } from "react";
import { preload } from "react-dom";
import styles from "./StevenStretching.module.css";

/** Drawn on a 1080 × 1080 canvas (the app's pictures; the files served are 760px copies, enough for the hero); the app's canvas for this pose is 360, so 3 units per app point. */
const SIZE = 1080;
const UNIT = SIZE / 360;
/** StevenOutline.width(forSize:) for the 360-point cat: max(1.2, 360 × 0.014) ≈ 5 points. */
const OUTLINE = Math.max(1.2, 360 * 0.014) * UNIT;

/**
 * Steven stretching, as the app's exercise buddy (UIFeature/PetPresence/ExerciseBuddyPoses.swift): the body
 * (its body, front, ear, ear shade and eyes layers stacked into one picture) with the tail as its own layer on top,
 * swaying around the point where it joins him (Pivot.tail, 330 × 115 of 360).
 *
 * Drawn as one SVG so the white sticker outline (StevenOutline) is a filter on the whole cat, tail included, and is
 * redrawn every frame while the tail moves. (A CSS filter on a wrapper loses the moving tail in Safari.)
 * The outline grows the cat's shape by about 5 app points (StevenOutline). Still with reduced motion.
 */
const BODY = "/images/steven/small/steven-stretching-body.png";
const TAIL = "/images/steven/small/steven-stretching-tail.png";

export function StevenStretching({ className }: { className?: string }) {
  // He's the first thing on the page: start loading him with the HTML (an SVG <image> is found late otherwise).
  preload(BODY, { as: "image", fetchPriority: "high" });
  preload(TAIL, { as: "image", fetchPriority: "high" });
  const filter = `steven-outline-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={`${styles.steven} ${className ?? ""}`}
      role="img"
      aria-label="Steven, a black cat, in a big stretch"
    >
      <defs>
        <filter id={filter} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={OUTLINE} result="grown" />
          <feFlood floodColor="#ffffff" />
          <feComposite in2="grown" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${filter})`}>
        <image href={BODY} width={SIZE} height={SIZE} />
        <image href={TAIL} width={SIZE} height={SIZE} className={styles.tail} />
      </g>
    </svg>
  );
}
