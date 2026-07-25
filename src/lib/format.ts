export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function inr0(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/**
 * For strip/box packs like "20X10" or "20X4X10", returns a human breakdown:
 * last number = strips per box, product of the rest = units per strip.
 * Returns null for simple packs (e.g. "30GM", "100 ML").
 */
export function packSummary(packing: string): string | null {
  const m = packing.match(/^\s*(\d+(?:\s*[xX]\s*\d+)+)/);
  if (!m) return null;
  const nums = (m[1].match(/\d+/g) ?? []).map(Number);
  if (nums.length < 2) return null;
  const stripsPerBox = nums[nums.length - 1];
  const perStrip = nums.slice(0, -1).reduce((a, b) => a * b, 1);
  const total = perStrip * stripsPerBox;
  return `Box of ${stripsPerBox} strips × ${perStrip} = ${total} units`;
}

export function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
