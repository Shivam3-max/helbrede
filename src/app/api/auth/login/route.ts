import { NextRequest, NextResponse } from "next/server";
import { createSession, getUser } from "@/lib/db";
import { publicUser, SESSION_COOKIE } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = getUser(String(email ?? ""));
  if (!user || user.password !== String(password ?? ""))
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  if (user.status === "pending")
    return NextResponse.json(
      { error: "Your account is under verification. You'll get access once our team approves your license details." },
      { status: 403 }
    );
  if (user.status === "rejected")
    return NextResponse.json({ error: "This account application was declined. Contact support." }, { status: 403 });

  const token = createSession(user.email);
  const res = NextResponse.json({ user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
