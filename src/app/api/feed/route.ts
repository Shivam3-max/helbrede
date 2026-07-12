import { NextResponse } from "next/server";
import { recentOrdersForFeed } from "@/lib/db";

/** Anonymized recent order activity for the live feed & map. */
export async function GET() {
  return NextResponse.json({ events: await recentOrdersForFeed(20) });
}
