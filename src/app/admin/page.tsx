"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProducts } from "@/context/ProductsContext";
import { dateShort, inr, inr0 } from "@/lib/format";
import { ROLES } from "@/lib/pricing";
import { Order, User } from "@/lib/types";

export default function AdminOverview() {
  const { products } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? [])).catch(() => {});
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users ?? [])).catch(() => {});
  }, []);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "active" && !u.isAdmin);
  const outOfStock = products.filter((p) => p.stock <= 0).length;

  const byRole = (Object.keys(ROLES) as (keyof typeof ROLES)[]).map((r) => ({
    role: ROLES[r].label,
    n: orders.filter((o) => o.role === r).length,
    value: orders.filter((o) => o.role === r).reduce((s, o) => s + o.total, 0),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-black">Overview</h1>
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total revenue", value: inr0(revenue), href: "/admin/orders" },
          { label: "Orders", value: String(orders.length), href: "/admin/orders" },
          { label: "Active partners", value: String(active.length), href: "/admin/users" },
          { label: "Pending verifications", value: String(pending.length), href: "/admin/users", alert: pending.length > 0 },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="card card-hover block p-4 text-center">
            <p className="font-display text-xl font-black" style={{ color: s.alert ? "var(--gold)" : "var(--green)" }}>
              {s.value}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-graphite">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] font-black">Catalog health</h3>
            <Link href="/admin/products" className="text-[12px] font-bold" style={{ color: "var(--green)" }}>
              Manage →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-paper p-3">
              <p className="font-display text-lg font-black">{products.length}</p>
              <p className="text-[11px] font-semibold text-graphite">Live SKUs</p>
            </div>
            <div className="rounded-xl bg-paper p-3">
              <p className="font-display text-lg font-black">{products.filter((p) => p.image).length}</p>
              <p className="text-[11px] font-semibold text-graphite">With images</p>
            </div>
            <div className="rounded-xl bg-paper p-3">
              <p className="font-display text-lg font-black" style={{ color: outOfStock ? "var(--red)" : undefined }}>
                {outOfStock}
              </p>
              <p className="text-[11px] font-semibold text-graphite">Out of stock</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-[15px] font-black">Revenue by role</h3>
          <div className="mt-4 space-y-3">
            {byRole.map((r) => (
              <div key={r.role}>
                <div className="flex justify-between text-[12.5px] font-semibold">
                  <span>{r.role} ({r.n})</span>
                  <span>{inr0(r.value)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${revenue ? (r.value / revenue) * 100 : 0}%`, background: "var(--green)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-paper px-5 py-3">
          <h3 className="font-display text-[15px] font-black">Latest orders</h3>
          <Link href="/admin/orders" className="text-[12px] font-bold" style={{ color: "var(--green)" }}>
            All orders →
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-graphite">No orders yet.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                <div>
                  <p className="font-bold">{o.id} · {o.userName}</p>
                  <p className="text-graphite">{dateShort(o.placedAt)} · {o.lines.length} products</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-black">{inr(o.total)}</p>
                  <span className={`chip !py-0.5 !text-[10px] ${o.status === "Delivered" ? "badge-green" : "badge-gold"}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
