/* Official Helbrede Healthcare logo lockup (trimmed from the brand artwork,
   transparent background). Height is controlled by the caller via className.
   `full` swaps in the version that includes the "…power for healing" tagline. */

export default function Brand({
  full = false,
  className = "",
}: {
  full?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={full ? "/logo-full.png" : "/logo.png"}
      alt="Helbrede Healthcare"
      width={full ? 434 : 438}
      height={full ? 300 : 240}
      className={`w-auto ${className}`}
    />
  );
}
