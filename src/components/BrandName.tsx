/* Inline brand name in the logo's two-tone style:
   "Helbrede" in the deep brand blue, "Healthcare" in the bright sky blue.
   Use <BrandName /> for the full name, <BrandName full={false} /> for just "Helbrede". */

import type { CSSProperties } from "react";

export default function BrandName({
  full = true,
  className = "",
}: {
  full?: boolean;
  className?: string;
}) {
  // Weight/tracking pinned to match the logo artwork (public/writingstyle.jpg)
  // exactly, regardless of the bolder/tighter styling of surrounding headings.
  const wordmark: CSSProperties = {
    fontWeight: 600,
    letterSpacing: "normal",
  };
  return (
    <span className={className}>
      <span style={{ ...wordmark, color: "var(--green)" }}>Helbrede</span>
      {full && (
        <>
          {" "}
          <span style={{ ...wordmark, color: "var(--gold)" }}>Healthcare</span>
        </>
      )}
    </span>
  );
}
