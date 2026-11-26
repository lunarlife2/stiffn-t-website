import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { BrushStroke, FocusRing } from "./BrushStroke";
import { site } from "@/config/site";
import styles from "./Button.module.css";

export type ButtonKind =
  | "primary"
  | "secondary"
  | "tertiary"
  | "underlined"
  | "neutral"
  | "destructive"
  | "positive"
  | "warning"
  | "sidebar";

type Common = {
  kind?: ButtonKind;
  small?: boolean;
  /** Website-only: 4/3 of the normal size, for the main Download buttons. */
  large?: boolean;
  /** Website-only: the light version of a primary button (cream fill, dark green text), for use on the green hero. */
  light?: boolean;
  wide?: boolean;
  /** Shown pressed while it's the chosen one (StiffntButtonStyle.isChosen). */
  chosen?: boolean;
  children: ReactNode;
  className?: string;
};

const FILLED: ButtonKind[] = ["primary", "neutral", "destructive", "positive", "warning", "sidebar"];

/** The capsule's rough edges, as in Button.swift: a fill stroke (3, small 2) or an outline stroke (3.5, small 2.5). */
function Strokes({ kind, small }: { kind: ButtonKind; small?: boolean }) {
  return (
    <>
      {FILLED.includes(kind) && (
        <BrushStroke cornerRadius={999} lineWidth={small ? 2 : 3} seed={3} color="var(--fill)" />
      )}
      {kind === "secondary" && (
        <>
          <BrushStroke
            className="secondary-stroke"
            cornerRadius={999}
            lineWidth={small ? 2.5 : 3.5}
            seed={3}
            color="var(--outline)"
          />
          <span className={`${styles.thinOutline} secondary-thin`} aria-hidden="true" />
        </>
      )}
      <FocusRing />
    </>
  );
}

function Label({ kind, small, children }: { kind: ButtonKind; small?: boolean; children: ReactNode }) {
  return (
    <span className={styles.label}>
      {children}
      {kind === "underlined" && (
        <span className={styles.underline} aria-hidden="true">
          <BrushStroke cornerRadius={999} lineWidth={small ? 1 : 1.5} seed={5} color="var(--text)" />
        </span>
      )}
    </span>
  );
}

function classes({ kind = "primary", small, large, light, wide, chosen, className }: Omit<Common, "children">) {
  return [
    styles.button,
    styles[kind],
    small && styles.small,
    large && styles.large,
    light && styles.light,
    wide && styles.wide,
    chosen && styles.chosen,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  kind = "primary",
  small,
  wide,
  chosen,
  className,
  children,
  type = "button",
  ...rest
}: Common & Omit<ComponentProps<"button">, "children">) {
  return (
    <button type={type} className={classes({ kind, small, wide, chosen, className })} {...rest}>
      <Strokes kind={kind} small={small} />
      <Label kind={kind} small={small}>
        {children}
      </Label>
    </button>
  );
}

export function ButtonLink({
  kind = "primary",
  small,
  large,
  light,
  wide,
  chosen,
  className,
  children,
  href,
  ...rest
}: Common & { href: string } & Omit<ComponentProps<"a">, "children" | "href">) {
  const external = /^https?:/.test(href);
  const plain = external || /^(blob|data):/.test(href) || rest.download !== undefined;
  const props = { className: classes({ kind, small, large, light, wide, chosen, className }), ...rest };
  const inner = (
    <>
      <Strokes kind={kind} small={small} />
      <Label kind={kind} small={small}>
        {children}
      </Label>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {inner}
      </a>
    );
  }
  return plain ? (
    <a href={href} {...props}>
      {inner}
    </a>
  ) : (
    <Link href={href} {...props}>
      {inner}
    </Link>
  );
}

/**
 * "Download for Mac" with "Beta via TestFlight" under it. Links to site.downloadUrl in a new tab.
 */
export function DownloadButton({
  small,
  large,
  light,
  wide,
  className,
}: {
  small?: boolean;
  large?: boolean;
  light?: boolean;
  wide?: boolean;
  className?: string;
}) {
  return (
    <ButtonLink kind="primary" small={small} large={large} light={light} wide={wide} className={className} href={site.downloadUrl}>
      <span className={styles.stack}>
        <span>Download for Mac</span>
        <span className={styles.subline}>Beta via TestFlight</span>
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </ButtonLink>
  );
}
