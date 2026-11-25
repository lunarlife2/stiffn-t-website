"use client";

import { useRef, type KeyboardEvent } from "react";
import { BrushStroke, FocusRing } from "@/components/BrushStroke";
import { FRAMES, type FrameId } from "@/lib/photobooth";
import { PreviewFrame } from "./PreviewFrame";
import { CheckBadge } from "./CheckBadge";
import styles from "./FramePicker.module.css";

const IDS = Object.keys(FRAMES) as FrameId[];

/**
 * The frames as small cards (Card style: white, 1.5 black outline, corner 16). Every card is the same size: a square
 * yellow500 thumbnail showing the frame on ONE 4:3 photo (the same view as the live preview, in both modes: a white
 * photo with a thin black outline and Steven where he sits), then the full name on one line. The chosen card gets the BrushStroke outline
 * (greenPrimary500, lineWidth 3, seed 3, as the Shop's chosen card) and a check mark.
 * A radio group: arrow keys move, Enter/Space choose. Wraps on wide screens, one sideways-scrolling row on phones.
 */
export function FramePicker({
  value,
  onChange,
  disabled,
}: {
  value: FrameId;
  onChange: (frame: FrameId) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = (index + move + IDS.length) % IDS.length;
    onChange(IDS[next]);
    refs.current[next]?.focus();
    refs.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  return (
    <div
      role="radiogroup"
      aria-label="Frame"
      className={styles.row}
    >
      {IDS.map((id, index) => {
        const frame = FRAMES[id];
        const chosen = id === value;
        return (
          <button
            key={id}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={chosen}
            aria-label={`Frame: ${frame.label}`}
            tabIndex={chosen ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`${styles.card} ${chosen ? styles.chosen : ""}`}
          >
            {chosen && <BrushStroke cornerRadius={16} lineWidth={3} seed={3} color="var(--green-primary-500)" />}
            <FocusRing cornerRadius={16} />
            {chosen && <CheckBadge className={styles.check} />}
            <span className={styles.thumb} aria-hidden="true">
              <span className={styles.fit}>
                <PreviewFrame mini background="cream" frame={id}>
                  <span className={styles.placeholder} />
                </PreviewFrame>
              </span>
            </span>
            <span className={styles.title}>{frame.title}</span>
          </button>
        );
      })}
    </div>
  );
}
