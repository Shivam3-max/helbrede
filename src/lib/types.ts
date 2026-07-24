export type Role = "distributor" | "stockist" | "chemist" | "doctor";

export interface RawProduct {
  sno: number;
  category: string;
  name: string;
  composition: string;
  packing: string;
  mrp: number;
  /** Net distributor rate from the official price list. */
  distributor: number;
}

export interface Product {
  id: string;
  sno: number;
  name: string;
  composition: string;
  packing: string;
  mrp: number;
  category: string; // raw Helbrede category
  group: string; // normalized top-level group
  isRx: boolean;
  scheme: Scheme | null;
  movement: "fast" | "seasonal" | "steady";
  stock: number;
  image: string | null;
  /** Per-role custom trade rates. null = use the global role multiplier. */
  prices: Record<Role, number | null>;
}

export interface Scheme {
  buy: number;
  free: number;
}

export interface Slab {
  min: number;
  max: number | null;
  label: string;
  discount: number; // additional discount on role base price
}

export interface CartItem {
  productId: string;
  qty: number;
}

export type OrderStatus = "Placed" | "Confirmed" | "Dispatched" | "Delivered";

export interface OrderLine {
  productId: string;
  name: string;
  packing: string;
  qty: number;
  freeUnits: number;
  unitPrice: number;
  mrp: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  userEmail: string;
  userName: string;
  role: Role;
  city?: string | null;
  placedAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  gst: number;
  total: number;
  savingsVsMrp: number;
}

export type UserStatus = "active" | "pending" | "rejected";

export interface User {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  firmName?: string;
  drugLicense?: string;
  gstNumber?: string;
  medicalRegNo?: string;
  city?: string;
  state?: string;
  status: UserStatus;
  isAdmin?: boolean;
  createdAt: string;
}
