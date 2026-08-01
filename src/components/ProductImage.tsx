/* eslint-disable @next/next/no-img-element */
import { sampleImageForGroup } from "@/lib/product-images";

/**
 * Product image. Renders uploaded images as well as catalog sample artwork
 * used when a product does not yet have a custom image.
 */
const FALLBACK_IMAGE = sampleImageForGroup("Other");

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
  return (
    <div className={`overflow-hidden rounded-xl bg-white ${className}`}>
      <img src={src || FALLBACK_IMAGE} alt={alt || label} className="h-full w-full object-cover" />
    </div>
  );
}
