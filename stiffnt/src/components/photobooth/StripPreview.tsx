"use client";

import { useRef, type CSSProperties, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { Sunburst } from "@/components/Sunburst";
import {
  BACKGROUNDS,
  PAPER,
  framePlacements,
  paperHeight,
  slotTop,
  type BackgroundId,
  type FrameId,
  type Sticker,
} from "@/lib/photobooth";
import { PreviewFrame } from "./PreviewFrame";
import styles from "./StripPreview.module.css";

const pct = (value: number, of: number) => `${(value / of) * 100}%`;

/** What the strip needs to let the stickers be moved on it (step 2, desktop): the same stickers on every photo. */
export type StripEditing = {
  selected: number | null;
  /** The chosen sticker's ✕ (top right) and resize handle (bottom right) act on these. */
  onRemove: (sticker: Sticker) => void;
  /** `area` is the photo the sticker is on (its size is measured against it). */
  onResizePointerDown: (event: PointerEvent, sticker: Sticker, area: HTMLElement | null) => void;
  /** A sticker from the tray was dropped on photo `slot`, at x / y (shares of that photo). */
  onDropSticker: (kind: string, slot: number, x: number, y: number) => void;
  onStickerPointerDown: (event: PointerEvent, sticker: Sticker) => void;
  onStickerKeyDown: (event: KeyboardEvent, sticker: Sticker) => void;
  onStickerFocus: (sticker: Sticker) => void;
  onDeselect: () => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
};

/** What a sticker dragged from the tray carries. */
export const STICKER_DRAG_TYPE = "application/x-stiffnt-sticker";

/**
 * The stickers on one photo, where they are on the paper (shares of the photo's width and height).
 * With `editing` they can be dragged around that photo.
 */
function StickerLayer({
  stickers,
  outline,
  editing,
}: {
  stickers: Sticker[];
  outline: string;
  editing?: StripEditing;
}) {
  return (
    <>
      {stickers.map((sticker) => {
        const picture = (
          // eslint-disable-next-line @next/next/no-img-element -- placed in % on the photo
          <img src={sticker.src} alt="" draggable={false} className={sticker.outline ? "steven-outline" : undefined} style={{ "--outline-w": outline } as CSSProperties} />
        );
        const position = { left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%`, width: `${sticker.w * 100}%` };
        if (!editing) {
          return (
            <span key={sticker.key} className={styles.sticker} style={position}>
              {picture}
            </span>
          );
        }
        const isSelected = editing.selected === sticker.key;
        return (
          <span key={sticker.key} className={styles.sticker} style={position}>
            <button
              type="button"
              className={`${styles.stickerButton} ${isSelected ? styles.stickerSelected : ""}`}
              aria-label={`${sticker.label} sticker. Arrow keys move it, plus and minus resize it, Delete removes it.`}
              aria-pressed={isSelected}
              onPointerDown={(event) => editing.onStickerPointerDown(event, sticker)}
              onFocus={() => editing.onStickerFocus(sticker)}
              onKeyDown={(event) => editing.onStickerKeyDown(event, sticker)}
            >
              {picture}
            </button>
          </span>
        );
      })}
    </>
  );
}

/**
 * All three photos of the strip, as they will be printed: the paper's colour, the three photos (with the stickers on
 * each), the name and date, and the frame's Stevens. While taking the photos the slots fill up one by one
 * (`current` is the one being taken). On a phone it is a row of three small framed photos instead of the tall paper.
 *
 * `images` has one picture (a data URL) per slot, or null while that photo isn't taken yet.
 */
export function StripPreview({
  images,
  stickers = [],
  background,
  frame,
  current = null,
  date = "",
  editing,
  activeSlot = 0,
  onPickSlot,
}: {
  images: (string | null)[];
  stickers?: Sticker[];
  background: BackgroundId;
  frame: FrameId;
  /** Zero-based slot being taken right now (highlighted), if any. */
  current?: number | null;
  /** Today's date as printed on the paper. Given by the page once it is in the browser (not read while building it). */
  date?: string;
  /** Step 2: lets stickers be dropped on a photo and dragged around it. */
  editing?: StripEditing;
  /** Phones' row of three: the photo being decorated (tap one to choose it). */
  activeSlot?: number;
  onPickSlot?: (slot: number) => void;
}) {
  const look = BACKGROUNDS[background];
  const height = paperHeight("strip");
  const { width, margin, slot } = PAPER;
  const slotsBottom = slotTop(2) + slot.height;
  /** Each photo's box, for measuring a sticker's size while it is resized. */
  const slotBoxes = useRef<(HTMLDivElement | null)[]>([]);
  const chosen = editing ? stickers.find((sticker) => sticker.key === editing.selected) : undefined;

  return (
    <>
      <div
        className={styles.strip}
        {...(editing ? {} : { role: "img", "aria-label": "Preview of your photo strip, all three photos" })}
        onPointerDown={editing ? editing.onDeselect : undefined}
        onPointerMove={editing ? editing.onPointerMove : undefined}
        onPointerUp={editing ? editing.onPointerUp : undefined}
        onPointerCancel={editing ? editing.onPointerUp : undefined}
      >
        <div className={styles.paper} style={{ aspectRatio: `${width} / ${height}`, background: look.fill }}>
          {look.burst && <Sunburst dark={look.burst.dark} light={look.burst.light} spin={false} fit />}

          {[0, 1, 2].map((index) => (
            <div
              key={index}
              ref={(element) => {
                slotBoxes.current[index] = element;
              }}
              data-edit-area=""
              className={`${styles.slot} ${current === index ? styles.current : ""}`}
              {...(editing
                ? {
                    onDragOver: (event: DragEvent<HTMLDivElement>) => {
                      if (!event.dataTransfer.types.includes(STICKER_DRAG_TYPE)) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                      event.currentTarget.dataset.over = "";
                    },
                    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
                      delete event.currentTarget.dataset.over;
                    },
                    onDrop: (event: DragEvent<HTMLDivElement>) => {
                      delete event.currentTarget.dataset.over;
                      const kind = event.dataTransfer.getData(STICKER_DRAG_TYPE);
                      if (!kind) return;
                      event.preventDefault();
                      const box = event.currentTarget.getBoundingClientRect();
                      editing.onDropSticker(kind, index, (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
                    },
                  }
                : {})}
              style={{
                left: pct(margin, width),
                top: pct(slotTop(index), height),
                width: pct(slot.width, width),
                height: pct(slot.height, height),
              }}
            >
              {images[index] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a data URL of the taken photo */}
                  <img src={images[index] ?? ""} alt="" draggable={false} className={styles.photo} />
                  <StickerLayer stickers={stickers.filter((sticker) => sticker.slot === index)} outline="1px" editing={editing} />
                </>
              ) : (
                <span className={styles.empty} aria-hidden="true">
                  {index + 1}
                </span>
              )}
            </div>
          ))}

          {/* The chosen sticker's ✕ and resize handle: on its top right and bottom right corners, but kept inside its
              photo so they can always be reached. Click ✕ to remove it, drag the arrows to make it bigger or smaller. */}
          {editing && chosen && (() => {
            const right = chosen.x + chosen.w / 2;
            const half = (chosen.w * 4) / 3 / 2; // stickers are square, the photo is 4:3
            const at = (fx: number, fy: number) => ({
              left: pct(margin + Math.min(1, Math.max(0, fx)) * slot.width, width),
              top: pct(slotTop(chosen.slot) + Math.min(1, Math.max(0, fy)) * slot.height, height),
            });
            return (
              <>
                <button
                  type="button"
                  className={`${styles.handle} ${styles.removeHandle}`}
                  style={at(right, chosen.y - half)}
                  aria-label={`Remove ${chosen.label}`}
                  title="Remove"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => editing.onRemove(chosen)}
                >
                  <span aria-hidden="true">×</span>
                </button>
                <span
                  className={`${styles.handle} ${styles.resizeHandle}`}
                  style={at(right, chosen.y + half)}
                  aria-hidden="true"
                  title="Drag to resize"
                  onPointerDown={(event) => editing.onResizePointerDown(event, chosen, slotBoxes.current[chosen.slot])}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 13 13 3M8.5 3H13v4.5M7.5 13H3V8.5" />
                  </svg>
                </span>
              </>
            );
          })()}

          {/* the footer: on a sunburst the name and date sit on a cream label, as printed */}
          {look.burst && (
            <span
              className={styles.label}
              style={{
                left: pct(margin - 4, width),
                top: pct(slotsBottom + 40, height),
                width: pct(470, width),
                height: pct(196, height),
              }}
            />
          )}
          <span className={styles.name} style={{ left: pct(margin + 20, width), top: pct(slotsBottom + 58, height) }}>
            Stiffn&apos;t
          </span>
          <span className={styles.date} style={{ left: pct(margin + 24, width), top: pct(slotsBottom + 172, height) }}>
            {date}
          </span>

          {framePlacements(frame, "strip").map((place, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- placed in % on the paper
            <img
              key={index}
              src={place.src}
              alt=""
              className={`${styles.steven} steven-outline`}
              style={
                {
                  left: pct(place.left, width),
                  top: pct(place.top, height),
                  width: pct(place.size, width),
                  transform: `rotate(${place.rotate}deg)${place.flip ? " scaleX(-1)" : ""}`,
                  "--outline-w": "1.5px",
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <div className={styles.row} role="img" aria-label="Preview of your photo strip, all three photos">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${styles.rowItem} ${current === index || (onPickSlot && activeSlot === index) ? styles.rowCurrent : ""}`}
          >
            <PreviewFrame background={background} frame="classic" mini>
              {images[index] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a data URL of the taken photo */}
                  <img src={images[index] ?? ""} alt="" draggable={false} className={styles.photo} />
                  <StickerLayer stickers={stickers.filter((sticker) => sticker.slot === index)} outline="1px" />
                </>
              ) : (
                <span className={styles.empty} aria-hidden="true">
                  {index + 1}
                </span>
              )}
            </PreviewFrame>
            {onPickSlot && (
              <button type="button" className={styles.rowPick} aria-pressed={activeSlot === index} onClick={() => onPickSlot(index)}>
                <span className="sr-only">Decorate photo {index + 1}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
