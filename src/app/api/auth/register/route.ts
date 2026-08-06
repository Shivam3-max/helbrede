import { NextRequest, NextResponse } from "next/server";
import { createUser, getUser } from "@/lib/db";

/**
 * Self-registration no longer determines the trade role automatically —
 * every new account starts `pending` with an empty role, and an admin
 * assigns the actual role (distributor/stockist/chemist/doctor) when
 * approving it from the verification queue. `turnoverBand` (annual
 * turnover picked at registration) and `businessType` ("what best
 * describes you", collected within the lowest turnover band) are still
 * gathered as hints for the admin — neither determines the role by itself.
 * No session is created here since a pending account can't log in yet.
 */
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.email || !b.password || !b.name)
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  if (await getUser(b.email))
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  await createUser({
    email: b.email,
    name: b.name,
    password: b.password,
    phone: b.phone ?? "",
    role: "",
    firmName: b.firmName || null,
    drugLicense: b.drugLicense || null,
    gstNumber: b.gstNumber || null,
    medicalRegNo: b.medicalRegNo || null,
    city: b.city || null,
    state: b.state || null,
    turnoverBand: b.turnoverBand || null,
    businessType: b.businessType || null,
    status: "pending",
  });

  return NextResponse.json({ ok: true, pending: true });
}
