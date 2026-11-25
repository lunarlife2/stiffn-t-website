"use client";

import { useRef, type KeyboardEvent } from "react";
import { FocusRing } from "./BrushStroke";

/**
 * StiffntSegmented (UIFeature/Component/Toggle.swift): a cream capsule (greenPrimary100, padding 5) with one
 * segment per option. The chosen one is a greenPrimary500 pill with appBackground text; the others black text.
 * System 17 medium, segments 38 tall with 16 either side. Compact: 14 / 30 / 12, padding 4.
 * A radio group for screen readers and keyboards (arrow keys move the choice).
 */
export function SegmentedPill<T extends string>({
  label,
  options,
  value,
  onChange,
  compact = false,
  disabled = false,
}: {
  label: string;
  options: { value: T; title: string }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const scale = "var(--type-scale)";

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = (index + move + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        padding: compact ? `calc(4px * ${scale})` : "var(--segment-padding)",
        background: disabled ? "var(--shadow-100)" : "var(--green-primary-100)",
        borderRadius: 999,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {options.map((option, index) => {
        const chosen = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={chosen}
            tabIndex={chosen ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="segment"
            style={{
              position: "relative",
              minHeight: compact ? `calc(30px * ${scale})` : "var(--segment-height)",
              padding: `0 ${compact ? `calc(12px * ${scale})` : "var(--segment-padding-x)"}`,
              border: 0,
              borderRadius: 999,
              background: chosen ? "var(--green-primary-500)" : "transparent",
              color: chosen ? "var(--app-background)" : "var(--shadow-500)",
              fontFamily: "var(--family-text)",
              fontSize: compact ? `calc(14px * ${scale})` : "var(--segment-font-size)",
              fontWeight: 500,
              whiteSpace: "nowrap",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease-out, color 0.2s ease-out",
            }}
          >
            <FocusRing />
            <span style={{ position: "relative" }}>{option.title}</span>
          </button>
        );
      })}
    </div>
  );
}
