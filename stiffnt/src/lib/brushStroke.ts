/**
 * A line-for-line port of UIFeature/Component/BrushStroke.swift: a rough, hand-drawn outline around a
 * rounded rectangle, made of overlapping round "stamps" of different sizes, with little nicks along both edges.
 * Same inputs and the same pseudo-random function, so a stroke with the same size and seed wobbles the same way.
 *
 * Returns an SVG path: the outer edge and the inner edge (reversed) as two closed shapes. Fill it with
 * fill-rule="evenodd" to get the ring.
 */
export type BrushStrokeOptions = {
  /** Figma properties, as in the app. */
  gap?: number;
  wiggle?: number;
  sizeJitter?: number;
  angularJitter?: number;
  rotation?: number;
  cornerRadius?: number;
  lineWidth?: number;
  seed?: number;
};

type Point = { x: number; y: number };

export function brushStrokePath(width: number, height: number, options: BrushStrokeOptions = {}): string {
  const {
    gap = 51,
    wiggle = 6,
    sizeJitter = 65,
    angularJitter = 180,
    rotation = 0,
    cornerRadius = 15,
    lineWidth = 4,
    seed = 0,
  } = options;

  if (width <= 0 || height <= 0 || lineWidth <= 0) return "";

  const rand = (index: number, salt: number) => {
    const x = Math.sin(index * 12.9898 + salt * 78.233 + seed + rotation) * 43758.5453;
    return x - Math.floor(x);
  };

  const minX = 0;
  const minY = 0;
  const maxX = width;
  const maxY = height;
  const radius = Math.min(cornerRadius, Math.min(width, height) / 2);

  const spine: { point: Point; out: Point }[] = [];
  const step = Math.max(0.3, lineWidth * 0.08);

  const line = (start: Point, end: Point, out: Point) => {
    const count = Math.max(1, Math.trunc(Math.hypot(end.x - start.x, end.y - start.y) / step));
    for (let index = 0; index < count; index++) {
      const part = index / count;
      spine.push({
        point: { x: start.x + (end.x - start.x) * part, y: start.y + (end.y - start.y) * part },
        out,
      });
    }
  };
  const corner = (center: Point, startAngle: number) => {
    const count = Math.max(2, Math.trunc((radius * Math.PI) / 2 / step));
    for (let index = 0; index < count; index++) {
      const angle = startAngle + ((Math.PI / 2) * index) / count;
      const out = { x: Math.cos(angle), y: Math.sin(angle) };
      spine.push({ point: { x: center.x + out.x * radius, y: center.y + out.y * radius }, out });
    }
  };

  line({ x: minX + radius, y: minY }, { x: maxX - radius, y: minY }, { x: 0, y: -1 });
  corner({ x: maxX - radius, y: minY + radius }, -Math.PI / 2);
  line({ x: maxX, y: minY + radius }, { x: maxX, y: maxY - radius }, { x: 1, y: 0 });
  corner({ x: maxX - radius, y: maxY - radius }, 0);
  line({ x: maxX - radius, y: maxY }, { x: minX + radius, y: maxY }, { x: 0, y: 1 });
  corner({ x: minX + radius, y: maxY - radius }, Math.PI / 2);
  line({ x: minX, y: maxY - radius }, { x: minX, y: minY + radius }, { x: -1, y: 0 });
  corner({ x: minX + radius, y: minY + radius }, Math.PI);

  const length = spine.length * step;
  const stampCount = Math.max(4, Math.trunc(length / Math.max(0.5, (lineWidth * gap) / 100)));
  const stampGap = length / stampCount;
  const stamps = Array.from({ length: stampCount }, (_, index) => ({
    at: index * stampGap,
    radius: lineWidth * 0.62 * (1 - (sizeJitter / 100) * 0.6 * rand(index, 1)),
    off: ((lineWidth * wiggle) / 100) * (rand(index, 2) * 2 - 1),
  }));
  const reach = Math.ceil((lineWidth * 0.62) / stampGap);
  const tear = (lineWidth * 0.16 * Math.min(180, Math.max(0, angularJitter))) / 180;
  const thinnest = lineWidth * 0.36;

  const outer: Point[] = [];
  const inner: Point[] = [];
  spine.forEach((sample, index) => {
    const along = index * step;
    const nearest = Math.trunc(along / stampGap);
    let out = thinnest;
    let into = thinnest;
    for (let neighbour = nearest - reach; neighbour <= nearest + reach + 1; neighbour++) {
      const stamp = stamps[((neighbour % stampCount) + stampCount) % stampCount];
      let distance = Math.abs(along - stamp.at);
      distance = Math.min(distance, length - distance);
      if (!(distance < stamp.radius)) continue;
      const half = Math.sqrt(stamp.radius * stamp.radius - distance * distance);
      out = Math.max(out, stamp.off + half);
      into = Math.max(into, half - stamp.off);
    }
    const nick = (salt: number) => {
      const spike = rand(index, salt + 0.5);
      return tear * ((rand(index, salt) * 2 - 1) * 0.6 + spike * spike * spike * 1.6);
    };
    out += nick(3);
    into += nick(4);
    outer.push({ x: sample.point.x + sample.out.x * out, y: sample.point.y + sample.out.y * out });
    inner.push({ x: sample.point.x - sample.out.x * into, y: sample.point.y - sample.out.y * into });
  });

  const r = (n: number) => Math.round(n * 100) / 100;
  const polygon = (points: Point[]) =>
    points.length ? `M${points.map((p) => `${r(p.x)} ${r(p.y)}`).join("L")}Z` : "";
  return polygon(outer) + polygon(inner.reverse());
}
