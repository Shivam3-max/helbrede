/**
 * Trade designation (chemist/doctor/stockist/distributor) is no longer picked
 * at registration — every self-registered account starts `pending` with no
 * role, and an admin assigns it from the verification queue. Annual turnover
 * (and, within the lowest band, a business-type refinement) are still
 * collected as hints for the admin — they used to drive the role
 * automatically, they no longer do.
 */
export type TurnoverBand = "upto25" | "25to75" | "above75";

export const TURNOVER_BANDS: { id: TurnoverBand; label: string }[] = [
  { id: "upto25", label: "Up to ₹25 Lakh" },
  { id: "25to75", label: "₹25 Lakh – ₹75 Lakh" },
  { id: "above75", label: "Above ₹75 Lakh" },
];

export type BusinessType = "doctor" | "chemist" | "retailer" | "pcd" | "hospital";

export const BUSINESS_TYPES: { id: BusinessType; label: string }[] = [
  { id: "chemist", label: "Chemist / Retail pharmacy" },
  { id: "doctor", label: "Doctor / Clinic" },
  { id: "retailer", label: "Retailer" },
  { id: "pcd", label: "PCD" },
  { id: "hospital", label: "Hospital" },
];

export function businessTypeLabel(id?: BusinessType | string | null): string | null {
  if (!id) return null;
  return BUSINESS_TYPES.find((b) => b.id === id)?.label ?? null;
}
