import { Role } from "./types";

/**
 * Registration is organized around annual turnover, not trade designation —
 * the designation (chemist/doctor/stockist/…) is derived from the turnover
 * band the applicant picks, plus a business-type refinement inside the
 * lowest band. This keeps the "I am a…" grid off the top of the register form.
 */
export type TurnoverBand = "upto25" | "25to75" | "above75";

export type BusinessType = "doctor" | "chemist" | "retailer" | "pcd" | "hospital";

export const TURNOVER_BANDS: { id: TurnoverBand; label: string; hint: string }[] = [
  { id: "upto25", label: "Up to ₹25 Lakh", hint: "Doctor · Chemist · Retailer · PCD · Hospital" },
  { id: "25to75", label: "₹25 Lakh – ₹75 Lakh", hint: "Stockist" },
  { id: "above75", label: "Above ₹75 Lakh", hint: "Distributor" },
];

export const BUSINESS_TYPES: { id: BusinessType; label: string }[] = [
  { id: "chemist", label: "Chemist / Retail pharmacy" },
  { id: "doctor", label: "Doctor / Clinic" },
  { id: "retailer", label: "Retailer" },
  { id: "pcd", label: "PCD" },
  { id: "hospital", label: "Hospital" },
];

/** Turnover band (+ business type, for the lowest band) → pricing role. */
export function roleForRegistration(band: TurnoverBand, businessType?: BusinessType | null): Role {
  if (band === "25to75") return "stockist";
  if (band === "above75") return "distributor";
  return businessType === "doctor" ? "doctor" : "chemist";
}

export function businessTypeLabel(id?: BusinessType | string | null): string | null {
  if (!id) return null;
  return BUSINESS_TYPES.find((b) => b.id === id)?.label ?? null;
}
