import type { Metadata } from "next";
import { SectionTitle } from "@/components/Art";
import { LaserSection } from "@/components/home/LaserSection";
import { laserLayout, type LaserLayout, type LaserTone } from "@/config/layout";

/**
 * TEMPORARY: compares the three Laser section layouts. Not linked anywhere and not indexed.
 * Delete this folder (src/app/laser-options) once a layout is chosen in src/config/layout.ts.
 */
export const metadata: Metadata = {
  title: "Laser layout options",
  robots: { index: false, follow: false },
};

const OPTIONS: { layout: LaserLayout; title: string }[] = [
  { layout: "popup", title: "A · popup" },
  { layout: "stage", title: "B · stage" },
  { layout: "band", title: "C · band" },
];

const TONES: { tone: LaserTone; title: string }[] = [
  { tone: "blue", title: "Blue (blue100 → blue200)" },
  { tone: "yellow", title: "Yellow (yellow500 → yellow100)" },
  { tone: "orange", title: "Orange (orange100 → orange200)" },
  { tone: "green", title: "Green (the app's sidebar, greenPrimary200 → 300)" },
];

export default function LaserOptions() {
  return (
    <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "40px 20px 80px" }}>
      <SectionTitle as="h1">Laser layout options</SectionTitle>
      <p style={{ margin: "8px 0 0" }}>
        Pick one and set <code>laserLayout</code> in <code>src/config/layout.ts</code>.
      </p>
      <h2 style={{ marginTop: 56, fontFamily: "var(--family-display)", fontSize: "var(--type-large-title)", color: "var(--main-green)" }}>
        Background colours
      </h2>
      <p style={{ margin: "8px 0 0" }}>
        Shown on the layout in use (<code>{laserLayout}</code>). Set <code>laserTone</code> in <code>src/config/layout.ts</code>.
      </p>
      {TONES.map((option) => (
        <div key={option.tone} style={{ marginTop: 56 }}>
          <p style={{ margin: 0, fontFamily: "var(--family-display)", fontSize: "var(--type-title1)", color: "var(--shadow-400)" }}>
            {option.title}
          </p>
          <LaserSection layout={laserLayout} tone={option.tone} idPrefix={`tone-${option.tone}`} />
        </div>
      ))}

      <h2 style={{ marginTop: 96, fontFamily: "var(--family-display)", fontSize: "var(--type-large-title)", color: "var(--main-green)" }}>
        Layouts
      </h2>
      {OPTIONS.map((option) => (
        <div key={option.layout} style={{ marginTop: 72 }}>
          <p style={{ margin: 0, fontFamily: "var(--family-display)", fontSize: "var(--type-title1)", color: "var(--shadow-400)" }}>
            {option.title}
          </p>
          <LaserSection layout={option.layout} idPrefix={`option-${option.layout}`} />
        </div>
      ))}
    </div>
  );
}
