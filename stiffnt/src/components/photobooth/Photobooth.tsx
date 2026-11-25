"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Button, ButtonLink } from "@/components/Button";
import { SegmentedPill } from "@/components/SegmentedPill";
import { Sunburst } from "@/components/Sunburst";
import { FocusRing } from "@/components/BrushStroke";
import {
  renderPhoto,
  renderShot,
  renderStrip,
  STRIP_COLORS,
  type FrameId,
  type Sticker,
  type StripColor,
} from "@/lib/photobooth";
import { PhoneHandoff } from "./PhoneHandoff";
import { PhotoActions } from "./PhotoActions";
import styles from "./Photobooth.module.css";

/** The stickers: Steven and the accessories, the app's own pictures. */
const STICKERS = [
  { kind: "steven", label: "Steven", src: "/images/steven/steven-front-facing.png", outline: true, w: 0.3 },
  { kind: "steven-picked-up", label: "Steven, picked up", src: "/images/steven/steven-picked-up.png", outline: true, w: 0.32 },
  { kind: "crown", label: "Crown", src: "/images/accessories/crown.png", outline: false, w: 0.22 },
  { kind: "glasses", label: "Glasses", src: "/images/accessories/glasses.png", outline: false, w: 0.3 },
  { kind: "bow", label: "Bow", src: "/images/accessories/bow.png", outline: false, w: 0.2 },
  { kind: "bow-blue", label: "Blue bow", src: "/images/accessories/bow-blue.png", outline: false, w: 0.2 },
  { kind: "wings", label: "Fairy wings", src: "/images/accessories/wings.png", outline: false, w: 0.4 },
  { kind: "wings-pink", label: "Pink fairy wings", src: "/images/accessories/wings-pink.png", outline: false, w: 0.4 },
];

type Mode = "single" | "strip";

const MODES: { value: Mode; title: string }[] = [
  { value: "single", title: "Single photo" },
  { value: "strip", title: "Photo strip" },
];

const FRAMES: { value: FrameId; title: string }[] = [
  { value: "none", title: "No frame" },
  { value: "outline", title: "Sticker" },
  { value: "sunburst", title: "Sunburst" },
];

const STRIP_OPTIONS = (Object.keys(STRIP_COLORS) as StripColor[]).map((value) => ({
  value,
  title: STRIP_COLORS[value].title,
}));

/** How many shots a strip takes, and the pause between them so people can change pose. */
const STRIP_SHOTS = 3;
const POSE_PAUSE_MS = 1000;

type Upload = { url: string; image: HTMLImageElement };
type Source = { kind: "camera" } | { kind: "upload"; photos: Upload[] };
type CameraState = "starting" | "on" | "denied" | "missing";
type Result = { url: string; blob: Blob; mode: Mode };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const loadUpload = (file: File) =>
  new Promise<Upload>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => resolve({ url, image });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not an image"));
    };
    image.src = url;
  });

export function Photobooth() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const photo = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextKey = useRef(1);

  const [mode, setMode] = useState<Mode>("strip");
  const [camera, setCamera] = useState<CameraState>("starting");
  const [source, setSource] = useState<Source>({ kind: "camera" });
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [frame, setFrame] = useState<FrameId>("sunburst");
  const [stripColor, setStripColor] = useState<StripColor>("cream");
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const [isPhone, setIsPhone] = useState(false);
  const [handoff, setHandoff] = useState(false);

  // The shooting sequence
  const [shooting, setShooting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotNumber, setShotNumber] = useState(0);
  const [shotsTotal, setShotsTotal] = useState(1);
  const [flash, setFlash] = useState(0);
  const run = useRef(0);
  const skip = useRef(false);

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("missing");
      return;
    }
    setCamera("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      stream.current = media;
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play().catch(() => {});
      }
      setCamera("on");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCamera(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "missing");
    }
  }, []);

  useEffect(() => {
    // Start on the next tick so the state updates don't happen inside the effect body.
    const start = window.setTimeout(startCamera, 0);
    // Phones (small touch screens) get Download + Share instead of the QR code.
    const phone = window.matchMedia("(hover: none) and (pointer: coarse) and (max-width: 900px)").matches;
    const frameId = requestAnimationFrame(() => setIsPhone(phone));
    // Leaving the page (or the tab going away): the camera goes off, and a running sequence stops.
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

  // ── Upload instead (up to 3 for a strip) ──────────────────────────────────
  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const wanted = mode === "strip" ? STRIP_SHOTS : 1;
    const chosen = Array.from(files).slice(0, wanted);
    const loaded = (await Promise.all(chosen.map((file) => loadUpload(file).catch(() => null)))).filter(
      (item): item is Upload => item !== null,
    );
    if (!loaded.length) {
      setMessage("That file isn't a picture we can open. Try a JPG or PNG.");
      return;
    }
    if (source.kind === "upload") source.photos.forEach((item) => URL.revokeObjectURL(item.url));
    stopCamera();
    setSource({ kind: "upload", photos: loaded });
    if (mode === "strip") {
      // DRAFT COPY
      const extra = files.length > STRIP_SHOTS ? ` Only the first ${STRIP_SHOTS} are used.` : "";
      setMessage(
        loaded.length === STRIP_SHOTS
          ? `${STRIP_SHOTS} photos added.${extra}`
          : `${loaded.length} photo${loaded.length > 1 ? "s" : ""} added. They repeat to fill the ${STRIP_SHOTS} spots.${extra}`,
      );
    } else {
      setMessage("Photo added.");
    }
  };

  const backToCamera = () => {
    if (source.kind === "upload") source.photos.forEach((item) => URL.revokeObjectURL(item.url));
    setSource({ kind: "camera" });
    startCamera();
  };

  // ── Stickers ──────────────────────────────────────────────────────────────
  const addSticker = (template: (typeof STICKERS)[number]) => {
    const key = nextKey.current++;
    const offset = ((key % 5) - 2) * 0.04;
    setStickers((list) => [
      ...list,
      { key, kind: template.kind, src: template.src, label: template.label, outline: template.outline, x: 0.5 + offset, y: 0.45 + offset, w: template.w },
    ]);
    setSelected(key);
    setMessage(`${template.label} added. Drag it, or use the arrow keys.`);
  };

  const update = (key: number, change: Partial<Sticker>) =>
    setStickers((list) => list.map((sticker) => (sticker.key === key ? { ...sticker, ...change } : sticker)));

  const remove = (key: number) => {
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
  const drag = useRef<{ key: number; mode: "move" | "resize"; startX: number; startY: number; x: number; y: number; w: number } | null>(null);

  const onPointerDown = (event: PointerEvent, sticker: Sticker, dragMode: "move" | "resize") => {
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setSelected(sticker.key);
    drag.current = { key: sticker.key, mode: dragMode, startX: event.clientX, startY: event.clientY, x: sticker.x, y: sticker.y, w: sticker.w };
  };

  const onPointerMove = (event: PointerEvent) => {
    const current = drag.current;
    const box = photo.current?.getBoundingClientRect();
    if (!current || !box) return;
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

  /** The picture for shot `index`: the camera's current frame, or an uploaded photo (repeating if fewer than 3). */
  const currentSource = (index: number) => {
    if (source.kind === "camera") {
      const element = video.current;
      if (!element || !element.videoWidth) throw new Error("no frame");
      return { source: element, sourceWidth: element.videoWidth, sourceHeight: element.videoHeight, mirror: true };
    }
    const upload = source.photos[index % source.photos.length];
    return { source: upload.image, sourceWidth: upload.image.naturalWidth, sourceHeight: upload.image.naturalHeight, mirror: false };
  };

  const takePhotos = async () => {
    const id = ++run.current;
    const total = mode === "strip" ? STRIP_SHOTS : 1;
    setSelected(null);
    setShooting(true);
    setShotsTotal(total);
    const shots: HTMLCanvasElement[] = [];
    let singleBlob: Blob | null = null;
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

        const picture = currentSource(index);
        if (mode === "strip") shots.push(await renderShot({ ...picture, stickers }));
        else singleBlob = await renderPhoto({ ...picture, stickers, frame });
        setFlash((value) => value + 1);
        setMessage(mode === "strip" ? `Photo ${index + 1} of ${total} taken.` : "Photo taken.");

        if (index < total - 1 && !(await wait(POSE_PAUSE_MS, id))) return;
      }

      let blob = singleBlob;
      if (mode === "strip") {
        const css = getComputedStyle(document.body);
        const displayFont = css.getPropertyValue("--family-display").trim() || "sans-serif";
        const textFont = css.getPropertyValue("--family-text").trim() || "sans-serif";
        await document.fonts.load(`92px ${displayFont}`).catch(() => {});
        blob = await renderStrip({ shots, color: stripColor, date: new Date(), displayFont, textFont });
      }
      if (run.current !== id || !blob) return;
      setResult({ url: URL.createObjectURL(blob), blob, mode });
      setMessage(mode === "strip" ? "Your photo strip is ready." : "Your photo is ready.");
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

  const cancel = () => {
    run.current++;
    setShooting(false);
    setCountdown(null);
    setShotNumber(0);
    setMessage("Cancelled.");
  };

  const retake = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setHandoff(false);
    setMessage("");
    if (source.kind === "camera" && !stream.current) startCamera();
  };

  // A new stream needs re-attaching when the video element comes back after the result.
  useEffect(() => {
    if (!result && video.current && stream.current && video.current.srcObject !== stream.current) {
      video.current.srcObject = stream.current;
      video.current.play().catch(() => {});
    }
  }, [result]);

  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  const hasPicture = source.kind === "upload" || camera === "on";
  const selectedSticker = stickers.find((sticker) => sticker.key === selected) ?? null;
  const fileName = result?.mode === "strip" ? "stiffnt-photo-strip.png" : "stiffnt-photobooth.png";
  const frameClass = mode === "strip" ? `${styles.frame} ${styles.frameStrip}` : `${styles.frame} ${styles[`frame-${frame}`]}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.booth}>
      <p className="sr-only" aria-live="polite">
        {message}
      </p>

      {result ? (
        <div className={styles.result}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.url}
            alt={result.mode === "strip" ? "Your photo strip with Steven" : "Your photo with Steven"}
            className={result.mode === "strip" ? styles.resultStrip : styles.resultImage}
          />
          <div className={styles.resultSide}>
            <div className={styles.actions}>
              {isPhone ? (
                <PhotoActions src={result.url} downloadHref={result.url} fileName={fileName} />
              ) : (
                <>
                  <ButtonLink kind="primary" href={result.url} download={fileName}>
                    Download PNG
                  </ButtonLink>
                  <Button kind="secondary" onClick={() => setHandoff(true)} disabled={handoff}>
                    Get it on my phone
                  </Button>
                </>
              )}
              <Button kind="tertiary" onClick={retake}>
                Retake
              </Button>
            </div>
            {handoff && !isPhone && <PhoneHandoff blob={result.blob} onClose={() => setHandoff(false)} />}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.stage}>
            <SegmentedPill label="Photo type" options={MODES} value={mode} onChange={setMode} disabled={shooting} />

            <div className={frameClass} style={mode === "strip" ? { ["--strip-fill" as string]: `var(--strip-${stripColor})` } : undefined}>
              {mode === "single" && frame === "sunburst" && <Sunburst />}
              <div
                ref={photo}
                className={`${styles.photo} ${mode === "strip" ? styles.photoStrip : ""}`}
                onPointerDown={() => setSelected(null)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {source.kind === "camera" ? (
                  <video ref={video} className={styles.video} muted playsInline aria-label="Your camera" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={source.photos[0].url} alt="Your uploaded photo" className={styles.uploaded} />
                )}

                {source.kind === "camera" && camera !== "on" && (
                  <div className={styles.notice}>
                    {camera === "starting" ? (
                      <p>Asking for your camera…</p>
                    ) : (
                      <>
                        <Image src="/images/steven/steven-picked-up.png" alt="" width={120} height={120} className="steven-outline" />
                        {/* DRAFT COPY */}
                        <p className={styles.noticeTitle}>
                          {camera === "denied" ? "Steven can't see you!" : "No camera found"}
                        </p>
                        {/* DRAFT COPY */}
                        <p>
                          {camera === "denied"
                            ? "Camera access is off for this site. Allow it in your browser's settings, or upload photos instead."
                            : "We couldn't find a camera. You can upload photos instead."}
                        </p>
                        <div className={styles.actions}>
                          <Button kind="primary" onClick={() => fileInput.current?.click()}>
                            {mode === "strip" ? "Upload up to 3 photos" : "Upload a photo"}
                          </Button>
                          {camera === "denied" && (
                            <Button kind="secondary" onClick={startCamera}>
                              Try again
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {stickers.map((sticker) => {
                  const isSelected = sticker.key === selected;
                  return (
                    <div
                      key={sticker.key}
                      className={`${styles.sticker} ${isSelected ? styles.stickerSelected : ""}`}
                      style={{ left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%`, width: `${sticker.w * 100}%` }}
                    >
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sticker.src}
                          alt=""
                          draggable={false}
                          className={sticker.outline ? "steven-outline" : undefined}
                          style={sticker.outline ? { ["--outline-w" as string]: "3px" } : undefined}
                        />
                      </button>
                      {isSelected && (
                        <>
                          <button
                            type="button"
                            className={styles.removeDot}
                            aria-label={`Remove ${sticker.label}`}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => remove(sticker.key)}
                          >
                            <FocusRing />
                            <span aria-hidden="true">×</span>
                          </button>
                          <span
                            className={styles.resizeDot}
                            aria-hidden="true"
                            onPointerDown={(event) => onPointerDown(event, sticker, "resize")}
                          />
                        </>
                      )}
                    </div>
                  );
                })}

                {shooting && shotsTotal > 1 && (
                  <span className={styles.progress} aria-hidden="true">
                    {shotNumber} / {shotsTotal}
                  </span>
                )}

                {countdown !== null && (
                  <div className={styles.countdown} aria-hidden="true">
                    <span key={`${shotNumber}-${countdown}`} className={styles.countPop}>
                      {countdown}
                    </span>
                  </div>
                )}

                {flash > 0 && <span key={flash} className={styles.flash} aria-hidden="true" />}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.actions}>
              {shooting ? (
                <>
                  <p className={styles.countText} aria-live="assertive">
                    {shotsTotal > 1 ? `${shotNumber} / ${shotsTotal}` : ""}
                    {countdown !== null ? `${shotsTotal > 1 ? " · " : ""}Photo in ${countdown}…` : shotsTotal > 1 ? " · Change your pose!" : ""}
                  </p>
                  {countdown !== null && (
                    <Button kind="secondary" onClick={() => (skip.current = true)}>
                      Skip countdown
                    </Button>
                  )}
                  <Button kind="neutral" onClick={cancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button kind="primary" onClick={takePhotos} disabled={!hasPicture}>
                    {mode === "strip" ? "Take photos" : "Take photo"}
                  </Button>
                  <Button kind="secondary" onClick={() => fileInput.current?.click()}>
                    {mode === "strip" ? "Upload up to 3 photos" : "Upload a photo"}
                  </Button>
                  {source.kind === "upload" && (
                    <Button kind="tertiary" onClick={backToCamera}>
                      Use camera
                    </Button>
                  )}
                </>
              )}
            </div>

            {selectedSticker && !shooting && (
              <div className={styles.actions} role="group" aria-label={`${selectedSticker.label} sticker`}>
                <Button kind="neutral" small onClick={() => resize(selectedSticker.key, 1 / 1.15)}>
                  Smaller
                </Button>
                <Button kind="neutral" small onClick={() => resize(selectedSticker.key, 1.15)}>
                  Bigger
                </Button>
                <Button kind="destructive" small onClick={() => remove(selectedSticker.key)}>
                  Remove
                </Button>
              </div>
            )}

            <div className={styles.group}>
              {mode === "strip" ? (
                <>
                  <h2 className={styles.groupTitle}>Strip colour</h2>
                  <SegmentedPill label="Strip colour" options={STRIP_OPTIONS} value={stripColor} onChange={setStripColor} compact disabled={shooting} />
                </>
              ) : (
                <>
                  <h2 className={styles.groupTitle}>Frame</h2>
                  <SegmentedPill label="Frame" options={FRAMES} value={frame} onChange={setFrame} compact disabled={shooting} />
                </>
              )}
            </div>

            <div className={styles.group}>
              <h2 className={styles.groupTitle} id="stickers-title">
                Stickers
              </h2>
              {/* DRAFT COPY */}
              {mode === "strip" && <p className={styles.hint}>Stickers stay in the same place on all 3 photos.</p>}
              <ul className={styles.tray} aria-labelledby="stickers-title">
                {STICKERS.map((template) => (
                  <li key={template.kind}>
                    <button type="button" className={styles.trayItem} onClick={() => addSticker(template)} disabled={shooting}>
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
          </div>
        </>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg"
        multiple={mode === "strip"}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          onUpload(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
