/**
 * Which layout the Home page's Laser section uses. Compare all three at /laser-options, then set one here.
 * - "popup": the app's "Laser Is Active!" popup (laser art, black line, words)
 * - "stage": words centered, then the video wide
 * - "band":  a full-width laser band, video and words side by side
 */
export type LaserLayout = "popup" | "stage" | "band";

export const laserLayout: LaserLayout = "band";

/**
 * The colour behind the Laser video (the app's sidebar background, recoloured). Compare them at /laser-options.
 * - "green": the app's sidebar (greenPrimary200 → 300); blends with the green desktop in the recording
 * - "blue": blue100 → blue200
 * - "yellow": yellow500 → yellow100
 * - "orange": orange100 → orange200
 */
export type LaserTone = "green" | "blue" | "yellow" | "orange";

export const laserTone: LaserTone = "yellow";
