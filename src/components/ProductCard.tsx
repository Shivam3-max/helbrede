"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { basePrice, marginPct } from "@/lib/pricing";
import { inr } from "@/lib/format";
import { sampleImageForProduct } from "@/lib/product-images";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const price = user && !user.isAdmin ? basePrice(product, user.role) : null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="card card-hover flex flex-col overflow-hidden p-3"
    >
      <div className="relative">
        <ProductImage src={sampleImageForProduct(product)} alt={product.name} className="aspect-[4/3] w-full" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {product.isRx && <span className="chip badge-steel !px-2 !py-0.5 !text-[10px]">Rx</span>}
          {product.movement === "fast" && (
            <span className="chip badge-green !px-2 !py-0.5 !text-[10px]">Fast mover</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">
          {product.category} · {product.packing}
        </p>
        <h3 className="mt-1 font-display text-[15.5px] font-bold leading-snug">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-graphite">
          {product.composition}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          {price ? (
            <div>
              {product.mrp > price && (
                <p className="text-[11px] text-graphite">
                  MRP <span className="line-through">{inr(product.mrp)}</span>
                </p>
              )}
              <p className="font-display text-lg font-black" style={{ color: "var(--green)" }}>
                {inr(price)}
                <span className="ml-1 text-[11px] font-semibold text-graphite">/unit</span>
              </p>
              <p className="text-[11px] font-semibold" style={{ color: "var(--gold)" }}>
                {product.mrp > price ? `${marginPct(product.mrp, price)}% margin at MRP` : "Your trade rate"}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-display text-lg font-black">
                {product.mrp > 0 ? inr(product.mrp) : "—"}
              </p>
              <p className="text-[11px] font-semibold text-graphite">
                {product.mrp > 0 ? "MRP · " : ""}
                <span style={{ color: "var(--green)" }}>Login for your trade price</span>
              </p>
            </div>
          )}
          <span className="btn-ghost !px-3.5 !py-1.5 !text-[12px]">View</span>
        </div>
      </div>
    </Link>
  );
}
