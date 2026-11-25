import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import styles from "./Art.module.css";

/**
 * Steven with his white sticker outline (StevenOutline.swift): width = max(1.2, size × 0.014) points,
 * drawn as four hard white shadows.
 */
export function StevenSticker({
  src = "/images/steven/steven-front-facing.svg",
  size,
  alt = "Steven, a black cat with big yellow eyes",
  priority,
  className,
  style,
}: {
  src?: string;
  size: number;
  alt?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const outline = Math.max(1.2, size * 0.014);
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={`steven-outline ${className ?? ""}`}
      style={{ ["--outline-w" as string]: `${outline}px`, ...style }}
    />
  );
}

/**
 * The closed mystery box (MysteryBoxArt.swift + HomeView WigglingMysteryBox): the box and its lid as two pictures.
 * Every 2.2 s it wiggles and the lid hops; the lid lifts on hover. Still with reduced motion.
 * Sizes from MysteryBoxArt: lid 258 × 141, box 241 × 169.5 at (13, 87); closed 258 × 256.5.
 */
export function MysteryBox({ width, className }: { width: number | string; className?: string }) {
  return (
    <span className={`${styles.box} ${className ?? ""}`} style={{ width }} aria-hidden="true">
      <span className={styles.boxInner}>
        {/* eslint-disable-next-line @next/next/no-img-element -- two layered pictures, animated with CSS */}
        <img src="/images/mystery-box/mystery-box-base.png" alt="" className={styles.base} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/mystery-box/mystery-box-lid.png" alt="" className={styles.lid} />
      </span>
    </span>
  );
}

/** ShopView `coins`: coin picture + Darumadrop number in yellow400 on a yellow100 capsule. */
export function CoinPill({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <span className={`${styles.coinPill} ${small ? styles.coinPillSmall : ""}`}>
      <Image src="/images/ui/coin.png" alt="" width={26} height={26} className={styles.coin} />
      <span>{children}</span>
    </span>
  );
}

/** Page titles as in the app (HomeView "Dashboard", ShopView "Interaction"): Darumadrop 30, mainGreen. */
export function SectionTitle({
  children,
  id,
  as: Tag = "h2",
  className,
}: {
  children: ReactNode;
  id?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag id={id} className={`${styles.sectionTitle} ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
