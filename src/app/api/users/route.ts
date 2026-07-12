import { NextRequest, NextResponse } from "next/server";
import { createUser, getUser, listUsers } from "@/lib/db";
import { currentUser, publicUser } from "@/lib/api-auth";

export async function GET() {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  return NextResponse.json({ users: (await listUsers()).map(publicUser) });
}

/** Admin creates a ready-to-use account for anyone — any role, instantly active. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  if (!b.email || !b.password || !b.name || !b.role)
    return NextResponse.json({ error: "Name, email, password and role are required." }, { status: 400 });
  if (await getUser(b.email))
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const created = await createUser({
    email: b.email,
    name: b.name,
    password: b.password,
    phone: b.phone ?? "",
    role: b.role,
    firmName: b.firmName || null,
    drugLicense: b.drugLicense || null,
    gstNumber: b.gstNumber || null,
    medicalRegNo: b.medicalRegNo || null,
    city: b.city || null,
    state: b.state || null,
    status: (b.status as "active" | "pending") || "active",
    isAdmin: !!b.isAdmin,
  });
  return NextResponse.json({ user: publicUser(created) });
}
