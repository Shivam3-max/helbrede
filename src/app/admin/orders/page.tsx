"use client";

import { useEffect, useState } from "react";
import { dateShort, inr } from "@/lib/format";
import { ROLES } from "@/lib/pricing";
import { Order, OrderStatus } from "@/lib/types";

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  Placed: "Confirmed",
  Confirmed: "Dispatched",
  Dispatched: "Delivered",
  Delivered: null,
};

const FILTERS: ("All" | OrderStatus)[] = ["All", "Placed", "Confirmed", "Dispatched", "Delivered"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const load = () =>
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? [])).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const advance = async (o: Order) => {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    await fetch(`/api/orders/${o.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  const shown = orders.filter((o) => filter === "All" || o.status === filter);

  return (
    <div>
      <h1 className="font-display text-2xl font-black">Orders</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip !cursor-pointer ${filter === f ? "badge-green !border-green" : "hover:border-ink"}`}
          >
            {f} {f !== "All" && `(${orders.filter((o) => o.status === f).length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-graphite">No orders here yet.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="font-display text-[15px] font-black">
                  {o.id}{" "}
                  <span className="font-body text-[12px] font-semibold text-graphite">
                    · {o.userName} ({ROLES[o.role].label}) · {o.city || "—"} · {dateShort(o.placedAt)}
                  </span>
                </p>
                <p className="mt-1 max-w-xl truncate text-[12.5px] text-graphite">
                  {o.lines.map((l) => `${l.name} ×${l.qty}`).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-display font-black">{inr(o.total)}</p>
                  <span className={`chip !py-0.5 !text-[10px] ${o.status === "Delivered" ? "badge-green" : "badge-gold"}`}>
                    {o.status}
                  </span>
                </div>
                {NEXT_STATUS[o.status] && (
                  <button className="btn-primary !px-4 !py-2 !text-[12px]" onClick={() => advance(o)}>
                    → {NEXT_STATUS[o.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
