import { laser } from "@/config/catalog";
import { laserTone as defaultTone, type LaserLayout, type LaserTone } from "@/config/layout";
import { Panel } from "@/components/Panel";
import { SectionTitle } from "@/components/Art";
import { LaserVideo } from "./LaserVideo";
import { LaserField } from "./LaserField";
import styles from "./LaserSection.module.css";

/** The words, the same in every layout. */
function Words({ titleId, popup = false }: { titleId: string; popup?: boolean }) {
  return (
    <>
      {popup ? (
        <h2 id={titleId} className={styles.popupTitle}>
          {/* DRAFT COPY */}
          Play laser with Steven
        </h2>
      ) : (
        // DRAFT COPY
        <SectionTitle id={titleId}>Play laser with Steven</SectionTitle>
      )}
      {/* DRAFT COPY (first sentence is the app's own description) */}
      <p className={popup ? styles.popupText : styles.text}>
        {laser.blurb} Spend the coins you earn from stretch breaks to unlock it.
      </p>
      {/* DRAFT COPY (the app gives a new user Laser's first day free) */}
      <p className={styles.free}>First day free</p>
    </>
  );
}

/**
 * The Laser feature, in one of three layouts (pick one in src/config/layout.ts):
 * - popup: the app's "Laser Is Active!" popup (ShopView BoughtPopup / MysteryCanView): the art on top,
 *   a 2pt black line, the words under it; corner 24, outline 2, shade 5
 * - stage: the words centered, then the video wide in a sticker panel (corner 24, outline 2, shade 5)
 * - band: a full-width band with the video panel and a words panel side by side
 * The art behind the video is LaserField (the app's sidebar background, recoloured), not the sunburst.
 */
export function LaserSection({
  layout,
  tone = defaultTone,
  idPrefix = "laser",
}: {
  layout: LaserLayout;
  tone?: LaserTone;
  idPrefix?: string;
}) {
  const titleId = `${idPrefix}-title`;

  if (layout === "popup") {
    return (
      <section className={styles.section} aria-labelledby={titleId}>
        <Panel radius={24} outline={2} shade={5} className={styles.popup}>
          <div className={styles.popupArt}>
            <LaserField tone={tone} />
            <div className={styles.popupVideo}>
              <LaserVideo item={laser} active />
            </div>
          </div>
          <div className={styles.popupWords}>
            <Words titleId={titleId} popup />
          </div>
        </Panel>
      </section>
    );
  }

  if (layout === "stage") {
    return (
      <section className={styles.section} aria-labelledby={titleId}>
        <div className={styles.stageWords}>
          <Words titleId={titleId} />
        </div>
        <Panel radius={24} outline={2} shade={5} className={styles.stageVideo}>
          <LaserVideo item={laser} active />
        </Panel>
      </section>
    );
  }

  return (
    <section className={`${styles.section} ${styles.band}`} aria-labelledby={titleId}>
      <LaserField tone={tone} />
      <div className={styles.bandInner}>
        <Panel radius={24} outline={2} shade={5} className={styles.bandVideo}>
          <LaserVideo item={laser} active />
        </Panel>
        <Panel radius={24} outline={2} shade={5} className={styles.bandWords}>
          <Words titleId={titleId} />
        </Panel>
      </div>
    </section>
  );
}
