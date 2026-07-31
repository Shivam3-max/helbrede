/* Inline brand name in the logo's two-tone style:
   "Helbrede" in the deep brand blue, "Healthcare" in the bright sky blue.
   Use <BrandName /> for the full name, <BrandName full={false} /> for just "Helbrede". */

export default function BrandName({
  full = true,
  className = "",
}: {
  full?: boolean;
  className?: string;
}) {
  return (
    <span className={className}>
      <span style={{ color: "var(--green)" }}>Helbrede</span>
      {full && (
        <>
          {" "}
          <span style={{ color: "var(--gold)" }}>Healthcare</span>
        </>
      )}
    </span>
  );
}
