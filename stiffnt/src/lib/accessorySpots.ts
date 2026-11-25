/**
 * Where an accessory sits on Steven, ported from Shared/Model/AccessorySpots.swift and
 * UIFeature/Component/StevenAccessory.swift, for the three poses the website shows.
 * Every pose's canvas is 270 × 270 points (AccessorySpots.sitting / .pickedUp / .loafing).
 */

type Rect = { x: number; y: number; width: number; height: number };
type Spot = { x: number; y: number; width: number };

export type AccessoryId = "crown" | "glasses" | "bow";
export type Pose = "sitting" | "pickedUp" | "loafing";

const CANVAS = 270;

/** AccessoryKind.picture: the picture's size and where the accessory itself is in it. */
const PICTURES: Record<AccessoryId, { size: number; content: Rect }> = {
  crown: { size: 540, content: { x: 40, y: 29, width: 460, height: 458 } },
  glasses: { size: 540, content: { x: 40, y: 154, width: 460, height: 233 } },
  bow: { size: 540, content: { x: 28, y: 107, width: 485, height: 326 } },
};

/** AccessorySpots.sitting / .pickedUp / .loafing */
const SPOTS: Record<Pose, Record<AccessoryId, Spot>> = {
  sitting: {
    crown: { x: 84, y: 24, width: 56 },
    glasses: { x: 82, y: 105, width: 132 },
    bow: { x: 90, y: 143, width: 58 },
  },
  pickedUp: {
    crown: { x: 143, y: 28, width: 56 },
    glasses: { x: 143, y: 91, width: 132 },
    bow: { x: 136, y: 136, width: 58 },
  },
  loafing: {
    crown: { x: 85, y: 75, width: 56 },
    glasses: { x: 82, y: 154, width: 130 },
    bow: { x: 85, y: 204, width: 54 },
  },
};

/** The pose pictures (copied from the app; the sitting one is its 8 layers stacked into one picture). */
export const POSE_PICTURES: Record<Pose, { src: string; alt: string }> = {
  sitting: { src: "/images/steven/steven-sitting.png", alt: "Steven sitting" },
  pickedUp: { src: "/images/steven/steven-picked-up.png", alt: "Steven, picked up by the scruff" },
  loafing: { src: "/images/steven/steven-loafing.png", alt: "Steven asleep in a loaf" },
};

/**
 * The accessory picture's box on Steven's picture, as percentages (for CSS left/top/width).
 * Same maths as StevenAccessory: the picture is scaled so the accessory itself is `spot.width` wide, and the
 * accessory's middle goes on the spot.
 */
export function placeAccessory(pose: Pose, id: AccessoryId) {
  const { size, content } = PICTURES[id];
  const spot = SPOTS[pose][id];
  const picture = size * (spot.width / content.width);
  const middle = { x: (content.x + content.width / 2) / size, y: (content.y + content.height / 2) / size };
  const pct = (n: number) => `${(n / CANVAS) * 100}%`;
  return {
    left: pct(spot.x - middle.x * picture),
    top: pct(spot.y - middle.y * picture),
    width: pct(picture),
  };
}
