import { NextRequest, NextResponse } from "next/server";
import { insertLead, listLeads } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";

export async function GET() {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  return NextResponse.json({ leads: await listLeads() });
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.name || !b.kind)
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const lead = await insertLead({
    kind: String(b.kind),
    name: String(b.name).trim(),
    phone: b.phone ? String(b.phone).trim() : null,
    city: b.city ? String(b.city).trim() : null,
    goal: b.goal ? String(b.goal).trim() : null,
    budget: b.budget ? parseFloat(b.budget) : null,
    note: b.note ? String(b.note).trim() : null,
  });
  return NextResponse.json({ ok: true, id: lead.id });
}
