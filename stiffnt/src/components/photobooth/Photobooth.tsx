"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/Button";
import { SegmentedPill } from "@/components/SegmentedPill";
import { FocusRing } from "@/components/BrushStroke";
import { Panel } from "@/components/Panel";
import { site } from "@/config/site";
import {
  addStickers,
  canvasToBlob,
  photoFileName,
  renderPaper,
  renderSlot,
  slotCount,
  type BackgroundId,
  type FrameId,
  type Mode,
  type Sticker,
} from "@/lib/photobooth";
import { ColourPicker } from "./ColourPicker";
import { FramePicker } from "./FramePicker";
import { PreviewFrame } from "./PreviewFrame";
import { PhoneHandoff } from "./PhoneHandoff";
import { STICKER_DRAG_TYPE, StripPreview, type StripEditing } from "./StripPreview";
import { PhotoActions } from "./PhotoActions";
import styles from "./Photobooth.module.css";

/** The stickers: Steven in his poses and the accessories, the app's own pictures (all square). */
const STICKERS = [
  { kind: "steven", label: "Steven", src: "/images/steven/steven-front-facing.png", outline: true, w: 0.3 },
  { kind: "steven-sitting", label: "Steven, sitting", src: "/images/steven/steven-sitting.png", outline: true, w: 0.3 },
  { kind: "steven-picked-up", label: "Steven, picked up", src: "/images/steven/steven-picked-up.png", outline: true, w: 0.32 },
  { kind: "steven-stretching", label: "Steven, stretching", src: "/images/steven/steven-stretching.png", outline: true, w: 0.36 },
  { kind: "steven-sleepy", label: "Steven, asleep", src: "/images/steven/steven-loafing.png", outline: true, w: 0.34 },
  { kind: "steven-heart-eyes", label: "Steven with heart eyes", src: "/images/steven/steven-heart-eyes.png", outline: true, w: 0.32 },
  { kind: "steven-happy", label: "Steven, happy", src: "/images/steven/steven-happy.png", outline: true, w: 0.32 },
  { kind: "steven-crouching", label: "Steven, crouching", src: "/images/steven/steven-crouching.png", outline: true, w: 0.3 },
  { kind: "crown", label: "Crown", src: "/images/accessories/crown.png", outline: false, w: 0.22 },
  { kind: "glasses", label: "Glasses", src: "/images/accessories/glasses.png", outline: false, w: 0.3 },
  { kind: "bow", label: "Bow", src: "/images/accessories/bow.png", outline: false, w: 0.2 },
  { kind: "bow-blue", label: "Blue bow", src: "/images/accessories/bow-blue.png", outline: false, w: 0.2 },
  { kind: "wings", label: "Fairy wings", src: "/images/accessories/wings.png", outline: false, w: 0.4 },
  { kind: "wings-pink", label: "Pink fairy wings", src: "/images/accessories/wings-pink.png", outline: false, w: 0.4 },
];

const MODES: { value: Mode; title: string }[] = [
  { value: "single", title: "Single photo" },
  { value: "strip", title: "Photo strip" },
];

/** The pause between strip shots, so people can change pose. */
const POSE_PAUSE_MS = 1000;
const MAX_UPLOAD_BYTES = site.photobooth.maxUploadMB * 1024 * 1024;

type CameraState = "starting" | "on" | "denied" | "missing";
type Tab = "frames" | "colour" | "stickers";
type Result = { url: string; blob: Blob; uploadBlob: Blob; mode: Mode; fileName: string };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function Photobooth({ title, info }: { title: ReactNode; info: ReactNode }) {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const stream = useRef<MediaStream | null>(null);
  /** Each photo slot's box in the preview, for dragging stickers on it. */
  /** The photo in the preview, for dragging stickers on it. */
  const editArea = useRef<HTMLDivElement>(null);
  /** For sizing the preview to the space left on screen. */
  const setupRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(1);

  const [mode, setMode] = useState<Mode>("strip");
  const [camera, setCamera] = useState<CameraState>("starting");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  /** The photo of the strip shown big for decorating on a phone (a computer decorates on the strip itself). */
  const [activeSlot, setActiveSlot] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  /** The open options tab (kept while setting up, across Retake). */
  const [tab, setTab] = useState<Tab>("frames");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [frame, setFrame] = useState<FrameId>("classic");
  const [background, setBackground] = useState<BackgroundId>("cream");
  /** The camera shots (no stickers yet): once they're taken, the photo is decorated. Null while taking the photo. */
  const [shots, setShots] = useState<HTMLCanvasElement[] | null>(null);
  /** The photos taken so far in this strip, as pictures for the strip preview (step 1). */
  const [taken, setTaken] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const [isPhone, setIsPhone] = useState(false);
  /** Today's date for the strip preview, read once the page is in the browser. */
  const [today, setToday] = useState("");

  // The shooting sequence
  const [shooting, setShooting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotNumber, setShotNumber] = useState(0);
  const [shotsTotal, setShotsTotal] = useState(1);
  const [flash, setFlash] = useState(0);
  const run = useRef(0);
  const skip = useRef(false);

  /**
   * Three steps: 1 take the photo, 2 decorate it (frame, colour, stickers), 3 save it.
   * Stickers can only be changed in step 2.
   */
  const editing = shots !== null && result === null;
  const step: 1 | 2 | 3 = result ? 3 : shots ? 2 : 1;
  const locked = !editing;
  const shotUrl = useMemo(() => (shots ? (shots[activeSlot] ?? shots[0]).toDataURL("image/jpeg", 0.92) : null), [shots, activeSlot]);
  /** Every taken photo, for the strip preview: the ones taken so far (step 1) or all of them (step 2). */
  const shotUrls = useMemo(() => (shots ? shots.map((shot) => shot.toDataURL("image/jpeg", 0.8)) : null), [shots]);
  const stripOn = mode === "strip" && !result;
  /** Strip, step 2, on a computer: the three-photo strip is the one thing to decorate (no separate big photo). */
  const stripEdit = editing && stripOn;
  const stripImages: (string | null)[] = [0, 1, 2].map((index) => (shotUrls ?? taken)[index] ?? null);

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  /** Shows the stream in every slot's video (the strip preview has three). */
  const attachStream = useCallback(() => {
    for (const element of videos.current) {
      if (element && stream.current && element.srcObject !== stream.current) {
        element.srcObject = stream.current;
        element.play().catch(() => {});
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("missing");
      return;
    }
    setCamera("starting");
    try {
      stopCamera();
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setCamera("on");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCamera(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "missing");
    }
  }, [stopCamera]);

  useEffect(() => {
    // Start on the next tick so the state updates don't happen inside the effect body.
    const start = window.setTimeout(startCamera, 0);
    const phone = window.matchMedia("(hover: none) and (pointer: coarse) and (max-width: 900px)").matches;
    const frameId = requestAnimationFrame(() => {
      setIsPhone(phone);
      setToday(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }));
    });
    const sequence = run; // the sequence counter (not a DOM ref)
    const onHide = () => {
      sequence.current++;
      stopCamera();
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(frameId);
      window.removeEventListener("pagehide", onHide);
      sequence.current++;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // The page sizes the booth to the window under the header: keep --header-h up to date.
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Whenever the slots change (camera on, mode switch, back from the result), show the camera in them.
  useEffect(() => {
    if (camera === "on" && !shots) attachStream();
  }, [camera, mode, shots, attachStream]);

  // ── Stickers ──────────────────────────────────────────────────────────────
  /** Puts a sticker on one photo (the one being decorated, unless it was dropped on another), in the middle or where it was dropped. */
  const addSticker = (template: (typeof STICKERS)[number], slot = activeSlot, at = { x: 0.5, y: 0.5 }) => {
    if (locked) return;
    const key = nextKey.current++;
    setStickers((list) => [
      ...list,
      {
        key,
        slot,
        kind: template.kind,
        src: template.src,
        label: template.label,
        outline: template.outline,
        x: clamp(at.x, 0, 1),
        y: clamp(at.y, 0, 1),
        w: template.w,
      },
    ]);
    setSelected(key);
    setMessage(`${template.label} added${mode === "strip" ? ` to photo ${slot + 1}` : ""}. Drag it, or use the arrow keys.`);
  };

  /** A sticker dragged from the tray and dropped on a photo. */
  const dropSticker = (kind: string, slot: number, x: number, y: number) => {
    const template = STICKERS.find((item) => item.kind === kind);
    if (template) addSticker(template, slot, { x, y });
  };

  const update = (key: number, change: Partial<Sticker>) => {
    if (locked) return;
    setStickers((list) => list.map((sticker) => (sticker.key === key ? { ...sticker, ...change } : sticker)));
  };

  const remove = (key: number) => {
    if (locked) return;
    const sticker = stickers.find((item) => item.key === key);
    setStickers((list) => list.filter((item) => item.key !== key));
    setSelected(null);
    if (sticker) setMessage(`${sticker.label} removed.`);
  };

  const resize = (key: number, factor: number) => {
    const sticker = stickers.find((item) => item.key === key);
    if (sticker) update(key, { w: clamp(sticker.w * factor, 0.06, 1.2) });
  };

  /** Dragging a sticker (mouse, pen or finger). */
  const drag = useRef<{ key: number; mode: "move" | "resize"; startX: number; startY: number; x: number; y: number; w: number; box: DOMRect } | null>(null);

  const onPointerDown = (event: PointerEvent, sticker: Sticker, dragMode: "move" | "resize", photo?: HTMLElement | null) => {
    if (locked) return;
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setSelected(sticker.key);
    // The photo the sticker is being dragged on (the editing photo, or whichever of the strip's three it was grabbed on).
    const area = photo ?? (event.currentTarget as HTMLElement).closest<HTMLElement>("[data-edit-area]") ?? editArea.current;
    const box = area?.getBoundingClientRect();
    if (!box) return;
    drag.current = { key: sticker.key, mode: dragMode, startX: event.clientX, startY: event.clientY, x: sticker.x, y: sticker.y, w: sticker.w, box };
  };

  const onPointerMove = (event: PointerEvent) => {
    const current = drag.current;
    const box = current?.box;
    if (!current || !box || locked) return;
    const dx = (event.clientX - current.startX) / box.width;
    const dy = (event.clientY - current.startY) / box.height;
    if (current.mode === "move") {
      update(current.key, { x: clamp(current.x + dx, 0, 1), y: clamp(current.y + dy, 0, 1) });
    } else {
      update(current.key, { w: clamp(current.w + dx * 2, 0.06, 1.2) });
    }
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onStickerKey = (event: KeyboardEvent, sticker: Sticker) => {
    if (locked) return;
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      update(sticker.key, { x: clamp(sticker.x + dx, 0, 1), y: clamp(sticker.y + dy, 0, 1) });
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      resize(sticker.key, 1.1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      resize(sticker.key, 1 / 1.1);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      remove(sticker.key);
    }
  };

  // ── Taking the photo(s) ───────────────────────────────────────────────────
  /** Waits `ms`; false if the sequence was cancelled meanwhile. With `skippable`, "Skip countdown" ends it early. */
  const wait = (ms: number, id: number, skippable = false) =>
    new Promise<boolean>((resolve) => {
      const started = performance.now();
      const tick = () => {
        if (run.current !== id) return resolve(false);
        if ((skippable && skip.current) || performance.now() - started >= ms) return resolve(true);
        window.setTimeout(tick, 50);
      };
      tick();
    });

  const takePhotos = async () => {
    const id = ++run.current;
    const shotMode = mode;
    const total = slotCount(shotMode);
    setSelected(null);
    drag.current = null;
    setShooting(true);
    setShotsTotal(total);
    setMessage("Get ready!");
    setTaken([]);
    const slots: HTMLCanvasElement[] = [];
    try {
      for (let index = 0; index < total; index++) {
        setShotNumber(index + 1);
        skip.current = false;
        for (let count = 3; count >= 1; count--) {
          setCountdown(count);
          if (!(await wait(1000, id, true))) return;
          if (skip.current) break;
        }
        setCountdown(null);
        if (run.current !== id) return;

        const element = videos.current[0];
        if (!element || !element.videoWidth) throw new Error("no camera frame");
        const slotCanvas = await renderSlot({ source: element, sourceWidth: element.videoWidth, sourceHeight: element.videoHeight, stickers: [] });
        slots.push(slotCanvas);
        setTaken((list) => [...list, slotCanvas.toDataURL("image/jpeg", 0.8)]);
        setFlash((value) => value + 1);
        setMessage(total > 1 ? `Photo ${index + 1} of ${total} taken.` : "Photo taken.");

        if (index < total - 1 && !(await wait(POSE_PAUSE_MS, id))) return;
      }

      if (run.current !== id) return;
      // Step 1 is done: the camera can go off, and the photo is ready to decorate.
      stopCamera();
      setShots(slots);
      setSelected(null);
      setMessage(shotMode === "strip" ? "Photos taken. Now pick a frame and add stickers." : "Photo taken. Now pick a frame and add stickers.");
    } catch {
      if (run.current === id) setMessage("Something went wrong taking the photo. Please try again.");
    } finally {
      if (run.current === id) {
        setShooting(false);
        setCountdown(null);
        setShotNumber(0);
      }
    }
  };

  /** Step 2 → 3: puts the stickers on every shot and makes the finished paper. */
  const finish = async () => {
    if (!shots || finishing) return;
    const id = ++run.current;
    const shotMode: Mode = shots.length > 1 ? "strip" : "single";
    setFinishing(true);
    setSelected(null);
    drag.current = null;
    try {
      const slots = await Promise.all(shots.map((shot, index) => addStickers(shot, stickers.filter((sticker) => sticker.slot === index))));
      const css = getComputedStyle(document.body);
      const displayFont = css.getPropertyValue("--family-display").trim() || "sans-serif";
      const textFont = css.getPropertyValue("--family-text").trim() || "sans-serif";
      await document.fonts.load(`110px ${displayFont}`).catch(() => {});
      const now = new Date();
      const canvas = await renderPaper({ mode: shotMode, slots, background, frame, date: now, displayFont, textFont });
      const blob = await canvasToBlob(canvas, "image/png");
      // The QR upload takes at most maxUploadMB: a bigger PNG goes up as a JPEG (quality 0.9) instead.
      const uploadBlob = blob.size > MAX_UPLOAD_BYTES ? await canvasToBlob(canvas, "image/jpeg", 0.9) : blob;
      if (run.current !== id) return;
      setResult({ url: URL.createObjectURL(blob), blob, uploadBlob, mode: shotMode, fileName: photoFileName(shotMode, now) });
      setMessage(shotMode === "strip" ? "Your photo strip is ready." : "Your photo is ready.");
    } catch {
      if (run.current === id) setMessage("Something went wrong making your photo. Please try again.");
    } finally {
      if (run.current === id) setFinishing(false);
    }
  };

  const cancel = () => {
    run.current++;
    setShooting(false);
    setCountdown(null);
    setShotNumber(0);
    setMessage("Cancelled.");
  };

  /** Back to step 1: throws the photo away and turns the camera on again. */
  const retake = () => {
    run.current++;
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setShots(null);
    setTaken([]);
    setActiveSlot(0);
    setFinishing(false);
    setMessage("Ready for a new photo.");
    startCamera();
  };

  /** Back from step 3 to step 2, keeping the photo and what's on it. */
  const backToEdit = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setMessage("Back to decorating.");
  };

  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  /** Strip, step 2: the stickers can be dragged on the strip itself. */
  const stripEditing: StripEditing | undefined = editing
    ? {
        selected,
        onRemove: (sticker) => remove(sticker.key),
        onResizePointerDown: (event, sticker, photo) => onPointerDown(event, sticker, "resize", photo),
        onDropSticker: dropSticker,
        onStickerPointerDown: (event, sticker) => onPointerDown(event, sticker, "move"),
        onStickerKeyDown: onStickerKey,
        onStickerFocus: (sticker) => setSelected(sticker.key),
        onDeselect: () => setSelected(null),
        onPointerMove,
        onPointerUp,
      }
    : undefined;


  /**
   * The preview is sized by the space left on screen: the height between its top and the button row (and, on phones,
   * the options panel) at the bottom of the window, at 4:3, capped by the width it may use. Set straight on the
   * element (no re-render) and redone when the window, the mode or the panel changes.
   */
  useLayoutEffect(() => {
    if (result) return;
    const setup = setupRef.current;
    const preview = previewRef.current;
    if (!setup || !preview) return;
    const fit = () => {
      const desktop = window.matchMedia("(min-width: 900px)").matches;
      const gap = 12;
      const bottomPad = 12;
      const top = (preview.parentElement ?? preview).getBoundingClientRect().top + window.scrollY;
      const action = desktop && panelRef.current ? 0 : (actionRef.current?.offsetHeight ?? 0); // step 2 on desktop: the buttons sit under the options
      // Phones: the options panel at its smallest (tabs + one 132 px row); any height left over goes to it, not to empty space.
      const tabs = panelRef.current?.querySelector("[role=tablist]") as HTMLElement | null;
      const panel = !desktop && panelRef.current ? (tabs?.offsetHeight ?? 44) + 132 + 3 + gap : 0;
      const availableHeight = window.innerHeight - top - gap - action - panel - bottomPad;
      let availableWidth = desktop && panelRef.current ? setup.clientWidth - 320 - 24 : setup.clientWidth;
      // The strip preview: beside the camera on desktop (as tall as it, 0.318 of its width), a row of three on phones.
      let stripRow = 0;
      if (stripOn) {
        if (desktop) availableWidth = (availableWidth - 20) / (1 + 0.318);
        else stripRow = Math.round(((setup.clientWidth - 16) / 3) * 0.75) + 4 + gap;
      }
      const width = Math.max(200, Math.floor(Math.min(((availableHeight - stripRow) * 4) / 3, availableWidth)));
      // Decorating a strip on a computer: the strip alone, as tall as the space allows.
      setup.style.setProperty("--strip-h", desktop && stripEdit ? `${Math.max(200, Math.floor(availableHeight))}px` : "");
      setup.style.setProperty("--pw", `${width}px`);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(setup);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [result, shots, mode, shooting, camera, stripOn, stripEdit]);

  // The footer is hidden on every step so the booth (and the finished photo) fits the window (globals.css).
  useEffect(() => {
    document.body.dataset.photobooth = "setup";
    return () => {
      delete document.body.dataset.photobooth;
    };
  }, []);

  /** The stickers on the photo shown big for decorating. */
  const visibleStickers = stickers.filter((sticker) => sticker.slot === activeSlot);

  /** The preview's photo: the camera, its stickers, the countdown. */
  const photoContent = (
    <div
      ref={editArea}
      className={styles.slotInner}
      data-edit-area=""
      onDragOver={
        !locked
          ? (event) => {
              if (!event.dataTransfer.types.includes(STICKER_DRAG_TYPE)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }
          : undefined
      }
      onDrop={
        !locked
          ? (event) => {
              const kind = event.dataTransfer.getData(STICKER_DRAG_TYPE);
              if (!kind) return;
              event.preventDefault();
              const box = event.currentTarget.getBoundingClientRect();
              dropSticker(kind, activeSlot, (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
            }
          : undefined
      }
      onPointerDown={!locked ? () => setSelected(null) : undefined}
      onPointerMove={!locked ? onPointerMove : undefined}
      onPointerUp={!locked ? onPointerUp : undefined}
      onPointerCancel={!locked ? onPointerUp : undefined}
    >
      {shotUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shotUrl} alt={shots && shots.length > 1 ? "Your first photo" : "Your photo"} draggable={false} className={styles.shotImage} />
      ) : (
        <video
          ref={(element) => {
            videos.current[0] = element;
            // A new video element (back from the result, or a re-render): show the camera in it straight away.
            if (element && stream.current && element.srcObject !== stream.current) {
              element.srcObject = stream.current;
              element.play().catch(() => {});
            }
          }}
          className={styles.video}
          muted
          playsInline
          aria-label="Your camera"
        />
      )}

      {/* Stickers only exist in step 2, on the taken photo (the ones you picked are kept if you retake). */}
      {shots &&
        visibleStickers.map((sticker) => {
        const isSelected = !locked && sticker.key === selected;
        const position = { left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%`, width: `${sticker.w * 100}%` };
        const picture = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sticker.src}
            alt=""
            draggable={false}
            className={sticker.outline ? "steven-outline" : undefined}
            style={sticker.outline ? { ["--outline-w" as string]: "3px" } : undefined}
          />
        );
        // Locked: just the picture, nothing to grab or focus.
        if (locked) {
          return (
            <div key={sticker.key} className={`${styles.sticker} ${styles.stickerLocked}`} style={position} aria-hidden="true">
              {picture}
            </div>
          );
        }
        return (
          <div key={sticker.key} className={`${styles.sticker} ${isSelected ? styles.stickerSelected : ""}`} style={position}>
            <button
              type="button"
              className={styles.stickerBody}
              aria-label={`${sticker.label} sticker. Arrow keys move it, plus and minus resize it, Delete removes it.`}
              aria-pressed={isSelected}
              onPointerDown={(event) => onPointerDown(event, sticker, "move")}
              onFocus={() => setSelected(sticker.key)}
              onKeyDown={(event) => onStickerKey(event, sticker)}
            >
              <FocusRing cornerRadius={8} />
              {picture}
            </button>
          </div>
        );
        })}

      {/* Every sticker's ✕ (top right) and the chosen one's resize handle (bottom right), above all the stickers.
          They follow the sticker's corners but stay inside the photo, so they can still be used when the sticker
          is bigger than the photo or pushed past its edge. (Stickers are square: height = width × 4/3 of the slot.) */}
      {!locked &&
        visibleStickers.map((sticker) => {
          const right = sticker.x + sticker.w / 2;
          const half = (sticker.w * 4) / 3 / 2;
          const at = (x: number, y: number) => ({
            left: `clamp(16px, ${x * 100}%, calc(100% - 16px))`,
            top: `clamp(16px, ${y * 100}%, calc(100% - 16px))`,
          });
          return (
            <Fragment key={sticker.key}>
              <button
                type="button"
                className={styles.removeDot}
                style={at(right, sticker.y - half)}
                aria-label={`Remove ${sticker.label}`}
                title="Remove"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => remove(sticker.key)}
              >
                <FocusRing />
                <span aria-hidden="true">×</span>
              </button>
              {sticker.key === selected && (
                <span
                  className={styles.resizeDot}
                  style={at(right, sticker.y + half)}
                  aria-hidden="true"
                  title="Drag to resize"
                  onPointerDown={(event) => onPointerDown(event, sticker, "resize")}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 13 13 3M8.5 3H13v4.5M7.5 13H3V8.5" />
                  </svg>
                </span>
              )}
            </Fragment>
          );
        })}

      {shooting && countdown !== null && (
        <div className={styles.countdown} aria-hidden="true">
          <span key={`${shotNumber}-${countdown}`} className={styles.countPop}>
            {countdown}
          </span>
        </div>
      )}
      {flash > 0 && <span key={flash} className={styles.flash} aria-hidden="true" />}
    </div>
  );

  /** Strip: three small boxes. Setting up: "3 photos". Shooting: the progress, 1 → 2 → 3. */
  const stripIndicator =
    mode === "strip" && !shots ? (
      <div className={styles.indicator}>
        <span className={styles.indicatorBoxes} aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={`${styles.indicatorBox} ${shooting && shotNumber - 1 === index ? styles.indicatorCurrent : ""} ${shooting && index < shotNumber - 1 ? styles.indicatorDone : ""}`}
            />
          ))}
        </span>
        <span className={styles.indicatorText} aria-live="polite">
          {shooting ? `${Math.max(1, shotNumber)} / 3` : "3 photos"}
        </span>
      </div>
    ) : null;

  const actionRow = (
    <div ref={actionRef} className={styles.actionRow}>
      {stripIndicator}
      {shooting ? (
        <>
          <p className={styles.countText} aria-live="assertive">
            {countdown !== null ? `Photo in ${countdown}…` : shotsTotal > 1 ? "Change your pose!" : ""}
          </p>
          {countdown !== null && (
            <Button kind="secondary" small onClick={() => (skip.current = true)}>
              Skip countdown
            </Button>
          )}
          <Button kind="neutral" small onClick={cancel}>
            Cancel
          </Button>
        </>
      ) : editing ? (
        <>
          <Button kind="tertiary" onClick={retake} disabled={finishing}>
            Retake
          </Button>
          <Button kind="primary" onClick={finish} disabled={finishing} className={styles.takeButton}>
            {finishing ? "Making your photo…" : "Done"}
          </Button>
        </>
      ) : (
        <Button kind="primary" onClick={takePhotos} disabled={camera !== "on"} className={styles.takeButton}>
          <span aria-hidden="true">📸</span> {mode === "strip" ? "Take photos" : "Take photo"}
        </Button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className={styles.resultPage} data-stage="result">
        <div className={styles.titleRow}>
          {title}
          {info}
        </div>
        <Steps current={step} />
        <div className={styles.result}>
          <p className="sr-only" aria-live="polite">
            {message}
          </p>
          <div className={styles.resultSide}>
            <div className={styles.resultBar}>
              {isPhone ? (
                <PhotoActions src={result.url} downloadHref={result.url} fileName={result.fileName} />
              ) : (
                <>
                  <ButtonLink kind="primary" href={result.url} download={result.fileName}>
                    Download PNG
                  </ButtonLink>
                </>
              )}
              <Button kind="secondary" onClick={backToEdit}>
                Edit
              </Button>
              <Button kind="tertiary" onClick={retake}>
                Retake
              </Button>
            </div>
            {/* The QR code shows by itself, so people can scan it straight away (phones get Save / Share instead). */}
            {!isPhone && <PhoneHandoff key={result.url} blob={result.uploadBlob} kind={result.mode === "strip" ? "strip" : "photo"} />}
          </div>
          {/* The same box for a photo and a strip: same width, centred. */}
          <div className={styles.resultBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={result.mode === "strip" ? "Your photo strip with Steven" : "Your photo with Steven"}
              className={styles.resultImage}
            />
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; title: string }[] = [
    { id: "frames", title: "Frames" },
    { id: "colour", title: "Colour" },
    { id: "stickers", title: "Stickers" },
  ];

  return (
    <div ref={setupRef} className={`${styles.setup} ${editing ? "" : styles.setupShoot} ${stripEdit ? styles.setupStrip : ""}`} data-stage="setup">
      <p className="sr-only" aria-live="polite">
        {message}
      </p>

      {/* One compact row: title, mode switch, How it works & privacy */}
      <div className={styles.titleRow}>
        {title}
        {shots ? (
          <span />
        ) : (
          <SegmentedPill label="Photo type" options={MODES} value={mode} onChange={setMode} disabled={shooting} compact />
        )}
        {info}
      </div>
      <Steps current={step} />

      {/* Left: the live preview (one 4:3 photo), then the strip indicator and Take photo */}
      <div className={styles.left}>
        <div className={styles.stage}>
        <div ref={previewRef} className={`${styles.previewBox} ${stripEdit ? styles.previewBoxHidden : ""}`}>
          {camera === "denied" || camera === "missing" ? (
            <CameraHelp state={camera} onRetry={startCamera} />
          ) : (
            <>
              <PreviewFrame background={background} frame={frame}>
                {photoContent}
              </PreviewFrame>
              {camera === "starting" && <p className={styles.starting}>Asking for your camera…</p>}
            </>
          )}
        </div>
        {/* Strip: all three photos, filling up as they are taken, then with the frame, colour and stickers on them */}
        {stripOn && (
          <StripPreview
            images={stripImages}
            stickers={shots ? stickers : []}
            background={background}
            frame={frame}
            current={shooting && shotNumber > 0 ? shotNumber - 1 : null}
            date={today}
            editing={stripEditing}
            activeSlot={activeSlot}
            onPickSlot={editing ? setActiveSlot : undefined}
          />
        )}
        </div>
        {!editing && actionRow}
      </div>

      {/* Right (phones: under the preview): Frames / Colour / Stickers. Only in step 2, after the photo is taken. */}
      {editing && (
        <div className={styles.right}>
        <div ref={panelRef} className={styles.panel}>
          <div role="tablist" aria-label="Photo options" className={styles.tabs}>
            {tabs.map((item, index) => (
              <button
                key={item.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`panel-${item.id}`}
                tabIndex={tab === item.id ? 0 : -1}
                className={`${styles.tab} ${tab === item.id ? styles.tabChosen : ""}`}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => {
                  const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
                  const jump = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
                  if (!move && jump === null) return;
                  event.preventDefault();
                  const next = jump ?? (index + (move ?? 0) + tabs.length) % tabs.length;
                  setTab(tabs[next].id);
                  tabRefs.current[next]?.focus();
                }}
              >
                <FocusRing />
                <span>{item.title}</span>
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className={styles.tabPanel}>
            {tab === "frames" && <FramePicker value={frame} onChange={setFrame} />}
            {tab === "colour" && <ColourPicker value={background} onChange={setBackground} />}
            {tab === "stickers" && (
              <div className={styles.stickersTab}>
                <p className={styles.dragHint}>
                  {mode === "strip" ? "Drag a sticker onto the photo you want it on. Click it to move, resize or remove it." : "Drag a sticker onto your photo, or tap it."}
                </p>
                <ul className={styles.tray} aria-label="Stickers">
                  {STICKERS.map((template) => (
                    <li key={template.kind}>
                      <button
                        type="button"
                        className={styles.trayItem}
                        onClick={() => addSticker(template)}
                        disabled={locked}
                        draggable={!locked}
                        onDragStart={(event) => {
                          event.dataTransfer.setData(STICKER_DRAG_TYPE, template.kind);
                          event.dataTransfer.effectAllowed = "copy";
                        }}
                      >
                        <FocusRing cornerRadius={13} />
                        <Image
                          src={template.src}
                          alt=""
                          width={64}
                          height={64}
                          className={template.outline ? "steven-outline" : undefined}
                          style={template.outline ? { ["--outline-w" as string]: "1.5px" } : undefined}
                        />
                        <span className="sr-only">Add {template.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {actionRow}
        </div>
      )}
    </div>
  );
}

/** The three steps, as a row of pills: take the photo, decorate it, save it. */
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const items = ["Take photo", "Decorate", "Save"];
  return (
    <ol className={styles.steps} aria-label="Steps">
      {items.map((label, index) => {
        const number = index + 1;
        return (
          <li
            key={label}
            className={`${styles.step} ${number === current ? styles.stepCurrent : ""} ${number < current ? styles.stepDone : ""}`}
            aria-current={number === current ? "step" : undefined}
          >
            <span className={styles.stepNumber} aria-hidden="true">
              {number < current ? "✓" : number}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

/** Camera blocked or missing: a friendly panel in the app's popup style with how to allow it, and Try again. */
function CameraHelp({ state, onRetry }: { state: "denied" | "missing"; onRetry: () => void }) {
  return (
    <Panel radius={24} outline={2} shade={5} className={styles.help}>
      <div className={styles.helpArt}>
        <Image src="/images/steven/steven-picked-up.png" alt="" width={140} height={140} className="steven-outline" />
      </div>
      <div className={styles.helpWords}>
        {/* DRAFT COPY */}
        <h2 className={styles.helpTitle}>{state === "denied" ? "Steven can't see you!" : "No camera found"}</h2>
        {/* DRAFT COPY */}
        <p className={styles.helpText}>
          {state === "denied"
            ? "Please allow camera access for this site, then press Try again."
            : "Connect or turn on a camera, close other apps that are using it, then press Try again."}
        </p>
        {state === "denied" && (
          // DRAFT COPY
          <ul className={styles.helpSteps}>
            <li>
              <strong>Safari (Mac):</strong> Safari menu → Settings for This Website → Camera → Allow.
            </li>
            <li>
              <strong>Chrome:</strong> click the camera or settings icon in the address bar → Camera → Allow, then reload.
            </li>
            <li>
              <strong>iPhone / iPad:</strong> Settings → Safari (or Chrome) → Camera → Allow.
            </li>
            <li>
              <strong>Android:</strong> Chrome → ⋮ → Settings → Site settings → Camera → allow this site.
            </li>
          </ul>
        )}
        <Button kind="primary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Panel>
  );
}
