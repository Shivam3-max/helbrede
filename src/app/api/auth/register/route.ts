import { NextRequest, NextResponse } from "next/server";
import { createUser, getUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.email || !b.password || !b.name || !b.role)
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  if (await getUser(b.email))
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  await createUser({
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
    status: "pending",
  });
  return NextResponse.json({ ok: true });
}
