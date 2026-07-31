"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProducts } from "@/context/ProductsContext";
import { inr, inr0 } from "@/lib/format";
import { basePrice, marginPct, ROLES } from "@/lib/pricing";
import { Role } from "@/lib/types";

const CHECKLIST = [
  {
    title: "Choose your entity",
    body: "Proprietorship is fastest to start; LLP/Pvt Ltd once you scale. You'll need a PAN in the firm's name.",
  },
  {
    title: "Drug license (Form 20B & 21B)",
    body: "Apply at your State Drugs Control department. Requires a registered pharmacist (retail) or competent person (wholesale), premises of min. area with refrigeration.",
  },
  {
    title: "GST registration",
    body: "Mandatory for wholesale trade. Takes ~3–7 working days on the GST portal with PAN, address proof and bank details.",
  },
  {
    title: "Premises & storage",
    body: "Wholesale needs roughly 10m²+, cold storage for temperature-sensitive SKUs, and a pollution-free environment per Schedule N.",
  },
  {
    title: "Register on Helbrede Healthcare",
    body: "Submit your license + GST here, get verified within a working day, and unlock your trade rates on 360+ SKUs.",
  },
  {
    title: "Place your starter order",
    body: "Use the basket builder above — start with fast movers at the 50+ slab for the best working-capital efficiency.",
  },
];

const BUDGETS = [50000, 100000, 200000, 500000];

export default function Starter() {
  const { products: PRODUCTS } = useProducts();
  const [budget, setBudget] = useState(100000);
  const [role, setRole] = useState<Role>("chemist");
  const [focus, setFocus] = useState<string>("balanced");

  const basket = useMemo(() => {
    // deterministic "advisor": prioritize fast movers + healthy margin, spread across groups
    let pool = PRODUCTS.filter((p) => p.mrp >= 20 && basePrice(p, role) > 0);
    if (focus === "ayurvedic") pool = pool.filter((p) => p.group === "Ayurvedic Specialties" || p.category.toLowerCase().includes("ayurvedic"));
    if (focus === "otc") pool = pool.filter((p) => !p.isRx);
    if (focus === "rx") pool = pool.filter((p) => p.isRx);
    const scored = [...pool].sort((a, b) => {
      const score = (p: typeof a) =>
        (p.movement === "fast" ? 2 : p.movement === "seasonal" ? 1 : 0) +
        Math.max(0, marginPct(p.mrp, basePrice(p, role))) / 100;
      return score(b) - score(a);
    });
    // pick top products across distinct groups first
    const picked: typeof scored = [];
    const seenGroups = new Set<string>();
    for (const p of scored) {
      if (picked.length >= 12) break;
      if (!seenGroups.has(p.group) || picked.length >= 6) {
        picked.push(p);
        seenGroups.add(p.group);
      }
    }
    // allocate budget equally across the basket
    const per = budget / (picked.length || 1);
    return picked
      .map((p) => {
        const price = basePrice(p, role);
        const qty = Math.max(50, Math.floor(per / price / 10) * 10);
        return { p, qty, price, cost: qty * price };
      })
      .filter((x) => x.cost <= per * 1.6);
  }, [PRODUCTS, budget, role, focus]);

  const totalCost = basket.reduce((s, b) => s + b.cost, 0);
  const mrpValue = basket.reduce((s, b) => s + b.p.mrp * b.qty, 0);

  return (
    <>
      <section className="grid-bg border-b border-line py-12">
        <div className="container-x">
          <p className="eyebrow">Business starter</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">
            Start Your Pharma Business With a Plan, Not a Guess
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-graphite">
            Tell us your budget — we&apos;ll build a starter stock basket from the live catalog,
            with projected margins, then walk you through every license you need.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-x">
          <div className="card p-6">
            <h2 className="font-display text-lg font-black">1 · Build my starter basket</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div>
                <p className="label">Starting budget</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button key={b} onClick={() => setBudget(b)} className={`chip !cursor-pointer ${budget === b ? "badge-green" : "hover:border-ink"}`}>
                      {inr0(b)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label">I&apos;ll operate as</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ROLES) as Role[]).map((r) => (
                    <button key={r} onClick={() => setRole(r)} className={`chip !cursor-pointer ${role === r ? "badge-green" : "hover:border-ink"}`}>
                      {ROLES[r].label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label">Range focus</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["balanced", "Balanced"],
                    ["otc", "OTC-heavy"],
                    ["rx", "Rx-heavy"],
                    ["ayurvedic", "Ayurvedic"],
                  ].map(([id, label]) => (
                    <button key={id} onClick={() => setFocus(id)} className={`chip !cursor-pointer ${focus === id ? "badge-green" : "hover:border-ink"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-graphite">
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Why</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Your rate</th>
                    <th className="py-2 pr-3">Cost</th>
                    <th className="py-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {basket.map(({ p, qty, price, cost }) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link href={`/products/${p.id}`} className="font-bold hover:underline">{p.name}</Link>
                        <span className="ml-1 text-graphite">{p.packing}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-graphite">
                        {p.movement === "fast" ? "Fast mover" : p.movement === "seasonal" ? "Seasonal spike" : "Steady seller"}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold">{qty}</td>
                      <td className="py-2.5 pr-3">{inr(Math.round(price * 100) / 100)}</td>
                      <td className="py-2.5 pr-3 font-semibold">{inr0(cost)}</td>
                      <td className="py-2.5 text-right font-bold" style={{ color: "var(--gold)" }}>
                        {p.mrp > price ? `${marginPct(p.mrp, price)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-paper p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">Basket cost</p>
                <p className="font-display text-lg font-black">{inr0(totalCost)}</p>
              </div>
              <div className="rounded-xl bg-paper p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">MRP shelf value</p>
                <p className="font-display text-lg font-black" style={{ color: "var(--green)" }}>{inr0(mrpValue)}</p>
              </div>
              <div className="rounded-xl bg-paper p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">Potential upside</p>
                <p className="font-display text-lg font-black" style={{ color: "var(--gold)" }}>{inr0(mrpValue - totalCost)}</p>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-graphite">
              Indicative planning tool — actual sell-through depends on your market. Register to
              convert this basket into a live cart.
            </p>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-lg font-black">2 · Your license &amp; setup checklist</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CHECKLIST.map((c, i) => (
                <div key={c.title} className="card p-5">
                  <span className="font-display text-2xl font-black" style={{ color: "var(--gold)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-[15px] font-black">{c.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-graphite">{c.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-10 p-8 text-center">
            <h2 className="font-display text-xl font-black">Ready to make it real?</h2>
            <p className="mx-auto mt-2 max-w-lg text-[13.5px] text-graphite">
              Register free, get verified, and turn your starter basket into your first bulk order.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn-primary">Register my business</Link>
              <Link href="/franchise" className="btn-gold">Claim a monopoly territory</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
