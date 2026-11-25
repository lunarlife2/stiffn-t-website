/**
 * Drawing the photobooth picture on a canvas. Everything runs in the visitor's browser; nothing is uploaded.
 */

export type FrameId = "none" | "outline" | "sunburst";

export type Sticker = {
  key: number;
  kind: string;
  src: string;
  label: string;
  /** Draw StevenOutline's white sticker edge around it. */
  outline: boolean;
  /** Middle, as a share of the photo's width / height. */
  x: number;
  y: number;
  /** Width, as a share of the photo's width. */
  w: number;
};

/** The photo itself, 4:3. */
export const PHOTO = { width: 1200, height: 900 };

/** Frame sizes on the 1200-wide photo (the app's 2pt outline, 5pt shade and corner 24, scaled ×3). */
export const FRAME = {
  outline: 6,
  shade: 15,
  radius: 72,
  padding: { none: 0, outline: 48, sunburst: 96 } as Record<FrameId, number>,
};

const COLORS = {
  black: "#000000",
  cream: "#f7f2de", // appBackground
  dark: "#7ac743", // greenPrimary400 (Sunburst dark)
  light: "#cff193", // greenPrimary300 (Sunburst light)
};

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
function drawSunburst(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.hypot(width, height);
  const rays = 30;
  const step = (2 * Math.PI) / rays;
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) / 2);
  gradient.addColorStop(0, "rgba(207, 241, 147, 0.15)");
  gradient.addColorStop(0.5, "rgba(207, 241, 147, 0.9)");
  gradient.addColorStop(1, COLORS.light);
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

/** StevenOutline: four hard white shadows (right, left, down, up), then the picture. */
function drawWithOutline(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const width = Math.max(1.2, h * 0.014) * 1.5;
  ctx.save();
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 0;
  for (const [dx, dy] of [
    [width, 0],
    [-width, 0],
    [0, width],
    [0, -width],
    [width * 0.7, width * 0.7],
    [-width * 0.7, -width * 0.7],
    [width * 0.7, -width * 0.7],
    [-width * 0.7, width * 0.7],
  ]) {
    ctx.shadowOffsetX = dx;
    ctx.shadowOffsetY = dy;
    ctx.drawImage(image, x, y, w, h);
  }
  ctx.restore();
  ctx.drawImage(image, x, y, w, h);
}

export async function renderPhoto({
  source,
  sourceWidth,
  sourceHeight,
  mirror,
  stickers,
  frame,
}: {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  mirror: boolean;
  stickers: Sticker[];
  frame: FrameId;
}): Promise<Blob> {
  const pad = FRAME.padding[frame];
  const extra = frame === "none" ? 0 : FRAME.shade;
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO.width + pad * 2 + extra;
  canvas.height = PHOTO.height + pad * 2 + extra;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  // Behind the photo
  if (frame === "sunburst") drawSunburst(ctx, canvas.width, canvas.height);
  if (frame === "outline") {
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const x = pad;
  const y = pad;
  const { width: w, height: h } = PHOTO;
  const radius = frame === "none" ? 0 : FRAME.radius;

  // The solid black shade, down and to the right
  if (frame !== "none") {
    ctx.fillStyle = COLORS.black;
    roundedRect(ctx, x + FRAME.shade, y + FRAME.shade, w, h, radius);
    ctx.fill();
  }

  // The photo and stickers, cut to the rounded shape
  ctx.save();
  roundedRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(x, y, w, h);
  drawCover(ctx, source, sourceWidth, sourceHeight, x, y, w, h, mirror);
  for (const sticker of stickers) {
    const image = await loadImage(sticker.src);
    const sw = sticker.w * w;
    const sh = (sw * image.naturalHeight) / image.naturalWidth;
    const sx = x + sticker.x * w - sw / 2;
    const sy = y + sticker.y * h - sh / 2;
    if (sticker.outline) drawWithOutline(ctx, image, sx, sy, sw, sh);
    else ctx.drawImage(image, sx, sy, sw, sh);
  }
  ctx.restore();

  // The black outline
  if (frame !== "none") {
    ctx.lineWidth = FRAME.outline;
    ctx.strokeStyle = COLORS.black;
    roundedRect(ctx, x + FRAME.outline / 2, y + FRAME.outline / 2, w - FRAME.outline, h - FRAME.outline, radius);
    ctx.stroke();
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not make the PNG"))), "image/png"),
  );
}

// ── Photo strip ──────────────────────────────────────────────────────────────

export type StripColor = "cream" | "green" | "yellow";

/** The strip's paper, from the design tokens: appBackground, greenPrimary300, yellow200. */
export const STRIP_COLORS: Record<StripColor, { title: string; fill: string }> = {
  cream: { title: "Cream", fill: "#f7f2de" },
  green: { title: "Green", fill: "#cff193" },
  yellow: { title: "Yellow", fill: "#ffd000" },
};

/**
 * The classic 2 × 6 inch photobooth strip: 600 × 1800 px, three 540 × 450 photos (6:5) stacked, each with a black
 * outline, then "Stiffn't" in Darumadrop, the date, and a small Steven in the corner.
 */
export const STRIP = {
  width: 600,
  height: 1800,
  margin: 30,
  gap: 20,
  shot: { width: 540, height: 450 },
  outline: 5,
  radius: 18,
};

/** One photo of the strip (or any shot): the picture cut to fit, mirrored if asked, with the stickers on it. */
export async function renderShot({
  source,
  sourceWidth,
  sourceHeight,
  mirror,
  stickers,
  width = STRIP.shot.width * 2,
  height = STRIP.shot.height * 2,
}: {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  mirror: boolean;
  stickers: Sticker[];
  width?: number;
  height?: number;
}): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, width, height);
  drawCover(ctx, source, sourceWidth, sourceHeight, 0, 0, width, height, mirror);
  for (const sticker of stickers) {
    const image = await loadImage(sticker.src);
    const sw = sticker.w * width;
    const sh = (sw * image.naturalHeight) / image.naturalWidth;
    const sx = sticker.x * width - sw / 2;
    const sy = sticker.y * height - sh / 2;
    if (sticker.outline) drawWithOutline(ctx, image, sx, sy, sw, sh);
    else ctx.drawImage(image, sx, sy, sw, sh);
  }
  return canvas;
}

/** The finished strip as a PNG. `displayFont` is the CSS font-family of Darumadrop One (loaded by next/font). */
export async function renderStrip({
  shots,
  color,
  date,
  displayFont,
  textFont,
}: {
  shots: HTMLCanvasElement[];
  color: StripColor;
  date: Date;
  displayFont: string;
  textFont: string;
}): Promise<Blob> {
  const { width, height, margin, gap, shot, outline, radius } = STRIP;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  ctx.fillStyle = STRIP_COLORS[color].fill;
  ctx.fillRect(0, 0, width, height);

  shots.slice(0, 3).forEach((picture, index) => {
    const x = margin;
    const y = margin + index * (shot.height + gap);
    ctx.save();
    roundedRect(ctx, x, y, shot.width, shot.height, radius);
    ctx.clip();
    ctx.drawImage(picture, x, y, shot.width, shot.height);
    ctx.restore();
    ctx.lineWidth = outline;
    ctx.strokeStyle = COLORS.black;
    roundedRect(ctx, x + outline / 2, y + outline / 2, shot.width - outline, shot.height - outline, radius);
    ctx.stroke();
  });

  // The bottom: name, date, and Steven peeking in the corner.
  const bottomTop = margin + 3 * shot.height + 2 * gap;
  const steven = await loadImage("/images/steven/steven-front-facing.png");
  const stevenSize = 170;
  drawWithOutline(ctx, steven, width - margin - stevenSize + 20, height - stevenSize - 6, stevenSize, stevenSize);

  ctx.fillStyle = COLORS.black;
  ctx.textBaseline = "alphabetic";
  ctx.font = `92px ${displayFont}`;
  ctx.fillText("Stiffn't", margin + 4, bottomTop + 150);
  ctx.font = `600 30px ${textFont}`;
  ctx.fillText(
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    margin + 8,
    bottomTop + 205,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not make the PNG"))), "image/png"),
  );
}
