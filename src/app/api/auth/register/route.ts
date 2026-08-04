import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser, getUser } from "@/lib/db";
import { publicUser, SESSION_COOKIE } from "@/lib/api-auth";

/**
 * Self-registration is instant: no document is mandatory and no admin
 * approval gate sits in front of it. We create the account, sign the
 * applicant straight in, and hand back the session — same shape as /login.
 */
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.email || !b.password || !b.name || !b.role)
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  if (await getUser(b.email))
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user = await createUser({
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
    turnoverBand: b.turnoverBand || null,
    businessType: b.businessType || null,
    status: "active",
  });

  const token = await createSession(user.email);
  const res = NextResponse.json({ user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
