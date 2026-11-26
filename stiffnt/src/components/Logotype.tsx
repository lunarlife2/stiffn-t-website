import styles from "./Logotype.module.css";

/**
 * The "Stiffn't" logotype (public/images/ui/logotype.svg). It is drawn through a mask, so it takes the text colour
 * of wherever it sits (`color`), and its size comes from the `className` width: the height follows the artwork.
 */
export function Logotype({ className, label = "Stiffn't" }: { className?: string; label?: string }) {
  return <span role="img" aria-label={label} className={`${styles.logotype} ${className ?? ""}`} />;
}
