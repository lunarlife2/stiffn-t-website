import type { CSSProperties, ElementType, ReactNode } from "react";

type PanelProps = {
  /** Panel.swift stiffntPanel defaults: corner 15, outline 1, shade 5. */
  radius?: number;
  outline?: number;
  /** The solid black shade, down and to the right, no blur. 0 = none. */
  shade?: number;
  /** Cream (appBackground, the app's panel) or white (cards, Shop). */
  fill?: "cream" | "white" | "yellow";
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>;

const FILLS = {
  cream: "var(--app-background)",
  white: "var(--white)",
  yellow: "var(--yellow-500)",
};

/**
 * The design's box (Panel.swift `stiffntPanel`): a fill, a black outline, and a solid black shade offset down
 * and to the right. The content is clipped to the rounded shape, so pictures that reach the edge keep the outline.
 * Presets used in the app:
 * - options box: radius 15, outline 1, shade 5 (default)
 * - popups (MysteryCanView, StreakView, BoughtPopup): radius 24, outline 2, shade 5
 * - Shop duration panel: radius 24, outline 2, shade 4, white
 */
export function Panel({
  radius = 15,
  outline = 1,
  shade = 5,
  fill = "cream",
  as: Tag = "div",
  className,
  style,
  children,
  ...rest
}: PanelProps) {
  return (
    <Tag
      className={className}
      style={{
        position: "relative",
        background: FILLS[fill],
        borderRadius: radius,
        border: `${outline}px solid var(--black)`,
        boxShadow: shade ? `${shade}px ${shade}px 0 0 var(--black)` : undefined,
        overflow: "clip",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * StiffntCard.swift (StiffntCardStyle): a title above a cream box with a 1.5 outline, corner 16, padding 16.
 * No shade: the app's cards sit flat.
 */
export function Card({
  title,
  children,
  className,
  headingLevel = 3,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as ElementType;
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {title && (
        <Heading
          style={{
            fontFamily: "var(--family-text)",
            fontSize: "var(--type-title2)",
            fontWeight: 600,
            color: "var(--black)",
            paddingLeft: 4,
            margin: 0,
          }}
        >
          {title}
        </Heading>
      )}
      <div
        style={{
          padding: 16,
          background: "var(--app-background)",
          borderRadius: "var(--card-radius)",
          border: "var(--card-outline) solid var(--black)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
