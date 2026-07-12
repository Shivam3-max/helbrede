import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { put, del } from "@vercel/blob";
import { getProduct, setProductImage } from "@/lib/db";
import { currentUser } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

async function removeExisting(image: string | null) {
  if (!image) return;
  if (image.startsWith("http")) {
    // hosted on Vercel Blob
    try {
      await del(image);
    } catch {
      /* ignore */
    }
  } else {
    const p = path.join(process.cwd(), "public", image);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024)
    return NextResponse.json({ error: "Image must be under 8 MB." }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext)
    return NextResponse.json({ error: "Only JPG, PNG, WEBP or GIF images allowed." }, { status: 400 });

  await removeExisting(product.image);

  const filename = `products/${id}-${Date.now()}${ext}`;
  let url: string;

  if (useBlob) {
    const blob = await put(filename, file, { access: "public", contentType: file.type });
    url = blob.url;
  } else {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const localName = `${id}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, localName), buffer);
    url = `/uploads/${localName}`;
  }

  await setProductImage(id, url);
  return NextResponse.json({ image: url });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await removeExisting(product.image);
  await setProductImage(id, null);
  return NextResponse.json({ ok: true });
}
