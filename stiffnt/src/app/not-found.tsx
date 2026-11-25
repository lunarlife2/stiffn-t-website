import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { Sunburst } from "@/components/Sunburst";
import { StevenSticker } from "@/components/Art";

export const metadata: Metadata = {
  title: "Page not found",
};

/** In the app's popup style (MysteryCanView): sunburst art, a 2pt black line, words, then the button. */
export default function NotFound() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 20px 72px" }}>
      <Panel radius={24} outline={2} shade={5} style={{ width: "min(100%, 440px)" }}>
        <div
          style={{
            position: "relative",
            height: 300,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "2px solid var(--black)",
          }}
        >
          <Sunburst />
          <StevenSticker size={200} alt="Steven, tilting his head, confused" style={{ position: "relative", rotate: "-14deg" }} />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "22%",
              top: "14%",
              fontFamily: "var(--family-display)",
              fontSize: 72,
              color: "var(--white)",
              textShadow: "3px 3px 0 var(--black)",
              rotate: "12deg",
            }}
          >
            ?
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "24px 22px 30px" }}>
          {/* DRAFT COPY */}
          <h1 style={{ fontFamily: "var(--family-display)", fontSize: "var(--type-large-title)", fontWeight: 400 }}>
            Huh? This page isn&apos;t here
          </h1>
          {/* DRAFT COPY */}
          <p style={{ margin: "0 0 14px", fontSize: "var(--type-popup-body)", color: "var(--shadow-400)" }}>
            Steven looked everywhere, even under the couch.
          </p>
          <ButtonLink href="/" wide>
            Back to home
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
