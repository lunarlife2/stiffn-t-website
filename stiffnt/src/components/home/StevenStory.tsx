import { Panel } from "@/components/Panel";
import { SectionTitle, StevenSticker } from "@/components/Art";
import styles from "./StevenStory.module.css";

/**
 * Steven's back story (text from the owner). A sticker panel (corner 24, outline 2, shade 5, as the app's popups)
 * with Steven asleep in a loaf on the yellow500 picture box (ItemCard) and the story beside it.
 * The last line closes it in Darumadrop, mainGreen.
 */
export function StevenStory() {
  return (
    <section className={styles.section} aria-labelledby="story-title">
      {/* DRAFT COPY (title only; the story is the owner's) */}
      <SectionTitle id="story-title">Meet Steven</SectionTitle>
      <Panel radius={24} outline={2} shade={5} className={styles.panel}>
        <div className={styles.art}>
          <StevenSticker src="/images/steven/steven-loafing.png" size={260} alt="Steven asleep in a loaf" />
        </div>
        <div className={styles.story}>
          <p>
            Steven was a stray. He slept in cold doorways and cramped boxes, and every morning he woke up stiff. He
            learned that a good stretch was the only way to get going again, so he stretched all the time.
          </p>
          <p>
            One day he wandered onto your screen and decided to stay. Nobody invited him, and he doesn&apos;t need
            feeding. He just likes being near you.
          </p>
          <p>
            He sits there while you work, and he notices when you&apos;ve been still too long. He knows what stiff feels
            like, so he nudges you. Stretch with him.
          </p>
          <p className={styles.closing}>You work, he keeps you company, and both of you stay loose.</p>
        </div>
      </Panel>
    </section>
  );
}
