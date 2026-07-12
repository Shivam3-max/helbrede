import { NextRequest, NextResponse } from "next/server";
import { setOrderStatus } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  if (!["Placed", "Confirmed", "Dispatched", "Delivered"].includes(b.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  setOrderStatus(id, b.status);
  return NextResponse.json({ ok: true });
}
