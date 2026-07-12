import { Product, Role, Scheme, Slab } from "./types";

export const ROLES: Record<
  Role,
  { label: string; multiplier: number; moq: number; blurb: string }
> = {
  distributor: {
    label: "Distributor",
    multiplier: 0.55,
    moq: 20,
    blurb: "Deepest trade rates for territory-level distribution",
  },
  stockist: {
    label: "Stockist",
    multiplier: 0.62,
    moq: 10,
    blurb: "Wholesale rates for stock-and-supply operations",
  },
  chemist: {
    label: "Chemist / Retailer",
    multiplier: 0.72,
    moq: 5,
    blurb: "Retailer trade rates with healthy counter margins",
  },
  doctor: {
    label: "Doctor / Clinic",
    multiplier: 0.8,
    moq: 1,
    blurb: "Dispensing rates for clinics and practitioners",
  },
};

export const SLABS: Slab[] = [
  { min: 1, max: 49, label: "1 – 49 units", discount: 0 },
  { min: 50, max: 199, label: "50 – 199 units", discount: 0.05 },
  { min: 200, max: 499, label: "200 – 499 units", discount: 0.1 },
  { min: 500, max: null, label: "500+ units", discount: 0.16 },
];

export const GST_RATE = 0.12;

export function slabFor(qty: number): Slab {
  let current = SLABS[0];
  for (const s of SLABS) if (qty >= s.min) current = s;
  return current;
}

export function nextSlab(qty: number): Slab | null {
  for (const s of SLABS) if (qty < s.min) return s;
  return null;
}

/** Minimal shape the pricing engine needs — a full Product always satisfies it. */
export interface Priceable {
  mrp: number;
  prices?: Partial<Record<Role, number | null>>;
}

/**
 * Base (slab-0) unit price for a role.
 * Resolution: product's custom rate for the role → MRP × global role multiplier.
 */
export function basePrice(p: Priceable, role: Role): number {
  const custom = p.prices?.[role];
  return round2(custom != null && custom > 0 ? custom : p.mrp * ROLES[role].multiplier);
}

/** Live unit price for a role at a given quantity. */
export function unitPrice(p: Priceable, role: Role, qty: number): number {
  return round2(basePrice(p, role) * (1 - slabFor(qty).discount));
}

/** Full slab ladder for a product + role, for display tables. */
export function ladder(p: Priceable, role: Role) {
  return SLABS.map((s) => ({
    ...s,
    price: round2(basePrice(p, role) * (1 - s.discount)),
  }));
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
