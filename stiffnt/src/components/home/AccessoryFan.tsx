import Image from "next/image";
import { accessories } from "@/config/catalog";
import { placeAccessory, POSE_PICTURES } from "@/lib/accessorySpots";
import { Panel } from "@/components/Panel";
import styles from "./AccessoryFan.module.css";

/**
 * Three accessory cards held like a hand of playing cards: each is a Panel (white, corner 24 as ItemCard,
 * 1.5 black outline, solid 5 shade) with Steven in a different pose wearing the accessory at the app's spot.
 * Hover or keyboard focus lifts a card and brings it to the front (only brings it forward with reduced motion).
 * Each card is a figure: the picture's description is its alt text and the name its caption.
 */
export function AccessoryFan() {
  return (
    <ul className={styles.fan} aria-label="Accessories">
      {accessories.map((item) => {
        const pose = POSE_PICTURES[item.pose];
        const place = placeAccessory(item.pose, item.id);
        return (
          <li key={item.id} className={styles.slot}>
            <Panel as="figure" radius={24} outline={1.5} shade={5} fill="white" className={styles.card} tabIndex={0}>
              <span className={`${styles.picture} steven-outline`} style={{ ["--outline-w" as string]: "2.5px" }}>
                <Image
                  src={pose.src}
                  alt={`${pose.alt}, wearing the ${item.title.toLowerCase()}`}
                  width={270}
                  height={270}
                  sizes="230px"
                  className={styles.steven}
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- placed in % on top of Steven */}
                <img
                  src={item.image.replace("/accessories/", "/accessories/small/")}
                  alt=""
                  width={270}
                  height={270}
                  className={styles.accessory}
                  style={{ left: place.left, top: place.top, width: place.width }}
                />
              </span>
              <figcaption className={styles.name}>{item.title}</figcaption>
            </Panel>
          </li>
        );
      })}
    </ul>
  );
}
