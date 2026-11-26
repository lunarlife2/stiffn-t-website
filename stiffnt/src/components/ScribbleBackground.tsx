import { SCRIBBLE_FRAMES } from "@/config/scribble";
import styles from "./ScribbleBackground.module.css";

/**
 * The green background from the App Icon artwork: a green gradient with thin hand-drawn scribble lines.
 * The scribble is drawn five slightly different ways and the drawings swap five times a second, so the lines
 * look sketched live (the same effect as the exhibition loops). With reduced motion it stays on the first drawing.
 * It fills its parent (which must be position: relative and overflow: hidden) and is cropped, never stretched.
 */
export function ScribbleBackground() {
  return (
    <svg
      aria-hidden="true"
      className={styles.background}
      viewBox="0 0 2560 1440"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <defs>
        <radialGradient
          id="scribble-green"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(1980 720) rotate(146.104) scale(1542.08 1496.39)"
        >
          <stop stopColor="#3C9619" />
          <stop offset="1" stopColor="#7AC743" />
        </radialGradient>
      </defs>
      <rect width="2560" height="1440" fill="url(#scribble-green)" />
      {SCRIBBLE_FRAMES.map((paths, index) => (
        <g key={index} className={styles.frame} style={{ animationDelay: `${-index * 0.2}s` }}>
          {paths.map((d, line) => (
            <path key={line} d={d} />
          ))}
        </g>
      ))}
    </svg>
  );
}
