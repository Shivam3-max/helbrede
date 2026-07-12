import { ROLES } from "@/lib/pricing";

interface RolePriceFields {
  priceDistributor: number | null;
  priceStockist: number | null;
  priceChemist: number | null;
  priceDoctor: number | null;
}

/**
 * Parses optional per-role trade rates from a request body.
 * Empty/absent = null (fall back to global multiplier). Each rate must be
 * a positive number below MRP.
 */
export function parseRolePrices(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  mrp: number
): RolePriceFields | { error: string } {
  const fields = [
    ["priceDistributor", "distributor"],
    ["priceStockist", "stockist"],
    ["priceChemist", "chemist"],
    ["priceDoctor", "doctor"],
  ] as const;

  const out = {} as RolePriceFields;
  for (const [field, role] of fields) {
    const raw = body[field];
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      out[field] = null;
      continue;
    }
    const n = parseFloat(String(raw));
    if (!(n > 0))
      return { error: `${ROLES[role].label} rate must be a positive number.` };
    if (n >= mrp)
      return { error: `${ROLES[role].label} rate (₹${n}) must be below MRP (₹${mrp}).` };
    out[field] = Math.round(n * 100) / 100;
  }
  return out;
}
