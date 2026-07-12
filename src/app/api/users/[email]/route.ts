import { NextRequest, NextResponse } from "next/server";
import { deleteUser, getUser, setUserStatus } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";

type Params = { params: Promise<{ email: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { email } = await params;
  const target = getUser(decodeURIComponent(email));
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await req.json();
  if (!["active", "pending", "rejected"].includes(b.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  setUserStatus(target.email, b.status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { email } = await params;
  const target = getUser(decodeURIComponent(email));
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (target.isAdmin)
    return NextResponse.json({ error: "Cannot delete an admin account." }, { status: 400 });
  deleteUser(target.email);
  return NextResponse.json({ ok: true });
}
