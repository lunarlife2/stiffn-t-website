/**
 * What the website shows from the app, copied so it matches:
 * - Laser: Shared/Model/Interaction.swift (InteractionCatalog) and its blurb in UIFeature/Play/PlayMode.swift
 * - Accessories: Shared/Model/Accessories.swift (titles from Accessories.title); each shown on a different pose
 *   of Steven, using that pose's spots (Shared/Model/AccessorySpots.swift)
 */
import type { AccessoryId, Pose } from "@/lib/accessorySpots";

export type Interaction = {
  id: string;
  name: string;
  /** Card picture, public/images/interactions/ */
  image: string;
  /** Preview video, public/videos/ (compressed from the owner's recording) */
  video: string;
  /** Poster frame, public/videos/posters/ */
  poster: string;
  blurb: string;
};

export const laser: Interaction = {
  id: "laser",
  name: "Laser",
  image: "/images/interactions/laser.png",
  video: "/videos/laser.mp4",
  poster: "/videos/posters/laser.jpg",
  blurb: "Your cursor is the laser. The cat chases it.",
};

export type Accessory = { id: AccessoryId; title: string; image: string; pose: Pose };

/** Left to right in the fan. */
export const accessories: Accessory[] = [
  { id: "crown", title: "Crown", image: "/images/accessories/crown.png", pose: "sitting" },
  { id: "glasses", title: "Glasses", image: "/images/accessories/glasses.png", pose: "pickedUp" },
  { id: "bow", title: "Bow", image: "/images/accessories/bow.png", pose: "loafing" },
];

/** Xcode project: MACOSX_DEPLOYMENT_TARGET = 26.6 */
export const minimumMacOS = "26.6";
