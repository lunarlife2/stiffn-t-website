import type { Metadata } from "next";
import { SectionTitle } from "@/components/Art";
import { Photobooth } from "@/components/photobooth/Photobooth";
import { site } from "@/config/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  // DRAFT COPY
  title: "Photobooth",
  // DRAFT COPY
  description: "Take a photo with Steven the cat. Then add his crown, glasses, bow or fairy wings, and download it as a PNG.",
};

/**
 * The Photobooth fills the window under the header: one compact row (title, mode switch, "How it works & privacy"),
 * then the live preview and the options side by side. The intro sits behind the "How it works & privacy" button.
 */
export default function PhotoboothPage() {
  return (
    <div className={styles.page}>
      <Photobooth
        title={
          <SectionTitle as="h1" className={styles.title}>
            Photobooth
          </SectionTitle>
        }
        info={
          <details className={styles.info}>
            <summary className={styles.infoButton}>
              <span aria-hidden="true">ⓘ</span> How it works &amp; privacy
            </summary>
            <div className={styles.infoPanel}>
              <p>
                Strike a pose with Steven! First take a single photo or a strip of three. Then pick a frame and a
                colour, drag stickers onto the photo you want them on, and save it.
              </p>
              <p>
                Your photo is made in your browser. When it&apos;s finished, it is uploaded so a QR code can open it on
                your phone. Only people with the link can see it, and it&apos;s deleted automatically after{" "}
                {site.photobooth.photoLifetimeHours} hours.
              </p>
            </div>
          </details>
        }
      />
    </div>
  );
}
