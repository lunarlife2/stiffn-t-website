"use client";

import { useRef, type KeyboardEvent } from "react";
import { BrushStroke, FocusRing } from "@/components/BrushStroke";
import { Sunburst } from "@/components/Sunburst";
import { BACKGROUNDS, type BackgroundId } from "@/lib/photobooth";
import { CheckBadge } from "./CheckBadge";
import styles from "./ColourPicker.module.css";

const GROUPS: { title: string; ids: BackgroundId[] }[] = [
  { title: "Colour", ids: ["cream", "green", "yellow"] },
  { title: "Pattern", ids: ["burst-green", "burst-yellow", "burst-blue", "burst-orange"] },
];
const ALL = GROUPS.flatMap((group) => group.ids);

/**
 * The paper's colour as swatches: a round sample of the real colour or sunburst with a black outline, the name under
 * it. One radio group (arrow keys move across both rows, Enter/Space choose), shown as two labelled rows.
 * Chosen: BrushStroke ring (greenPrimary500) + check mark, so it isn't shown by colour alone.
 */
export function ColourPicker({
  value,
  onChange,
  disabled,
}: {
  value: BackgroundId;
  onChange: (value: BackgroundId) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Partial<Record<BackgroundId, HTMLButtonElement | null>>>({});

  const onKeyDown = (event: KeyboardEvent, id: BackgroundId) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = ALL[(ALL.indexOf(id) + move + ALL.length) % ALL.length];
    onChange(next);
    refs.current[next]?.focus();
    refs.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  return (
    <div role="radiogroup" aria-label="Frame colour" className={styles.groups}>
      {GROUPS.map((group) => (
        <div key={group.title} className={styles.group}>
          <p className={styles.groupTitle} aria-hidden="true">
            {group.title}
          </p>
          <div className={styles.row}>
            {group.ids.map((id) => {
              const look = BACKGROUNDS[id];
              const chosen = id === value;
              return (
                <button
                  key={id}
                  ref={(element) => {
                    refs.current[id] = element;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  aria-label={`Frame colour: ${look.title}`}
                  tabIndex={chosen ? 0 : -1}
                  disabled={disabled}
                  onClick={() => onChange(id)}
                  onKeyDown={(event) => onKeyDown(event, id)}
                  className={`${styles.option} ${chosen ? styles.chosen : ""}`}
                >
                  <span className={styles.swatchWrap}>
                    {chosen && (
                      <span className={styles.ring}>
                        <BrushStroke cornerRadius={999} lineWidth={3} seed={3} color="var(--green-primary-500)" />
                      </span>
                    )}
                    <span className={styles.swatch} style={{ background: look.fill }}>
                      {look.burst && <Sunburst dark={look.burst.dark} light={look.burst.light} spin={false} fit rays={16} />}
                    </span>
                    {chosen && <CheckBadge className={styles.check} />}
                  </span>
                  <FocusRing cornerRadius={14} />
                  <span className={styles.name}>{look.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
