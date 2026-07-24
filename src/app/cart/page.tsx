"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProductImage from "@/components/ProductImage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductsContext";
import { inr } from "@/lib/format";
import { GST_RATE, round2, unitPrice } from "@/lib/pricing";

export default function CartPage() {
  const { user, ready } = useAuth();
  const { items, setQty, remove, placeOrder } = useCart();
  const { products } = useProducts();
  const router = useRouter();
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const productById = (id: string) => products.find((p) => p.id === id);

  if (!ready) return <div className="container-x py-20" />;

  if (!user || user.isAdmin) {
    return (
      <div className="container-x py-20">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-black">Login to build your bulk cart</h1>
          <p className="mt-2 text-[14px] text-graphite">
            Your cart prices depend on your role — login or register to see them.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="btn-primary">Login</Link>
            <Link href="/register" className="btn-ghost">Register free</Link>
          </div>
        </div>
      </div>
    );
  }

  if (placedId) {
    return (
      <div className="container-x py-20">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-soft text-2xl">✓</span>
          <h1 className="mt-4 font-display text-2xl font-black">Order {placedId} placed!</h1>
          <p className="mt-2 text-[14px] text-graphite">
            Our team will confirm it shortly. Track status, download the GST invoice and reorder
            from your dashboard.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
            <Link href="/products" className="btn-ghost">Keep browsing</Link>
          </div>
        </div>
      </div>
    );
  }

  const lines = items
    .map((i) => {
      const p = productById(i.productId);
      if (!p) return null;
      const price = unitPrice(p, user.role);
      return { item: i, p, price };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.item.qty, 0));
  const gst = round2(subtotal * GST_RATE);
  const mrpTotal = lines.reduce((s, l) => s + l.p.mrp * l.item.qty, 0);

  return (
    <>
      <section className="border-b border-line bg-paper py-10">
        <div className="container-x">
          <p className="eyebrow">Bulk cart</p>
          <h1 className="mt-2 text-3xl font-black">Your Cart</h1>
          <p className="mt-1 text-[14px] text-graphite">
            Fixed trade rates for your role. Review quantities and place your bulk order.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container-x grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            {lines.length === 0 && (
              <div className="card p-10 text-center text-graphite">
                Cart is empty.{" "}
                <Link href="/products" className="font-bold" style={{ color: "var(--green)" }}>
                  Browse the catalog →
                </Link>
              </div>
            )}
            {lines.map(({ item, p, price }) => {
              return (
                <div key={p.id} className="card flex gap-4 p-4">
                  <ProductImage src={p.image} alt={p.name} className="h-24 w-24 shrink-0" label="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/products/${p.id}`} className="font-display text-[15px] font-black hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-[12px] text-graphite">{p.packing}</p>
                      </div>
                      <button
                        onClick={() => remove(p.id)}
                        className="text-[12px] font-bold text-graphite hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <button className="btn-ghost !h-8 !w-8 !p-0 !text-[13px]" onClick={() => setQty(p.id, item.qty - 10)}>−</button>
                        <input
                          type="number"
                          className="input !w-20 !py-1.5 text-center"
                          value={item.qty}
                          onChange={(e) => setQty(p.id, parseInt(e.target.value) || 1)}
                        />
                        <button className="btn-ghost !h-8 !w-8 !p-0 !text-[13px]" onClick={() => setQty(p.id, item.qty + 10)}>+</button>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] text-graphite">
                          {inr(price)}/unit
                          {p.mrp > price && (
                            <> · MRP <span className="line-through">{inr(p.mrp)}</span></>
                          )}
                        </p>
                        <p className="font-display text-[17px] font-black">{inr(round2(price * item.qty))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="card sticky top-24 p-5">
              <h2 className="font-display text-lg font-black">Order Summary</h2>
              <div className="mt-4 space-y-2 text-[13.5px]">
                <div className="flex justify-between"><span className="text-graphite">Subtotal (trade price)</span><span className="font-bold">{inr(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-graphite">GST ({GST_RATE * 100}%)</span><span className="font-bold">{inr(gst)}</span></div>
                {mrpTotal > subtotal && (
                  <>
                    <div className="flex justify-between text-graphite"><span>MRP value</span><span className="line-through">{inr(round2(mrpTotal))}</span></div>
                    <div className="flex justify-between" style={{ color: "var(--green)" }}>
                      <span className="font-bold">You save vs MRP</span>
                      <span className="font-bold">{inr(round2(mrpTotal - subtotal))}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-line pt-2 flex justify-between font-display text-[17px] font-black">
                  <span>Total</span><span>{inr(round2(subtotal + gst))}</span>
                </div>
              </div>
              {orderError && (
                <p className="mt-4 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[12.5px] font-semibold text-[var(--red)]">
                  {orderError}
                </p>
              )}
              <button
                disabled={!lines.length || placing}
                className="btn-primary mt-5 w-full disabled:opacity-40"
                onClick={async () => {
                  setPlacing(true);
                  setOrderError(null);
                  const { order, error } = await placeOrder();
                  setPlacing(false);
                  if (error) setOrderError(error);
                  else if (order) setPlacedId(order.id);
                }}
              >
                {placing ? "Placing order…" : "Place Bulk Order"}
              </button>
              <p className="mt-3 text-center text-[11.5px] text-graphite">
                Payment on credit terms / delivery — gateway coming in a later phase.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
