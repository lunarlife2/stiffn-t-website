import { useId } from "react";

/**
 * Sunburst.swift: rays from the middle, like a comic-book burst. A dark fill (greenPrimary400) with light rays
 * (greenPrimary300) that fade from 15% at the middle to 90% halfway out to full at the edge.
 * It fills its parent (which must be position: relative and overflow: hidden) with a square bigger than the parent,
 * so it can turn without gaps. It turns once every 120 s, as in the app, unless reduced motion is on.
 */
export function Sunburst({
  rays = 30,
  dark = "var(--green-primary-400)",
  light = "var(--green-primary-300)",
  spin = true,
  fit = false,
}: {
  rays?: number;
  dark?: string;
  light?: string;
  spin?: boolean;
  /** Size it to its parent only (small swatches); by default it's at least 1.5× the window height. */
  fit?: boolean;
}) {
  const gradient = `sunburst-${useId().replace(/:/g, "")}`;
  const step = (2 * Math.PI) / rays;
  const reach = 1.5; // past the square's corners (√2)
  const r = (n: number) => Math.round(n * 1000) / 1000;
  let d = "";
  for (let index = 0; index < rays; index++) {
    const start = index * step;
    d += `M0 0L${r(reach * Math.cos(start))} ${r(reach * Math.sin(start))}L${r(reach * Math.cos(start + step / 2))} ${r(
      reach * Math.sin(start + step / 2),
    )}Z`;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: fit ? "150%" : "max(150%, 150vh)",
        aspectRatio: "1",
        translate: "-50% -50%",
        pointerEvents: "none",
      }}
    >
      <svg viewBox="-1 -1 2 2" width="100%" height="100%" className={spin ? "sunburst-spin" : undefined}>
        <defs>
          {/* endRadius = min(width, height) / 2 = 1 in this square */}
          <radialGradient id={gradient} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse">
            <stop offset="0" style={{ stopColor: light, stopOpacity: 0.15 }} />
            <stop offset="0.5" style={{ stopColor: light, stopOpacity: 0.9 }} />
            <stop offset="1" style={{ stopColor: light, stopOpacity: 1 }} />
          </radialGradient>
        </defs>
        <rect x="-1" y="-1" width="2" height="2" style={{ fill: dark }} />
        <path d={d} fill={`url(#${gradient})`} />
      </svg>
    </div>
  );
}
