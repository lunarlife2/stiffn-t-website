import type { Metadata } from "next";
import Image from "next/image";
import { DownloadButton } from "@/components/Button";
import { Panel } from "@/components/Panel";
import { Sunburst } from "@/components/Sunburst";
import { CoinPill, MysteryBox, SectionTitle, StevenSticker } from "@/components/Art";
import { LaserSection } from "@/components/home/LaserSection";
import { StevenStory } from "@/components/home/StevenStory";
import { StevenStretching } from "@/components/home/StevenStretching";
import { laserLayout } from "@/config/layout";
import { AccessoryFan } from "@/components/home/AccessoryFan";
import { minimumMacOS } from "@/config/catalog";
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

export default function Home() {

  return (
    <>
      {/* 1. Hero */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Sunburst />
        <div className={styles.heroInner}>
          <StevenStretching className={styles.heroSteven} />
          <h1 id="hero-title" className={styles.heroTitle}>
            Stiffn&apos;t
          </h1>
          {/* DRAFT COPY (first half is the app's own onboarding line) */}
          <p className={styles.heroPitch}>Short stretch breaks, with a cat who checks on you.</p>
          <DownloadButton />
        </div>
      </section>

      <div className={styles.page}>
        {/* 2. About */}
        <section className={styles.section} aria-labelledby="about-title">
          <SectionTitle id="about-title">What is Stiffn&apos;t?</SectionTitle>
          {/* DRAFT COPY */}
          <p className={styles.lead}>
            Stiffn&apos;t is a little app that lives in your Mac&apos;s menu bar. Steven, a black cat, reminds you to get
            up and stretch, then watches through the camera to make sure you really did. It&apos;s for anyone who sits
            at a desk all day and forgets to move until their neck says so.
          </p>
        </section>

        {/* Steven's back story */}
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
                    <CoinPill>+ coins</CoinPill>
                  ) : step.sticker ? (
                    <StevenSticker src={step.picture} size={140} alt="" />
                  ) : (
                    <Image src={step.picture!} alt="" width={140} height={140} />
                  )}
                </div>
                <h3 className={styles.stepTitle}>
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className={styles.stepText}>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Features */}
        <div id="features" className={styles.features}>
          <LaserSection layout={laserLayout} />

          <section className={styles.section} aria-labelledby="accessories-title">
            <SectionTitle id="accessories-title">Accessories</SectionTitle>
            {/* DRAFT COPY */}
            <p className={styles.lead}>Steven has a little wardrobe: a crown, glasses and a bow, each one a surprise from a mystery box.</p>
            <AccessoryFan />
          </section>
        </div>

        {/* 5. Get the app */}
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
              <DownloadButton wide />
            </div>
          </Panel>
        </section>
      </div>
    </>
  );
}
