import type { ReactNode } from "react";

/**
 * The Shop's "Active" capsule (UIFeature/Shop/ShopView.swift ActiveBadge): greenPrimary500 fill, white text,
 * system 13 medium, padding 10 × 3.
 */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        borderRadius: 999,
        fontFamily: "var(--family-text)",
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        background: "var(--green-primary-500)",
        color: "var(--white)",
        fontSize: "calc(13px * var(--type-scale))",
        fontWeight: 500,
        padding: "3px 10px",
      }}
    >
      {children}
    </span>
  );
}
