/**
 * The Photobooth's "paper": one layout for both modes, used by the live preview (as percentages) and by the
 * canvas that makes the PNG. Everything runs in the visitor's browser.
 *
 * Paper: 1200 px wide. Photo slots are 4:3 (1080 × 810) with 60 px margins at the sides and top, 40 px between
 * slots, a 6 px black outline and corner 24; under the slots a 260 px footer with "Stiffn't" (Darumadrop) and the date.
 * Single photo = 1 slot → 1200 × 1130. Strip = 3 slots → 1200 × 2830.
 */

export type Mode = "single" | "strip";

export type Sticker = {
  key: number;
  kind: string;
  src: string;
  label: string;
  /** Draw StevenOutline's white sticker edge around it. */
  outline: boolean;
  /** Middle, as a share of the slot's width / height. */
  x: number;
  y: number;
  /** Width, as a share of the slot's width. */
  w: number;
};

export const PAPER = {
  width: 1200,
  margin: 60,
  slot: { width: 1080, height: 810 },
  gap: 40,
  footer: 260,
  outline: 6,
  radius: 24,
  /** Footer text: baseline of "Stiffn't" and of the date, measured from the bottom of the last slot. */
  name: { size: 110, baseline: 150 },
  date: { size: 40, baseline: 210 },
};

export const slotCount = (mode: Mode) => (mode === "strip" ? 3 : 1);
export const paperHeight = (mode: Mode) =>
  PAPER.margin + slotCount(mode) * PAPER.slot.height + (slotCount(mode) - 1) * PAPER.gap + PAPER.footer;
export const slotTop = (index: number) => PAPER.margin + index * (PAPER.slot.height + PAPER.gap);

// ── Backgrounds (the paper's colour) ─────────────────────────────────────────

export type BackgroundId = "cream" | "green" | "yellow" | "burst-green" | "burst-yellow" | "burst-blue" | "burst-orange";

/** Design tokens (src/styles/tokens.css). Sunbursts: dark rays / light rays, as Sunburst.swift. */
export const BACKGROUNDS: Record<BackgroundId, { title: string; fill?: string; burst?: { dark: string; light: string } }> = {
  cream: { title: "Cream", fill: "#f7f2de" }, // appBackground
  green: { title: "Green", fill: "#cff193" }, // greenPrimary300
  yellow: { title: "Yellow", fill: "#ffd000" }, // yellow200
  "burst-green": { title: "Sunburst", burst: { dark: "#7ac743", light: "#cff193" } }, // greenPrimary400 / 300 (the app's)
  "burst-yellow": { title: "Yellow burst", burst: { dark: "#ffd000", light: "#f7d992" } }, // yellow200 / yellow100
  "burst-blue": { title: "Blue burst", burst: { dark: "#77cbff", light: "#bbe3fc" } }, // blue200 / blue100
  "burst-orange": { title: "Orange burst", burst: { dark: "#ff9d00", light: "#f6c674" } }, // orange300 / orange200
};

// ── Frames (Steven on the paper's edges) ─────────────────────────────────────

export type FrameId =
  | "classic"
  | "hanging"
  | "stretch"
  | "corner"
  | "sleepy"
  | "crowd-standing"
  | "crowd-sitting"
  | "crowd-hanging"
  | "crowd-sleepy"
  | "crowd-stretch";

/**
 * Steven on the outer frame, never over the middle of a photo (where faces are). Positions are in paper pixels:
 * `left` or `right` from the side, `top` from the top edge or `bottom` from the bottom edge, `size` the picture's
 * width (all pictures are square). Pictures are the app's own (see README "Assets").
 */
export type FramePose = {
  src: string;
  size: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  /** Mirror him (face the other way). */
  flip?: boolean;
};

/** `crowd`: twenty small copies of the picture all round the edges (the ×20 frames). */
export const FRAMES: Record<FrameId, { title: string; label: string; pose?: FramePose; crowd?: string }> = {
  classic: { title: "Classic", label: "Classic, no Steven" },
  hanging: {
    title: "Hanging",
    label: "Steven hanging in from the top",
    pose: { src: "/images/steven/steven-picked-up.png", size: 330, left: -10, top: -10 },
  },
  stretch: {
    title: "Stretch",
    label: "Steven stretching on the top corner",
    pose: { src: "/images/steven/steven-stretching.png", size: 400, right: -40, top: -50 },
  },
  corner: {
    title: "Corner",
    label: "Steven sitting in the bottom corner",
    pose: { src: "/images/steven/steven-sitting.png", size: 330, right: 10, bottom: -6, flip: true },
  },
  sleepy: {
    title: "Sleepy",
    label: "Steven asleep along the bottom",
    pose: { src: "/images/steven/steven-loafing.png", size: 330, right: 40, bottom: -36 },
  },
  "crowd-standing": {
    title: "Standing ×20",
    label: "Twenty small standing Stevens all round the edges",
    crowd: "/images/steven/steven-front-facing.png",
  },
  "crowd-sitting": {
    title: "Sitting ×20",
    label: "Twenty small sitting Stevens all round the edges",
    crowd: "/images/steven/steven-sitting.png",
  },
  "crowd-hanging": {
    title: "Hanging ×20",
    label: "Twenty small hanging Stevens all round the edges",
    crowd: "/images/steven/steven-picked-up.png",
  },
  "crowd-sleepy": {
    title: "Sleepy ×20",
    label: "Twenty small sleeping Stevens all round the edges",
    crowd: "/images/steven/steven-loafing.png",
  },
  "crowd-stretch": {
    title: "Stretch ×20",
    label: "Twenty small stretching Stevens all round the edges",
    crowd: "/images/steven/steven-stretching.png",
  },
};

/** One Steven placed on the paper (paper pixels). */
export type Placed = { src: string; left: number; top: number; size: number; flip: boolean; rotate: number };

const CROWD_SIZE = 110;
/** How many fit round the preview (1200 × 900); bigger papers get more at the same spacing (a strip about 38). */
const CROWD_COUNT = 20;

/**
 * A ×20 frame: small copies of one pose (110 px) spread evenly all round the paper's edges, their middles 30 px in
 * from the edge: mostly on the margin, just over the photos' edges, clear of the middle (where faces are). Twenty on
 * the preview; longer papers get more at the same spacing, so the strip is just as crowded.
 * They keep clear of the printed "Stiffn't" and date (bottom left): along the bottom only the right half, and down
 * the left side only as far as the last photo (`slotsBottom`). Each one is tilted a
 * little and every other one mirrored, so the crowd looks lively.
 */
function crowd(src: string, height: number, slotsBottom: number): Placed[] {
  const size = CROWD_SIZE;
  const W = PAPER.width;
  const inset = 30;
  const [l, r, t, b] = [inset, W - inset, inset, height - inset];
  // The edge lines, clockwise from the top left: [x1, y1, x2, y2].
  const segments: [number, number, number, number][] = [
    [l, t, r, t], // top
    [r, t, r, b], // right
    [r, b, W * 0.5, b], // bottom, right half
    [l, Math.min(slotsBottom, b), l, t], // left, up from the last photo
  ];
  const lengths = segments.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const spacing = (2 * (PREVIEW.width + PREVIEW.height)) / CROWD_COUNT;
  const count = Math.max(CROWD_COUNT, Math.round(total / spacing));
  const step = total / count;
  const placed: Placed[] = [];
  for (let index = 0; index < count; index++) {
    let distance = (index + 0.5) * step;
    let segment = 0;
    while (distance > lengths[segment]) distance -= lengths[segment++];
    const [x1, y1, x2, y2] = segments[segment];
    const share = distance / lengths[segment];
    const cx = x1 + (x2 - x1) * share;
    const cy = y1 + (y2 - y1) * share;
    placed.push({
      src,
      left: cx - size / 2,
      top: cy - size / 2,
      size,
      flip: index % 2 === 1,
      rotate: ((index * 37) % 25) - 12,
    });
  }
  return placed;
}

function placements(frame: FrameId, height: number, slotsBottom: number): Placed[] {
  const entry = FRAMES[frame];
  if (entry.crowd) return crowd(entry.crowd, height, slotsBottom);
  if (!entry.pose) return [];
  const pose = entry.pose;
  const left = pose.left ?? PAPER.width - (pose.right ?? 0) - pose.size;
  const top = pose.top ?? height - (pose.bottom ?? 0) - pose.size;
  return [{ src: pose.src, left, top, size: pose.size, flip: Boolean(pose.flip), rotate: 0 }];
}

/** Every Steven of a frame on the printed paper. */
export function framePlacements(frame: FrameId, mode: Mode): Placed[] {
  return placements(frame, paperHeight(mode), slotTop(slotCount(mode) - 1) + PAPER.slot.height);
}

/**
 * The setup preview: one 4:3 photo, 1200 × 900, with a thin band of the frame colour round it (30 px) and the frame's
 * Stevens on it, without the printed footer. Steven sits in the same corners as on the paper.
 */
export const PREVIEW = { width: 1200, height: 900, inset: 30, radius: 24 };

export function previewPlacements(frame: FrameId): Placed[] {
  return placements(frame, PREVIEW.height, PREVIEW.height - PREVIEW.inset);
}

// ── File names ───────────────────────────────────────────────────────────────

/** stiffnt-photo-YYYY-MM-DD-HHmm.png / stiffnt-strip-YYYY-MM-DD-HHmm.png (local time). */
export function photoFileName(mode: Mode, date: Date, extension = "png") {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `stiffnt-${mode === "strip" ? "strip" : "photo"}-${stamp}.${extension}`;
}

// ── Drawing ──────────────────────────────────────────────────────────────────

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Sunburst.swift on a canvas: 30 rays, light rays 15% → 90% → 100% from the middle to half the shorter side. */
function drawSunburst(ctx: CanvasRenderingContext2D, width: number, height: number, dark: string, light: string) {
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.hypot(width, height);
  const rays = 30;
  const step = (2 * Math.PI) / rays;
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) / 2);
  const rgba = (hex: string, alpha: number) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  };
  gradient.addColorStop(0, rgba(light, 0.15));
  gradient.addColorStop(0.5, rgba(light, 0.9));
  gradient.addColorStop(1, light);
  ctx.beginPath();
  for (let index = 0; index < rays; index++) {
    const start = index * step;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + reach * Math.cos(start), cy + reach * Math.sin(start));
    ctx.lineTo(cx + reach * Math.cos(start + step / 2), cy + reach * Math.sin(start + step / 2));
    ctx.closePath();
  }
  ctx.fillStyle = gradient;
  ctx.fill();
}

/** Draw `source` to fill the rect (cut to fit, like object-fit: cover), mirrored if asked. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  x: number,
  y: number,
  w: number,
  h: number,
  mirror: boolean,
) {
  const scale = Math.max(w / sourceWidth, h / sourceHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (sourceWidth - sw) / 2;
  const sy = (sourceHeight - sh) / 2;
  ctx.save();
  if (mirror) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h);
  }
  ctx.restore();
}

/** StevenOutline: hard white shadows all round, then the picture. `width` in canvas pixels. */
function drawWithOutline(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  width = Math.max(1.2, h * 0.014) * 1.5,
  flip = false,
  rotate = 0,
) {
  ctx.save();
  if (rotate) {
    // turn around the picture's middle
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    x = 0;
    y = 0;
  }
  ctx.save();
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 0;
  const d = width * 0.7071;
  for (const [dx, dy] of [
    [width, 0],
    [-width, 0],
    [0, width],
    [0, -width],
    [d, d],
    [-d, -d],
    [d, -d],
    [-d, d],
  ]) {
    ctx.shadowOffsetX = flip ? -dx : dx;
    ctx.shadowOffsetY = dy;
    ctx.drawImage(image, x, y, w, h);
  }
  ctx.restore();
  ctx.drawImage(image, x, y, w, h);
  ctx.restore();
}

/** One photo slot: the camera frame cut to 4:3, mirrored like a mirror, with the stickers on it. */
export async function renderSlot({
  source,
  sourceWidth,
  sourceHeight,
  stickers,
}: {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  stickers: Sticker[];
}): Promise<HTMLCanvasElement> {
  const { width, height } = PAPER.slot;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  drawCover(ctx, source, sourceWidth, sourceHeight, 0, 0, width, height, true);
  for (const sticker of stickers) {
    const image = await loadImage(sticker.src);
    const sw = sticker.w * width;
    const sh = (sw * image.naturalHeight) / image.naturalWidth;
    const sx = sticker.x * width - sw / 2;
    const sy = sticker.y * height - sh / 2;
    if (sticker.outline) drawWithOutline(ctx, image, sx, sy, sw, sh, 4);
    else ctx.drawImage(image, sx, sy, sw, sh);
  }
  return canvas;
}

/** The finished paper: background, slots, footer, Steven's frame. Returns the canvas (PNG or JPEG is up to the caller). */
export async function renderPaper({
  mode,
  slots,
  background,
  frame,
  date,
  displayFont,
  textFont,
}: {
  mode: Mode;
  slots: HTMLCanvasElement[];
  background: BackgroundId;
  frame: FrameId;
  date: Date;
  displayFont: string;
  textFont: string;
}): Promise<HTMLCanvasElement> {
  const width = PAPER.width;
  const height = paperHeight(mode);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const look = BACKGROUNDS[background];
  if (look.burst) drawSunburst(ctx, width, height, look.burst.dark, look.burst.light);
  else {
    ctx.fillStyle = look.fill ?? "#f7f2de";
    ctx.fillRect(0, 0, width, height);
  }

  const { margin, slot, outline, radius } = PAPER;
  slots.slice(0, slotCount(mode)).forEach((picture, index) => {
    const x = margin;
    const y = slotTop(index);
    ctx.save();
    roundedRect(ctx, x, y, slot.width, slot.height, radius);
    ctx.clip();
    ctx.drawImage(picture, x, y, slot.width, slot.height);
    ctx.restore();
    ctx.lineWidth = outline;
    ctx.strokeStyle = "#000000";
    roundedRect(ctx, x + outline / 2, y + outline / 2, slot.width - outline, slot.height - outline, radius);
    ctx.stroke();
  });

  // Footer: name and date, the same on both modes. On a sunburst they sit on a cream label so they stay readable.
  const slotsBottom = slotTop(slotCount(mode) - 1) + slot.height;
  if (look.burst) {
    ctx.fillStyle = "#f7f2de";
    roundedRect(ctx, margin - 4, slotsBottom + 40, 470, 196, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
  }
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${PAPER.name.size}px ${displayFont}`;
  ctx.fillText("Stiffn't", margin + 20, slotsBottom + PAPER.name.baseline);
  ctx.font = `600 ${PAPER.date.size}px ${textFont}`;
  ctx.fillText(
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    margin + 24,
    slotsBottom + PAPER.date.baseline,
  );

  for (const place of framePlacements(frame, mode)) {
    const image = await loadImage(place.src);
    const outlineWidth = place.size < 150 ? 3 : 7;
    drawWithOutline(ctx, image, place.left, place.top, place.size, place.size, outlineWidth, place.flip, place.rotate);
  }
  return canvas;
}

export const canvasToBlob = (canvas: HTMLCanvasElement, type = "image/png", quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not make the picture"))), type, quality),
  );
