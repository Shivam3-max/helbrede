import { notFound } from "next/navigation";
import { getProduct, listProducts } from "@/lib/db";
import { substitutesIn } from "@/lib/data";
import ProductDetail from "./ProductDetail";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  const subs = substitutesIn(listProducts(), product);
  return <ProductDetail product={product} subs={subs} />;
}
