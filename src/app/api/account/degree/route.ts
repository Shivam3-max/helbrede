import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { setUserDegree } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";

/**
 * Optional post-registration upload — a doctor's degree/qualification.
 * Never blocks registration or login; the applicant is already signed in
 * by the time this runs.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "degrees");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024)
    return NextResponse.json({ error: "File must be under 8 MB." }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext)
    return NextResponse.json({ error: "Only JPG, PNG, WEBP or PDF allowed." }, { status: 400 });

  const filename = `degrees/${user.email.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}${ext}`;
  let url: string;

  if (useBlob) {
    const blob = await put(filename, file, { access: "public", contentType: file.type });
    url = blob.url;
  } else {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const localName = `${user.email.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, localName), buffer);
    url = `/uploads/degrees/${localName}`;
  }

  await setUserDegree(user.email, url);
  return NextResponse.json({ degreeUrl: url });
}
