"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { dateShort, inr } from "@/lib/format";
import { ROLES } from "@/lib/pricing";
import { Order, OrderStatus } from "@/lib/types";

const STATUS_FLOW: OrderStatus[] = ["Placed", "Confirmed", "Dispatched", "Delivered"];

function StatusTimeline({ status }: { status: OrderStatus }) {
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <span
            className={`flex h-5 items-center rounded-full px-2 text-[10px] font-bold ${
              i <= idx ? "bg-green-soft text-[var(--green)]" : "bg-paper text-graphite"
            }`}
          >
            {s}
          </span>
          {i < STATUS_FLOW.length - 1 && (
            <span className={`h-0.5 w-3 ${i < idx ? "bg-green" : "bg-line"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function tierOf(total: number): { name: string; cls: string; next: string | null } {
  if (total >= 100000) return { name: "Gold Partner", cls: "badge-gold", next: null };
  if (total >= 25000)
    return { name: "Silver Partner", cls: "badge-steel", next: `${inr(100000 - total)} more for Gold` };
  return { name: "Bronze Partner", cls: "badge-green", next: `${inr(25000 - total)} more for Silver` };
}

export default function DashboardPage() {
  const { user, ready } = useAuth();
  const { add } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {});
  }, [user]);

  if (!ready) return <div className="container-x py-20" />;
  if (!user || user.isAdmin) {
    return (
      <div className="container-x py-20 text-center">
        <p className="text-graphite">
          Please{" "}
          <Link href="/login" className="font-bold" style={{ color: "var(--green)" }}>
            login
          </Link>{" "}
          with a buyer account to view your dashboard.
        </p>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.userEmail === user.email);
  const lifetime = myOrders.reduce((s, o) => s + o.total, 0);
  const savings = myOrders.reduce((s, o) => s + o.savingsVsMrp, 0);
  const tier = tierOf(lifetime);

  const reorder = (o: Order) => {
    o.lines.forEach((l) => add(l.productId, l.qty));
  };

  const printInvoice = (o: Order) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Invoice ${o.id}</title>
      <style>body{font-family:sans-serif;padding:40px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}h1{font-size:20px}</style>
      </head><body>
      <h1>HELBREDE HEALTHCARE — Tax Invoice</h1>
      <p><b>Order:</b> ${o.id} · <b>Date:</b> ${dateShort(o.placedAt)}<br/>
      <b>Billed to:</b> ${o.userName} (${ROLES[o.role].label})</p>
      <table><tr><th>Product</th><th>Pack</th><th>Qty</th><th>Free</th><th>Rate</th><th>Amount</th></tr>
      ${o.lines.map((l) => `<tr><td>${l.name}</td><td>${l.packing}</td><td>${l.qty}</td><td>${l.freeUnits}</td><td>₹${l.unitPrice}</td><td>₹${l.lineTotal}</td></tr>`).join("")}
      </table>
      <p style="text-align:right">Subtotal: ₹${o.subtotal}<br/>GST (12%): ₹${o.gst}<br/><b>Total: ₹${o.total}</b></p>
      <p style="font-size:11px;color:#666">Demo invoice — batch numbers & expiry will appear here once inventory goes live.</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <>
      <PageTitle title="Order Dashboard | HELBREDE HEALTHCARE" />
      <section className="border-b border-line bg-paper py-10">
        <div className="container-x flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{ROLES[user.role].label} account</p>
            <h1 className="mt-2 text-3xl font-black">{user.firmName || user.name}</h1>
            <p className="mt-1 text-[13.5px] text-graphite">
              {user.city}, {user.state}
              {user.drugLicense && <> · DL: {user.drugLicense}</>}
              {user.gstNumber && <> · GST: {user.gstNumber}</>}
            </p>
          </div>
          <div className="text-right">
            <span className={`chip ${tier.cls}`}>{tier.name}</span>
            {tier.next && <p className="mt-1 text-[11.5px] text-graphite">{tier.next}</p>}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-x">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Orders placed", value: String(myOrders.length) },
              { label: "Lifetime value", value: inr(Math.round(lifetime)) },
              { label: "Saved vs MRP", value: inr(Math.round(savings)) },
              { label: "Your tier", value: ROLES[user.role].label.split(" ")[0] },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <p className="font-display text-xl font-black" style={{ color: "var(--green)" }}>
                  {s.value}
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-graphite">{s.label}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-10 font-display text-xl font-black">Order History</h2>
          {myOrders.length === 0 ? (
            <div className="card mt-4 p-10 text-center text-graphite">
              No orders yet.{" "}
              <Link href="/products" className="font-bold" style={{ color: "var(--green)" }}>
                Place your first bulk order →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {myOrders.map((o) => (
                <div key={o.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-[15px] font-black">
                        {o.id}{" "}
                        <span className="font-body text-[12px] font-semibold text-graphite">
                          · {dateShort(o.placedAt)} · {o.lines.length} products
                        </span>
                      </p>
                      <div className="mt-2">
                        <StatusTimeline status={o.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-black">{inr(o.total)}</p>
                      <p className="text-[11.5px] font-semibold" style={{ color: "var(--green)" }}>
                        saved {inr(o.savingsVsMrp)} vs MRP
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-line pt-3 text-[12.5px] text-graphite">
                    {o.lines
                      .map((l) => `${l.name} ×${l.qty}${l.freeUnits ? ` (+${l.freeUnits} free)` : ""}`)
                      .join(" · ")}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-ghost !px-4 !py-1.5 !text-[12px]" onClick={() => reorder(o)}>
                      ↺ Reorder all
                    </button>
                    <button className="btn-ghost !px-4 !py-1.5 !text-[12px]" onClick={() => printInvoice(o)}>
                      ⬇ GST Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
