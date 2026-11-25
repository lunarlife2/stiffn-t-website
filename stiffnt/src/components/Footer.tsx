import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { site, type SocialKey } from "@/config/site";
import { FocusRing } from "./BrushStroke";
import styles from "./Footer.module.css";

/** The year for the copyright line, cached (Cache Components needs `new Date()` inside a cache). */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const ICONS: Record<SocialKey, { label: string; path: string }> = {
  instagram: {
    label: "Stiffn't on Instagram",
    path: "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8Zm5.4-9.9a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
  },
  tiktok: {
    label: "Stiffn't on TikTok",
    path: "M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a8 8 0 0 0 4.6 1.5V6.8a4.6 4.6 0 0 1-4.6-4.6Z",
  },
};

const LINKS = [
  { title: "Home", href: "/" },
  { title: "Features", href: "/#features" },
  { title: "Photobooth", href: "/photobooth" },
];

/**
 * Three columns on desktop, stacked on phones: brand and tagline, links, "Follow us"; then the copyright row.
 * sidebarDeep background, sidebarInk text, black top outline (MainWindow.outline 1.5).
 */
export async function Footer() {
  const year = await currentYear();
  const socials = (Object.keys(ICONS) as SocialKey[]).filter((key) => site.social[key]);

  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.brandColumn}>
          <Link href="/" className={styles.brand} aria-label="Stiffn't home">
            <FocusRing cornerRadius={12} />
            <Image src="/images/ui/app-icon.png" alt="" width={40} height={40} className={styles.icon} />
            <span className={styles.name}>Stiffn&apos;t</span>
          </Link>
          {/* DRAFT COPY */}
          <p className={styles.tagline}>Stretch breaks with a cat who checks on you.</p>
        </div>

        <nav aria-label="Footer" className={styles.linksColumn}>
          <ul className={styles.links}>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>
                  <FocusRing cornerRadius={6} />
                  {link.title}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.downloadUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                <FocusRing cornerRadius={6} />
                Download
                <span className="sr-only"> (TestFlight beta, opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>

        {socials.length > 0 && (
          <div className={styles.followColumn}>
            <h2 className={styles.followTitle}>Follow us</h2>
            <ul className={styles.socials}>
              {socials.map((key) => (
                <li key={key}>
                  <a href={site.social[key]} target="_blank" rel="noopener noreferrer" className={styles.social} aria-label={ICONS[key].label}>
                    <FocusRing />
                    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d={ICONS[key].path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        <p>
          © {year} {site.studio}. All rights reserved.
        </p>
        <p>Made with love by {site.studio}</p>
      </div>
    </footer>
  );
}
