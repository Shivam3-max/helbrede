"use client";

import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/context/ProductsContext";
import { inr } from "@/lib/format";
import { basePrice, marginPct, round2, ROLES } from "@/lib/pricing";
import { Role } from "@/lib/types";

const TABS = [
  { id: "ptr", label: "PTR / PTS" },
  { id: "margin", label: "Product Margin" },
  { id: "scheme", label: "Scheme Converter" },
  { id: "gst", label: "GST Split" },
  { id: "breakeven", label: "Breakeven" },
  { id: "roi", label: "ROI Projector" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function Result({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-5 space-y-2 rounded-xl bg-paper p-4">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between text-[13.5px]">
          <span className="text-graphite">{k}</span>
          <span className="font-display font-black" style={{ color: "var(--green)" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function Num({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <div>
      <label className="label">{label}{suffix ? ` (${suffix})` : ""}</label>
      <input
        type="number"
        className="input"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

export default function Calculators() {
  const { products: PRODUCTS } = useProducts();
  const [tab, setTab] = useState<Tab>("ptr");

  // PTR/PTS
  const [mrp, setMrp] = useState(100);
  const [retMargin, setRetMargin] = useState(20);
  const [stkMargin, setStkMargin] = useState(10);
  const [gstPct, setGstPct] = useState(12);
  const base = mrp / (1 + gstPct / 100);
  const ptr = base * (1 - retMargin / 100);
  const pts = ptr * (1 - stkMargin / 100);

  // margin on real product
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role>("chemist");
  const matches = useMemo(
    () =>
      q.trim()
        ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
        : [],
    [PRODUCTS, q]
  );
  const [picked, setPicked] = useState(PRODUCTS[0]);
  useEffect(() => {
    if (!picked && PRODUCTS.length) setPicked(PRODUCTS[0]);
  }, [PRODUCTS, picked]);

  // scheme
  const [sBuy, setSBuy] = useState(10);
  const [sFree, setSFree] = useState(2);
  const schemePct = (sFree / (sBuy + sFree)) * 100;

  // gst
  const [gAmount, setGAmount] = useState(1120);
  const [gRate, setGRate] = useState(12);
  const gBase = gAmount / (1 + gRate / 100);

  // breakeven
  const [expenses, setExpenses] = useState(40000);
  const [avgMargin, setAvgMargin] = useState(25);
  const [avgTicket, setAvgTicket] = useState(120);
  const beRevenue = avgMargin > 0 ? expenses / (avgMargin / 100) : 0;
  const beUnits = avgTicket > 0 ? beRevenue / avgTicket : 0;

  // roi
  const [invest, setInvest] = useState(200000);
  const [turnsPerYear, setTurns] = useState(6);
  const [roiMargin, setRoiMargin] = useState(22);
  const annualProfit = invest * turnsPerYear * (roiMargin / 100);

  return (
    <>
      <section className="border-b border-line bg-paper py-10">
        <div className="container-x">
          <p className="eyebrow">Free for everyone — no login needed</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Pharma Trade Calculators</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] text-graphite">
            The daily math of the pharma trade — PTR, margins, schemes, GST, breakeven and ROI —
            done right, wired to real catalog prices.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`chip !cursor-pointer !px-4 !py-2 transition-all ${
                  tab === t.id ? "badge-green !border-green" : "hover:border-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-x">
          <div className="card mx-auto max-w-2xl p-6">
            {tab === "ptr" && (
              <>
                <h2 className="font-display text-lg font-black">PTR / PTS Calculator</h2>
                <p className="mt-1 text-[13px] text-graphite">
                  From MRP down to price-to-retailer and price-to-stockist, net of GST.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Num label="MRP" value={mrp} onChange={setMrp} suffix="₹" />
                  <Num label="GST rate" value={gstPct} onChange={setGstPct} suffix="%" />
                  <Num label="Retailer margin" value={retMargin} onChange={setRetMargin} suffix="%" />
                  <Num label="Stockist margin" value={stkMargin} onChange={setStkMargin} suffix="%" />
                </div>
                <Result
                  rows={[
                    ["Base price (ex-GST)", inr(round2(base))],
                    ["PTR — price to retailer", inr(round2(ptr))],
                    ["PTS — price to stockist", inr(round2(pts))],
                  ]}
                />
              </>
            )}

            {tab === "margin" && (
              <>
                <h2 className="font-display text-lg font-black">Margin on a Real Product</h2>
                <p className="mt-1 text-[13px] text-graphite">
                  Pick any catalog product and see the trade rate and margin for every role.
                </p>
                <div className="mt-5">
                  <label className="label">Search product</label>
                  <input className="input" placeholder="e.g. HELDINE, 5D GEL, Musli…" value={q} onChange={(e) => setQ(e.target.value)} />
                  {matches.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-line">
                      {matches.map((m) => (
                        <button
                          key={m.id}
                          className="block w-full border-b border-line px-4 py-2 text-left text-[13px] font-semibold last:border-0 hover:bg-paper"
                          onClick={() => { setPicked(m); setQ(""); }}
                        >
                          {m.name} · {m.packing} · MRP {inr(m.mrp)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(Object.keys(ROLES) as Role[]).map((r) => (
                    <button key={r} onClick={() => setRole(r)} className={`chip !cursor-pointer ${role === r ? "badge-green" : "hover:border-ink"}`}>
                      {ROLES[r].label}
                    </button>
                  ))}
                </div>
                {picked && (
                <div className="mt-4 rounded-xl bg-paper p-4">
                  <p className="font-display text-[15px] font-black">
                    {picked.name}{" "}
                    <span className="text-[12px] font-semibold text-graphite">
                      {picked.packing}
                      {picked.mrp > 0 ? ` · MRP ${inr(picked.mrp)}` : ""}
                    </span>
                  </p>
                  <table className="mt-3 w-full text-[13px]">
                    <tbody>
                      {(Object.keys(ROLES) as Role[]).map((r) => {
                        const pr = basePrice(picked, r);
                        return (
                          <tr key={r} className={`border-t border-line ${r === role ? "bg-green-soft" : ""}`}>
                            <td className="py-2 font-semibold">{ROLES[r].label}</td>
                            <td className="py-2 font-display font-black" style={{ color: "var(--green)" }}>{inr(pr)}</td>
                            <td className="py-2 text-right font-bold" style={{ color: "var(--gold)" }}>
                              {picked.mrp > pr ? `${marginPct(picked.mrp, pr)}% margin` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
              </>
            )}

            {tab === "scheme" && (
              <>
                <h2 className="font-display text-lg font-black">Scheme Converter</h2>
                <p className="mt-1 text-[13px] text-graphite">
                  What does a &quot;10+2&quot; bonus deal really mean in % terms?
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Num label="Buy quantity" value={sBuy} onChange={setSBuy} />
                  <Num label="Free quantity" value={sFree} onChange={setSFree} />
                </div>
                <Result
                  rows={[
                    [`Scheme`, `${sBuy}+${sFree}`],
                    ["Effective discount", `${round2(schemePct)}%`],
                    ["Effective cost per unit at ₹100 rate", inr(round2((sBuy * 100) / (sBuy + sFree)))],
                  ]}
                />
              </>
            )}

            {tab === "gst" && (
              <>
                <h2 className="font-display text-lg font-black">GST Split</h2>
                <p className="mt-1 text-[13px] text-graphite">Remove GST from an inclusive amount.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Num label="GST-inclusive amount" value={gAmount} onChange={setGAmount} suffix="₹" />
                  <Num label="GST rate" value={gRate} onChange={setGRate} suffix="%" />
                </div>
                <Result
                  rows={[
                    ["Base amount", inr(round2(gBase))],
                    ["GST portion", inr(round2(gAmount - gBase))],
                    ["CGST / SGST each", inr(round2((gAmount - gBase) / 2))],
                  ]}
                />
              </>
            )}

            {tab === "breakeven" && (
              <>
                <h2 className="font-display text-lg font-black">Monthly Breakeven</h2>
                <p className="mt-1 text-[13px] text-graphite">
                  How much do you need to sell each month to cover shop expenses?
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Num label="Monthly expenses" value={expenses} onChange={setExpenses} suffix="₹" />
                  <Num label="Average margin" value={avgMargin} onChange={setAvgMargin} suffix="%" />
                  <Num label="Average bill value" value={avgTicket} onChange={setAvgTicket} suffix="₹" />
                </div>
                <Result
                  rows={[
                    ["Breakeven revenue / month", inr(Math.round(beRevenue))],
                    ["≈ Bills per month", String(Math.ceil(beUnits))],
                    ["≈ Bills per day", String(Math.ceil(beUnits / 26))],
                  ]}
                />
              </>
            )}

            {tab === "roi" && (
              <>
                <h2 className="font-display text-lg font-black">ROI Projector</h2>
                <p className="mt-1 text-[13px] text-graphite">
                  Rotate your stock investment through the year and project profit.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Num label="Stock investment" value={invest} onChange={setInvest} suffix="₹" />
                  <Num label="Stock turns / year" value={turnsPerYear} onChange={setTurns} />
                  <Num label="Net margin" value={roiMargin} onChange={setRoiMargin} suffix="%" />
                </div>
                <Result
                  rows={[
                    ["Annual revenue", inr(Math.round(invest * turnsPerYear))],
                    ["Annual gross profit", inr(Math.round(annualProfit))],
                    ["ROI on investment", `${round2((annualProfit / (invest || 1)) * 100)}%`],
                  ]}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
