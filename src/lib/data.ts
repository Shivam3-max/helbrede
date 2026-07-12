import { Product } from "./types";

/** Distinct top-level groups present in a product list. */
export function groupsOf(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.group))).sort();
}

/** Distinct raw categories present in a product list. */
export function categoriesOf(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.category))).sort();
}

/** Products sharing at least one salt keyword with the given product. */
export function substitutesIn(products: Product[], product: Product): Product[] {
  const words = product.composition
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 6);
  if (!words.length) return [];
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.name !== product.name &&
        words.some((w) => p.composition.toLowerCase().includes(w))
    )
    .slice(0, 6);
}
