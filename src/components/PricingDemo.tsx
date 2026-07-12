"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import { ladder, marginPct, nextSlab, ROLES, slabFor, unitPrice } from "@/lib/pricing";
import { Product, Role } from "@/lib/types";

export default function PricingDemo({ product }: { product: Product }) {
  const demoProduct = product;
  const [role, setRole] = useState<Role>("chemist");
  const [qty, setQty] = useState(60);

  const price = unitPrice(demoProduct, role, qty);
  const slab = slabFor(qty);
  const next = nextSlab(qty);
  const total = price * qty;
  const mrpTotal = demoProduct.mrp * qty;

  return (
    <div className="card overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">
            Live pricing demo · real product
          </p>
          <h3 className="mt-1 font-display text-lg font-black">
            {demoProduct.name}{" "}
            <span className="text-[13px] font-semibold text-graphite">{demoProduct.packing}</span>
          </h3>
        </div>
        <span className="chip badge-gold shrink-0">MRP {inr(demoProduct.mrp)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(ROLES) as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`chip !cursor-pointer transition-all ${
              role === r ? "badge-green !border-green" : "hover:border-ink"
            }`}
          >
            {ROLES[r].label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="label !mb-0">Order quantity</span>
          <span className="font-display text-xl font-black">{qty} units</span>
        </div>
        <input
          type="range"
          min={1}
          max={800}
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value))}
          className="mt-2 w-full accent-[var(--green)]"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-paper p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">Your price</p>
          <p className="font-display text-xl font-black" style={{ color: "var(--green)" }}>
            {inr(price)}
          </p>
          <p className="text-[11px] text-graphite">per unit · {slab.label}</p>
        </div>
        <div className="rounded-xl bg-paper p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">Margin</p>
          <p className="font-display text-xl font-black" style={{ color: "var(--gold)" }}>
            {marginPct(demoProduct.mrp, price)}%
          </p>
          <p className="text-[11px] text-graphite">vs MRP</p>
        </div>
        <div className="rounded-xl bg-paper p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">You save</p>
          <p className="font-display text-xl font-black">{inr(Math.round(mrpTotal - total))}</p>
          <p className="text-[11px] text-graphite">on this order</p>
        </div>
      </div>

      {next ? (
        <div className="mt-4 rounded-xl border border-dashed border-gold bg-gold-soft/60 px-4 py-3 text-[13px] font-semibold text-slate">
          Add <span style={{ color: "var(--green)" }}>{next.min - qty} more units</span> to unlock
          the {next.label} slab at{" "}
          <span style={{ color: "var(--green)" }}>
            {inr(ladder(demoProduct, role).find((l) => l.min === next.min)!.price)}/unit
          </span>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-green bg-green-soft px-4 py-3 text-[13px] font-semibold" style={{ color: "var(--green)" }}>
          Best slab unlocked — you&apos;re at the deepest bulk rate. 🎉
        </div>
      )}
    </div>
  );
}
