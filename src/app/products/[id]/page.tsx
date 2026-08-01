import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, listProducts } from "@/lib/db";
import { substitutesIn } from "@/lib/data";
import ProductDetail from "./ProductDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  return {
    title: product ? `${product.name} (${product.packing})` : "Product Not Found",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const subs = substitutesIn(await listProducts(), product);
  return <ProductDetail product={product} subs={subs} />;
}
