"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";
import { inr } from "@/lib/format";
import {
  freeUnits,
  ladder,
  marginPct,
  nextSlab,
  ROLES,
  slabFor,
  unitPrice,
} from "@/lib/pricing";
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
  const price = role ? unitPrice(product, role, qty) : null;
  const bonus = freeUnits(product.scheme, qty);
  const next = role ? nextSlab(qty) : null;

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
              {product.packing} · MRP {inr(product.mrp)}
            </p>

            {role ? (
              <>
                {/* slab ladder */}
                <div className="card mt-6 overflow-hidden">
                  <div className="border-b border-line bg-paper px-5 py-3">
                    <p className="text-[13px] font-bold">
                      Your {ROLES[role].label} price ladder
                    </p>
                  </div>
                  <table className="w-full text-[13.5px]">
                    <tbody>
                      {ladder(product, role).map((l) => {
                        const active = slabFor(qty).min === l.min;
                        return (
                          <tr
                            key={l.min}
                            className={`border-b border-line last:border-0 ${
                              active ? "bg-green-soft" : ""
                            }`}
                          >
                            <td className="px-5 py-2.5 font-semibold">{l.label}</td>
                            <td className="px-5 py-2.5 font-display font-black" style={{ color: "var(--green)" }}>
                              {inr(l.price)}/unit
                            </td>
                            <td className="px-5 py-2.5 text-graphite">
                              {marginPct(product.mrp, l.price)}% margin
                            </td>
                            <td className="px-5 py-2.5 text-right">
                              {active && <span className="chip badge-green !py-0.5 !text-[10px]">You&apos;re here</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* qty & add */}
                <div className="card mt-4 p-5">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <p className="label">Quantity (MOQ {moq})</p>
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
                        {qty} × {inr(price!)}{" "}
                        {bonus > 0 && (
                          <span className="font-bold" style={{ color: "var(--gold)" }}>
                            + {bonus} free
                          </span>
                        )}
                      </p>
                      <p className="font-display text-2xl font-black">{inr(price! * qty)}</p>
                      <p className="text-[12px] font-semibold" style={{ color: "var(--green)" }}>
                        You save {inr(Math.round((product.mrp - price!) * qty))} vs MRP
                      </p>
                    </div>
                  </div>
                  {next && (
                    <p className="mt-3 rounded-lg border border-dashed border-gold bg-gold-soft/60 px-3 py-2 text-[12.5px] font-semibold">
                      Add {next.min - qty} more units → unlock {next.label} at{" "}
                      {inr(ladder(product, role).find((l) => l.min === next.min)!.price)}/unit
                    </p>
                  )}
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
                  Stockists see up to 45% below MRP, distributors even deeper — plus bulk slabs
                  that cut prices further at 50, 200 and 500 units.
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
