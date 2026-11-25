"use client";

import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { ButtonLink, DownloadButton } from "./Button";
import { FocusRing } from "./BrushStroke";
import styles from "./MobileMenu.module.css";

const LINKS = [
  { href: "/", title: "Home" },
  { href: "/photobooth", title: "Photobooth" },
];

type NavProps = { className?: string; vertical?: boolean; onNavigate?: () => void };

/**
 * The page links as the app's sidebar tabs: the open page is "chosen" (dark green brush pill).
 * The path is only known at request time on dynamic pages (/p/<id>), so the highlighted version streams in
 * behind a Suspense boundary; until then the same links show without a highlight.
 */
export function MainNav(props: NavProps) {
  return (
    <Suspense fallback={<NavLinks {...props} pathname={null} />}>
      <CurrentNav {...props} />
    </Suspense>
  );
}

function CurrentNav(props: NavProps) {
  const pathname = usePathname();
  return <NavLinks {...props} pathname={pathname} />;
}

function NavLinks({ className, vertical = false, onNavigate, pathname }: NavProps & { pathname: string | null }) {
  return (
    <nav aria-label="Main" className={className}>
      <ul className={vertical ? styles.listVertical : styles.list}>
        {LINKS.map((link) => {
          const current = pathname === link.href;
          return (
            <li key={link.href}>
              <ButtonLink
                kind="sidebar"
                href={link.href}
                chosen={current}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
                wide={vertical}
                className={vertical ? styles.verticalLink : undefined}
              >
                {link.title}
              </ButtonLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Phones: the nav collapses into a menu button that opens a panel under the header.
 * Keyboard: the button toggles it, Esc closes it and puts focus back on the button, Tab stays inside while open.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) button.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a, button:not([disabled])")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      // Keep Tab inside the menu button + panel while it's open.
      const focusables = [
        button.current,
        ...panel.current.querySelectorAll<HTMLElement>("a, button:not([disabled])"),
      ].filter(Boolean) as HTMLElement[];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) close(false);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  return (
    <div className={styles.root}>
      <button
        ref={button}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <FocusRing />
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" style={{ position: "relative" }}>
          {open ? (
            <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <div ref={panel} id={id} className={styles.panel} hidden={!open}>
        <MainNav vertical onNavigate={() => close(false)} />
        <DownloadButton wide />
      </div>
    </div>
  );
}
