import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";
import { parseRolePrices } from "../role-prices";

export async function GET() {
  return NextResponse.json({ products: await listProducts() });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  if (!b.name || !b.packing || !(parseFloat(b.mrp) > 0))
    return NextResponse.json({ error: "Name, packing and a valid MRP are required." }, { status: 400 });
  const prices = parseRolePrices(b, parseFloat(b.mrp));
  if ("error" in prices) return NextResponse.json({ error: prices.error }, { status: 400 });
  const product = await createProduct({
    name: String(b.name).trim(),
    composition: String(b.composition ?? "").trim(),
    packing: String(b.packing).trim(),
    mrp: parseFloat(b.mrp),
    category: String(b.category ?? "Other").trim() || "Other",
    isRx: !!b.isRx,
    schemeBuy: b.schemeBuy ? parseInt(b.schemeBuy) : null,
    schemeFree: b.schemeFree ? parseInt(b.schemeFree) : null,
    stock: parseInt(b.stock) || 0,
    ...prices,
  });
  return NextResponse.json({ product });
}
