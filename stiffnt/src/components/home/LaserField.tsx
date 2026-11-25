import type { LaserTone } from "@/config/layout";
import styles from "./LaserField.module.css";

/**
 * The Laser section's background, instead of the sunburst: the app's sidebar background (UIFeature/Main/MainView.swift SidebarBackground): a gradient from the top left to
 *   the bottom right with the thin looping lines (stroke-sidebar), in one of the app's colour families (`tone`):
 *   green (the sidebar's own: greenPrimary200 → 300), blue (blue100 → 200), yellow (yellow500 → 100),
 *   orange (orange100 → 200)
 * Fills its parent, which must be position: relative and overflow: hidden. Decorative only.
 */
export function LaserField({ tone }: { tone: LaserTone }) {
  return (
    <div className={`${styles.field} ${styles[tone]}`} aria-hidden="true">
      <span className={styles.lines} />
    </div>
  );
}
