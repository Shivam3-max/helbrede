import { RawProduct, Scheme } from "./types";

/** Normalize Helbrede's 30 raw categories into browsable top-level groups. */
export function groupOf(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("ointment") || c.includes("cream")) return "Ointments & Creams";
  if (c.includes("tablet") || c.includes("capsule")) return "Tablets & Capsules";
  if (c.includes("drop")) return "Drops";
  if (c.includes("syrup") || c.includes("liquid")) return "Syrups & Suspensions";
  if (c.includes("juice") || c.includes("ghutti") || c.includes("balm") || c.includes("oil"))
    return "Ayurvedic Specialties";
  if (c.includes("soap") || c.includes("personal") || c.includes("shampoo") || c.includes("mouth"))
    return "Personal Care & Soaps";
  if (c.includes("lotion") || c.includes("antiseptic") || c.includes("powder") || c.includes("solution"))
    return "Lotions, Powders & Antiseptics";
  if (c.includes("protein") || c.includes("malt")) return "Nutrition & Protein";
  return "Other";
}

export function isRxCategory(category: string): boolean {
  const c = category.toLowerCase();
  return !(
    c.includes("ayurvedic") ||
    c.includes("nutra") ||
    c.includes("neutra") ||
    c.includes("soap") ||
    c.includes("personal") ||
    c.includes("shampoo") ||
    c.includes("mouth") ||
    c.includes("juice") ||
    c.includes("protein") ||
    c.includes("ghutti")
  );
}

/** Deterministic demo enrichment keyed on serial number. */
export function schemeOf(sno: number): Scheme | null {
  if (sno % 9 === 0) return { buy: 10, free: 2 };
  if (sno % 7 === 0) return { buy: 10, free: 1 };
  return null;
}

export function movementOf(sno: number, category: string): "fast" | "seasonal" | "steady" {
  if (category.toLowerCase().includes("cough")) return "seasonal";
  if (sno % 5 === 0) return "fast";
  if (sno % 11 === 0) return "seasonal";
  return "steady";
}

export function slugify(name: string, packing: string, sno: number): string {
  return (
    `${name}-${packing}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${sno}`
  );
}

export function enrichRaw(p: RawProduct) {
  return {
    id: slugify(p.name, p.packing, p.sno),
    sno: p.sno,
    name: p.name.trim(),
    composition: p.composition.trim(),
    packing: p.packing.trim(),
    mrp: parseFloat(p.mrp) || 0,
    category: p.category ?? "Other",
    grp: groupOf(p.category ?? ""),
    isRx: isRxCategory(p.category ?? "") ? 1 : 0,
    schemeBuy: schemeOf(p.sno)?.buy ?? null,
    schemeFree: schemeOf(p.sno)?.free ?? null,
    movement: movementOf(p.sno, p.category ?? ""),
    stock: 500 + ((p.sno * 37) % 1500),
    image: null as string | null,
  };
}
