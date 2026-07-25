import { Role, Scheme } from "./types";

/**
 * Flat role-based pricing. Each product carries an explicit net rate per role,
 * derived from the official distributor price list:
 *   distributor = list rate · stockist = +20% · chemist = +20% more · doctor = chemist.
 * `multiplier` is only a fallback for products added without explicit rates.
 */
export const ROLES: Record<
  Role,
  { label: string; multiplier: number; moq: number; blurb: string }
> = {
  distributor: {
    label: "Distributor",
    multiplier: 0.55,
    moq: 0,
    blurb: "Net distributor rates for territory-level distribution",
  },
  stockist: {
    label: "Stockist",
    multiplier: 0.66,
    moq: 0,
    blurb: "Wholesale rates for stock-and-supply operations",
  },
  chemist: {
    label: "Chemist / Retailer",
    multiplier: 0.79,
    moq: 0,
    blurb: "Retailer trade rates with healthy counter margins",
  },
  doctor: {
    label: "Doctor / Clinic",
    multiplier: 0.79,
    moq: 0,
    blurb: "Dispensing rates for clinics and practitioners",
  },
};

export const GST_RATE = 0.12;

/** Minimal shape the pricing engine needs — a full Product always satisfies it. */
export interface Priceable {
  mrp: number;
  prices?: Partial<Record<Role, number | null>>;
}

/**
 * Flat unit price for a role.
 * Resolution: product's explicit rate for the role → MRP × fallback multiplier.
 */
export function basePrice(p: Priceable, role: Role): number {
  const explicit = p.prices?.[role];
  return round2(explicit != null && explicit > 0 ? explicit : p.mrp * ROLES[role].multiplier);
}

/** Unit price for a role. Quantity has no effect under flat pricing. */
export function unitPrice(p: Priceable, role: Role, _qty?: number): number {
  return basePrice(p, role);
}

/** Free units earned under a bonus scheme, trade style (e.g. 10+2). */
export function freeUnits(scheme: Scheme | null, qty: number): number {
  if (!scheme) return 0;
  return Math.floor(qty / scheme.buy) * scheme.free;
}

/** Margin % a buyer makes selling at MRP after buying at their price. */
export function marginPct(mrp: number, buyPrice: number): number {
  if (mrp <= 0) return 0;
  return round2(((mrp - buyPrice) / mrp) * 100);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
