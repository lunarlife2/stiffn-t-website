import Image from "next/image";
import Link from "next/link";
import { DownloadButton } from "./Button";
import { MainNav, MobileMenu } from "./MobileMenu";
import { FocusRing } from "./BrushStroke";
import styles from "./Header.module.css";

/**
 * Looks like the app's sidebar (UIFeature/Main/MainView.swift): a greenPrimary200 → greenPrimary300 gradient
 * (top left to bottom right), a 1.5 black outline (MainWindow.outline), and tabs in the `.sidebar` button style
 * (the open page is the dark green brush pill).
 */
export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Stiffn't home">
          <FocusRing cornerRadius={12} />
          <Image src="/images/ui/app-icon.png" alt="" width={40} height={40} className={styles.icon} priority />
          <span className={styles.name}>Stiffn&apos;t</span>
        </Link>

        <MainNav className={styles.desktopNav} />

        <div className={styles.desktopDownload}>
          <DownloadButton small />
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
