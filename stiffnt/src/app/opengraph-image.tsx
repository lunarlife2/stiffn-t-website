import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Stiffn't: Steven the black cat on a green sunburst";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The Sunburst.swift burst as an SVG (30 rays, greenPrimary400 / greenPrimary300). */
function sunburstSvg() {
  const rays = 30;
  const step = (2 * Math.PI) / rays;
  let d = "";
  for (let index = 0; index < rays; index++) {
    const a = index * step;
    const p = (angle: number) => `${(1.6 * Math.cos(angle)).toFixed(3)} ${(1.6 * Math.sin(angle)).toFixed(3)}`;
    d += `M0 0L${p(a)}L${p(a + step / 2)}Z`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.905 -1 3.81 2" width="1200" height="630"><defs><radialGradient id="g" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#cff193" stop-opacity="0.15"/><stop offset="0.5" stop-color="#cff193" stop-opacity="0.9"/><stop offset="1" stop-color="#cff193"/></radialGradient></defs><rect x="-2" y="-1" width="4" height="2" fill="#7ac743"/><path d="${d}" fill="url(#g)"/></svg>`;
}

export default async function OpenGraphImage() {
  const [font, steven] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/DarumadropOne-Regular.ttf")),
    readFile(join(process.cwd(), "public/images/steven/steven-front-facing.png")),
  ]);
  const burst = `data:image/svg+xml;base64,${Buffer.from(sunburstSvg()).toString("base64")}`;
  const cat = `data:image/png;base64,${steven.toString("base64")}`;
  const white = "#ffffff";
  const outline = 5;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <img src={burst} width={1200} height={630} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
        <img
          src={cat}
          width={420}
          height={420}
          alt=""
          style={{
            filter: `drop-shadow(${outline}px 0 0 ${white}) drop-shadow(-${outline}px 0 0 ${white}) drop-shadow(0 ${outline}px 0 ${white}) drop-shadow(0 -${outline}px 0 ${white})`,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div
            style={{
              fontFamily: "Daruma",
              fontSize: 150,
              lineHeight: 1,
              color: white,
              textShadow: "6px 6px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
            }}
          >
            Stiffn&apos;t
          </div>
          <div
            style={{
              marginTop: 18,
              padding: "10px 24px",
              borderRadius: 999,
              border: "3px solid #000",
              background: "#f7f2de",
              fontFamily: "Daruma",
              fontSize: 34,
              color: "#000",
            }}
          >
            {/* DRAFT COPY */}
            Stretch breaks with a cat
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Daruma", data: font, style: "normal", weight: 400 }] },
  );
}
