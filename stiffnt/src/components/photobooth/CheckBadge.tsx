/** The "chosen" check mark: a greenPrimary500 circle with a white tick and a black outline (so it's not colour alone). */
export function CheckBadge({ className }: { className?: string }) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 999,
        border: "1.5px solid var(--black)",
        background: "var(--green-primary-500)",
        color: "var(--white)",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 6.4 5 8.8l4.6-5.6" />
      </svg>
    </span>
  );
}
