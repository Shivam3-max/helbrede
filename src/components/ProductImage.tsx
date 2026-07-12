/* eslint-disable @next/next/no-img-element */
/**
 * Product image. Shows the uploaded image when one exists (managed from the
 * admin panel), otherwise an empty placeholder box.
 */
export default function ProductImage({
  src,
  alt = "Product image",
  label = "Product image",
  className = "",
}: {
  src?: string | null;
  alt?: string;
  label?: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`overflow-hidden rounded-xl bg-white ${className}`}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`img-placeholder ${className}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5-9 9" />
      </svg>
      <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}
