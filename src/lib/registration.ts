/**
 * Trade designation (chemist/doctor/stockist/distributor) is no longer picked
 * at registration — every self-registered account starts `pending` with no
 * role, and an admin assigns it from the verification queue. `BUSINESS_TYPES`
 * / `businessTypeLabel` are kept only to render the label on older accounts
 * that still carry a `businessType` value from before this change.
 */
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
