"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { brushStrokePath, type BrushStrokeOptions } from "@/lib/brushStroke";

type Props = BrushStrokeOptions & {
  /** Any CSS color, e.g. "var(--green-primary-500)". Defaults to currentColor. */
  color?: string;
  /** Grow (negative) or shrink (positive) the stroked rectangle from its parent's edges, in px. */
  inset?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * The app's hand-drawn outline (BrushStroke.swift), drawn over its parent: the parent must be
 * `position: relative`. It measures the parent and redraws when it changes size.
 * Decorative only: hidden from screen readers.
 */
export function BrushStroke({ color = "currentColor", inset = 0, className, style, ...options }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const measure = () => {
      const w = parent.offsetWidth - inset * 2;
      const h = parent.offsetHeight - inset * 2;
      setSize((old) => (old && old.w === w && old.h === h ? old : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [inset]);

  const { gap, wiggle, sizeJitter, angularJitter, rotation, cornerRadius, lineWidth, seed } = options;
  const d = useMemo(
    () =>
      size
        ? brushStrokePath(size.w, size.h, { gap, wiggle, sizeJitter, angularJitter, rotation, cornerRadius, lineWidth, seed })
        : "",
    [size, gap, wiggle, sizeJitter, angularJitter, rotation, cornerRadius, lineWidth, seed],
  );

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size?.w ?? 0}
      height={size?.h ?? 0}
      style={{
        position: "absolute",
        left: inset,
        top: inset,
        overflow: "visible",
        pointerEvents: "none",
        ...style,
      }}
    >
      {d && <path d={d} style={{ fill: color }} fillRule="evenodd" />}
    </svg>
  );
}

/**
 * Website-only keyboard focus ring (approved; the app has none): a second BrushStroke in shadow500,
 * lineWidth 3, seed 7, 4px outside the element. Shown by CSS only while the parent has :focus-visible
 * (see .focus-ring in globals.css). The parent must be position: relative.
 */
export function FocusRing({ cornerRadius = 999 }: { cornerRadius?: number }) {
  return (
    <BrushStroke
      className="focus-ring"
      color="var(--shadow-500)"
      inset={-4}
      cornerRadius={cornerRadius === 999 ? 999 : cornerRadius + 4}
      lineWidth={3}
      seed={7}
    />
  );
}
