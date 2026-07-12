import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getProduct, setProductImage } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024)
    return NextResponse.json({ error: "Image must be under 8 MB." }, { status: 400 });

  const extMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const ext = extMap[file.type];
  if (!ext)
    return NextResponse.json({ error: "Only JPG, PNG, WEBP or GIF images allowed." }, { status: 400 });

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // remove old image if any
  if (product.image) {
    const old = path.join(process.cwd(), "public", product.image);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  const filename = `${id}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  const url = `/uploads/${filename}`;
  setProductImage(id, url);
  return NextResponse.json({ image: url });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (product.image) {
    const p = path.join(process.cwd(), "public", product.image);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  setProductImage(id, null);
  return NextResponse.json({ ok: true });
}
