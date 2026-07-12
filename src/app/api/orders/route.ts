import { NextRequest, NextResponse } from "next/server";
import { getProduct, insertOrder, listOrders } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";
import { freeUnits, GST_RATE, round2, unitPrice } from "@/lib/pricing";
import { Order } from "@/lib/types";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const orders = user.isAdmin ? await listOrders() : await listOrders(user.email);
  return NextResponse.json({ orders });
}

/** Places an order. Prices are computed server-side from the live catalog. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || user.isAdmin)
    return NextResponse.json({ error: "Login with a buyer account to order." }, { status: 401 });

  const b = await req.json();
  const items: { productId: string; qty: number }[] = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

  const lines = [];
  for (const i of items) {
    const p = await getProduct(i.productId);
    const qty = Math.max(1, parseInt(String(i.qty)) || 0);
    if (!p) continue;
    if (p.isRx && !user.drugLicense && !user.medicalRegNo)
      return NextResponse.json(
        { error: `${p.name} is a prescription product — license-verified accounts only.` },
        { status: 403 }
      );
    const price = unitPrice(p, user.role, qty);
    lines.push({
      productId: p.id,
      name: p.name,
      packing: p.packing,
      qty,
      freeUnits: freeUnits(p.scheme, qty),
      unitPrice: price,
      mrp: p.mrp,
      lineTotal: round2(price * qty),
    });
  }
  if (!lines.length) return NextResponse.json({ error: "No valid products in cart." }, { status: 400 });

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const gst = round2(subtotal * GST_RATE);
  const mrpTotal = lines.reduce((s, l) => s + l.mrp * l.qty, 0);
  const order: Order = {
    id: "HB" + Date.now().toString(36).toUpperCase(),
    userEmail: user.email,
    userName: user.firmName || user.name,
    role: user.role,
    city: user.city ?? null,
    placedAt: new Date().toISOString(),
    status: "Placed",
    lines,
    subtotal,
    gst,
    total: round2(subtotal + gst),
    savingsVsMrp: round2(mrpTotal - subtotal),
  };
  await insertOrder(order);
  return NextResponse.json({ order });
}
