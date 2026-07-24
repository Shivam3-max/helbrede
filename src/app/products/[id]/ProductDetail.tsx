"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";
import { inr } from "@/lib/format";
import { basePrice, GST_RATE, marginPct, ROLES, round2 } from "@/lib/pricing";
import { Product } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function ProductDetail({
  product,
  subs,
}: {
  product: Product;
  subs: Product[];
}) {
  const { user } = useAuth();
  const { add } = useCart();
  const router = useRouter();
  const role = user && !user.isAdmin ? user.role : null;
  const moq = role ? ROLES[role].moq : 1;
  const [qty, setQty] = useState(Math.max(moq, 10));
  const [added, setAdded] = useState(false);
  const price = role ? basePrice(product, role) : null;
  const showMrp = price != null && product.mrp > price;

  const canBuy = role && (!product.isRx || user?.drugLicense || user?.medicalRegNo);

  return (
    <>
      <section className="border-b border-line bg-paper py-8">
        <div className="container-x text-[13px] font-semibold text-graphite">
          <Link href="/products" className="hover:text-ink">
            Catalog
          </Link>{" "}
          / {product.group} / <span className="text-ink">{product.name}</span>
        </div>
      </section>

      <section className="py-10">
        <div className="container-x grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* left: image + composition */}
          <div>
            <div className="card p-3">
              <ProductImage src={product.image} alt={product.name} className="aspect-square w-full" />
            </div>
            <div className="card mt-4 p-5">
              <p className="label">Composition</p>
              <p className="text-[13.5px] leading-relaxed text-slate">{product.composition}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <p className="label !mb-0.5">Category</p>
                  <p className="font-semibold">{product.category}</p>
                </div>
                <div>
                  <p className="label !mb-0.5">Pack size</p>
                  <p className="font-semibold">{product.packing}</p>
                </div>
                <div>
                  <p className="label !mb-0.5">Type</p>
                  <p className="font-semibold">{product.isRx ? "Prescription (Rx)" : "OTC / Wellness"}</p>
                </div>
                <div>
                  <p className="label !mb-0.5">Movement</p>
                  <p className="font-semibold capitalize">{product.movement}</p>
                </div>
              </div>
            </div>
          </div>

          {/* right: pricing */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.isRx && <span className="chip badge-steel">Rx — license required</span>}
              {product.scheme && (
                <span className="chip badge-gold">
                  Scheme: buy {product.scheme.buy} get {product.scheme.free} free
                </span>
              )}
              {product.movement === "fast" && <span className="chip badge-green">Fast mover</span>}
            </div>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">{product.name}</h1>
            <p className="mt-1 text-[15px] font-semibold text-graphite">
              {product.packing}
              {product.mrp > 0 ? ` · MRP ${inr(product.mrp)}` : ""}
            </p>

            {role ? (
              <>
                {/* your flat trade price */}
                <div className="card mt-6 p-5">
                  <p className="label">Your {ROLES[role].label} price</p>
                  <div className="mt-1 flex flex-wrap items-end gap-3">
                    <span className="font-display text-4xl font-black" style={{ color: "var(--green)" }}>
                      {inr(price!)}
                    </span>
                    <span className="pb-1.5 text-[13px] font-semibold text-graphite">/ unit</span>
                    {showMrp && (
                      <span className="pb-1.5 text-[13px] text-graphite">
                        MRP <span className="line-through">{inr(product.mrp)}</span>
                      </span>
                    )}
                  </div>
                  {showMrp && (
                    <p className="mt-1 text-[13px] font-bold" style={{ color: "var(--gold)" }}>
                      {marginPct(product.mrp, price!)}% margin at MRP
                    </p>
                  )}
                  <p className="mt-2 text-[12px] text-graphite">
                    Fixed trade rate for your role · {GST_RATE * 100}% GST added at checkout.
                  </p>
                </div>

                {/* qty & add */}
                <div className="card mt-4 p-5">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <p className="label">Order quantity (MOQ {moq})</p>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-ghost !h-11 !w-11 !p-0"
                          onClick={() => setQty(Math.max(moq, qty - 10))}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="input !w-24 text-center"
                          value={qty}
                          min={moq}
                          onChange={(e) =>
                            setQty(Math.max(moq, parseInt(e.target.value) || moq))
                          }
                        />
                        <button
                          className="btn-ghost !h-11 !w-11 !p-0"
                          onClick={() => setQty(qty + 10)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12.5px] text-graphite">
                        {qty} units × {inr(price!)}
                      </p>
                      <p className="font-display text-2xl font-black">{inr(round2(price! * qty))}</p>
                      {showMrp && (
                        <p className="text-[12px] font-semibold" style={{ color: "var(--green)" }}>
                          You save {inr(Math.round((product.mrp - price!) * qty))} vs MRP
                        </p>
                      )}
                    </div>
                  </div>
                  {canBuy ? (
                    <button
                      className="btn-primary mt-4 w-full"
                      onClick={() => {
                        add(product.id, qty);
                        setAdded(true);
                        setTimeout(() => setAdded(false), 1800);
                      }}
                    >
                      {added ? "✓ Added to bulk cart" : "Add to Bulk Cart"}
                    </button>
                  ) : (
                    <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-[13px] font-semibold text-graphite">
                      This is a prescription product — only drug-license-verified accounts can
                      order it.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="card mt-6 p-6 text-center">
                <p className="font-display text-lg font-black">
                  Trade prices are hidden for guests
                </p>
                <p className="mx-auto mt-2 max-w-md text-[13.5px] text-graphite">
                  Distributors, stockists, chemists and doctors each see their own fixed trade
                  rate here. Log in or register to view yours.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button className="btn-primary" onClick={() => router.push("/login")}>
                    Login to see your price
                  </button>
                  <button className="btn-gold" onClick={() => router.push("/register")}>
                    Register free
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {subs.length > 0 && (
        <section className="border-t border-line bg-paper py-12">
          <div className="container-x">
            <p className="eyebrow">Same salts, other options</p>
            <h2 className="mt-2 text-2xl font-black">Related &amp; Substitute Products</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subs.map((s) => (
                <ProductCard key={s.id} product={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
