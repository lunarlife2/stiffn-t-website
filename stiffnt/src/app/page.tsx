import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, DownloadButton } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { Sunburst } from "@/components/Sunburst";
import { Logotype } from "@/components/Logotype";
import { ScribbleBackground } from "@/components/ScribbleBackground";
import { CoinPill, MysteryBox, SectionTitle, StevenSticker } from "@/components/Art";
import { LaserSection } from "@/components/home/LaserSection";
import { StevenStory } from "@/components/home/StevenStory";
import { HeroDemo } from "@/components/home/HeroDemo";
import { StevenStretching } from "@/components/home/StevenStretching";
import { laserLayout } from "@/config/layout";
import { AccessoryFan } from "@/components/home/AccessoryFan";
import { minimumMacOS } from "@/config/catalog";
import { placeAccessory } from "@/lib/accessorySpots";
import styles from "./home.module.css";

export const metadata: Metadata = {
  // DRAFT COPY
  title: { absolute: "Stiffn't: stretch breaks with a cat who checks on you" },
  // DRAFT COPY
  description:
    "A Mac menu-bar app with a black cat named Steven. He reminds you to stretch, checks your stretch with the camera, and pays you in coins to play with him.",
};

const steps = [
  {
    picture: "/images/steven/steven-front-facing.png",
    sticker: true,
    // DRAFT COPY
    title: "Steven checks on you",
    // DRAFT COPY
    text: "You choose how often. When it's time for a break, Steven walks onto your screen to remind you.",
  },
  {
    picture: "/images/stretch/body-stretch.png",
    // DRAFT COPY
    title: "Stretch with the camera",
    // DRAFT COPY
    text: "Follow a short neck, hand or standing stretch. Your Mac's camera checks each pose, right on your Mac.",
  },
  {
    coin: true,
    // DRAFT COPY
    title: "Earn coins",
    // DRAFT COPY
    text: "Every break you finish pays coins. Spend them on silly new ways to play with Steven.",
  },
];

/**
 * The page tells one story: what it is (hero) → who Steven is and who it's for → how it works → what's fun
 * (laser, accessories, photobooth) → get it. Every section is spaced by the same --section-gap.
 */
export default function Home() {
  const glasses = placeAccessory("pickedUp", "glasses");

  return (
    <>
      {/* 1. Hero: Steven, the name, the pitch and Download all in the first screen */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <ScribbleBackground />
        <div className={styles.heroInner}>
          <div className={styles.heroDemo}>
            <HeroDemo>
              <StevenStretching />
            </HeroDemo>
          </div>
          <div className={styles.heroWords}>
            <h1 id="hero-title" className={styles.heroTitle}>
              <Logotype />
            </h1>
            <p className={styles.heroPitch}>
              <span className={styles.heroSlogan}>With Steven</span>
              {/* DRAFT COPY (first half is the app's own onboarding line) */}
              <span className={styles.heroLine}>Short stretch breaks for your Mac, with a cat who checks on&nbsp;you.</span>
            </p>
            <DownloadButton large light />
          </div>
        </div>
      </section>

      <div className={styles.page}>
        {/* 2. Meet Steven (with what the app is, which used to be its own About section) */}
        <StevenStory />

        {/* 3. How it works */}
        <section className={styles.section} aria-labelledby="how-title">
          <SectionTitle id="how-title">How it works</SectionTitle>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <div className={styles.stepPicture}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {index + 1}
                  </span>
                  {step.coin ? (
                    <span className={styles.stepCoin}>
                      <CoinPill>+ coins</CoinPill>
                    </span>
                  ) : step.sticker ? (
                    <StevenSticker src={step.picture} size={120} alt="" />
                  ) : (
                    <Image src={step.picture!} alt="" width={120} height={120} />
                  )}
                </div>
                <div className={styles.stepWords}>
                  <h3 className={styles.stepTitle}>
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 4–6. What's fun: Laser, Accessories, then trying them on in the Photobooth */}
        <div id="features" className={styles.features}>
          <LaserSection layout={laserLayout} />

          <section className={`${styles.section} ${styles.centred}`} aria-labelledby="accessories-title">
            <SectionTitle id="accessories-title">Accessories</SectionTitle>
            {/* DRAFT COPY */}
            <p className={styles.lead}>
              Steven has a little wardrobe: a crown, glasses and a bow, each one a surprise from a mystery box.
            </p>
            <AccessoryFan />
          </section>

          <section className={styles.section} aria-labelledby="photobooth-title">
            <Panel radius={24} outline={2} shade={5} className={styles.boothCard}>
              <div className={styles.boothArt}>
                <span className={`${styles.boothSteven} steven-outline`}>
                  <Image src="/images/steven/steven-picked-up.png" alt="" width={540} height={540} sizes="220px" />
                  {/* eslint-disable-next-line @next/next/no-img-element -- placed in % at the app's glasses spot */}
                  <img
                    src="/images/accessories/small/glasses.png"
                    alt=""
                    width={270}
                    height={270}
                    className={styles.boothGlasses}
                    style={{ left: glasses.left, top: glasses.top, width: glasses.width }}
                  />
                </span>
              </div>
              <div className={styles.boothWords}>
                <h2 id="photobooth-title" className={styles.boothTitle}>
                  {/* DRAFT COPY */}
                  Try the accessories on yourself!
                </h2>
                {/* DRAFT COPY */}
                <p className={styles.boothText}>
                  Put Steven&apos;s crown, glasses or bow on your own photo, pick a frame with Steven in it, and snap a
                  single photo or a strip of three.
                </p>
                <ButtonLink href="/photobooth" kind="primary">
                  Open the Photobooth
                </ButtonLink>
              </div>
            </Panel>
          </section>
        </div>

        {/* 7. Get the app */}
        <section className={styles.section} aria-labelledby="get-title">
          <Panel radius={24} outline={2} shade={5} className={styles.getPanel}>
            <div className={styles.getArt}>
              <Sunburst />
              <MysteryBox width="min(220px, 50%)" className={styles.getBox} />
            </div>
            <div className={styles.getWords}>
              <h2 id="get-title" className={styles.getTitle}>
                Get Stiffn&apos;t
              </h2>
              {/* DRAFT COPY */}
              <p className={styles.getText}>Steven is waiting on your menu bar.</p>
              <h3 className={styles.requirementsTitle}>System requirements</h3>
              <ul className={styles.requirements}>
                <li>macOS {minimumMacOS} or later</li>
                {/* DRAFT COPY */}
                <li>A camera (built-in or external) to check your stretches</li>
              </ul>
              <DownloadButton wide large />
            </div>
          </Panel>
        </section>
      </div>
    </>
  );
}
