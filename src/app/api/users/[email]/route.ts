import { NextRequest, NextResponse } from "next/server";
import { deleteUser, getUser, setUserRole, setUserStatus } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/pricing";
import { Role } from "@/lib/types";

type Params = { params: Promise<{ email: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { email } = await params;
  const target = await getUser(decodeURIComponent(email));
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await req.json();

  if (b.role !== undefined) {
    if (!Object.keys(ROLES).includes(b.role))
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    await setUserRole(target.email, b.role as Role);
  }

  if (b.status !== undefined) {
    if (!["active", "pending", "rejected"].includes(b.status))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    if (b.status === "active" && !b.role && !Object.keys(ROLES).includes(target.role))
      return NextResponse.json({ error: "Assign a role before activating this account." }, { status: 400 });
    await setUserStatus(target.email, b.status);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { email } = await params;
  const target = await getUser(decodeURIComponent(email));
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (target.isAdmin)
    return NextResponse.json({ error: "Cannot delete an admin account." }, { status: 400 });
  await deleteUser(target.email);
  return NextResponse.json({ ok: true });
}
