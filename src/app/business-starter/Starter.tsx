"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import BrandName from "@/components/BrandName";
import { inr, inr0 } from "@/lib/format";
import { basePrice, marginPct } from "@/lib/pricing";
import { Product, Role } from "@/lib/types";
import { SEGMENTS, SEGMENT_BY_ID, segmentOf } from "@/lib/segments";
import { BarChart, CountUp, Donut, LineChart } from "./Charts";

/* ---------------- config ---------------- */

const INVEST_MIN = 25000;
const INVEST_MAX = 1000000;

interface BizType {
  id: string;
  label: string;
  role: Role;
  blurb: string;
}
const BUSINESS_TYPES: BizType[] = [
  { id: "chemist", label: "Retail Chemist", role: "chemist", blurb: "Over-the-counter store selling to patients at MRP." },
  { id: "stockist", label: "Wholesale Stockist", role: "stockist", blurb: "Supply chemists in your area at wholesale rates." },
  { id: "distributor", label: "Distributor", role: "distributor", blurb: "Territory-level distribution at the deepest net rates." },
  { id: "franchise", label: "PCD Franchise", role: "distributor", blurb: "Monopoly marketing rights for the Helbrede range in your district." },
];

const LICENSES: Record<string, { intro: string; items: { title: string; body: string }[] }> = {
  chemist: {
    intro: "A retail chemist sells directly to patients and needs a retail drug licence.",
    items: [
      { title: "Retail Drug Licence — Form 20 & 21", body: "Issued by your State Drugs Control Dept. Requires a registered pharmacist on premises." },
      { title: "Registered pharmacist", body: "D.Pharm / B.Pharm with state pharmacy council registration." },
      { title: "Premises ~10 m²", body: "With a refrigerator for cold-chain products and pucca storage." },
      { title: "GST registration", body: "Recommended; mandatory above the turnover threshold." },
    ],
  },
  stockist: {
    intro: "A wholesale stockist supplies retailers and needs a wholesale drug licence.",
    items: [
      { title: "Wholesale Drug Licence — Form 20B & 21B", body: "Issued by the State Drugs Control Dept for wholesale trade." },
      { title: "Competent person", body: "A registered pharmacist or a graduate with 1 year trade experience." },
      { title: "Premises ~10 m² + cold storage", body: "Air-conditioned storage and a refrigerator per Schedule N." },
      { title: "GST registration", body: "Mandatory for wholesale trade." },
    ],
  },
  distributor: {
    intro: "A distributor operates at territory scale with higher working capital.",
    items: [
      { title: "Wholesale Drug Licence — Form 20B & 21B", body: "Wholesale licence covering your distribution territory." },
      { title: "Competent person", body: "Registered pharmacist or experienced graduate on record." },
      { title: "Warehouse + cold chain", body: "Larger storage, temperature control and pest-free environment." },
      { title: "GST + working capital", body: "GST registration and healthy credit/working-capital planning." },
    ],
  },
  franchise: {
    intro: "A PCD franchise partner markets the Helbrede range exclusively in a district.",
    items: [
      { title: "Wholesale Drug Licence + GST", body: "Same as a distributor — 20B/21B licence and GST registration." },
      { title: "Monopoly agreement with Helbrede", body: "District-exclusive marketing rights signed with Helbrede Healthcare." },
      { title: "Marketing capacity", body: "Field presence to promote the range to doctors and chemists." },
      { title: "Starter stock investment", body: "An opening stock order to launch — plan it with the basket above." },
    ],
  },
};

const GOALS = ["Open a retail chemist", "Become a stockist", "Start distribution", "Take a PCD franchise", "Just exploring"];

const DEFAULT_MIX: Record<string, number> = {
  pain: 20, antibiotic: 15, cough: 15, gastro: 14, derma: 12, vitamins: 10, personal: 6, ayurvedic: 5, other: 3,
};

interface SavedBasket {
  id: string;
  name: string;
  businessType: string;
  investment: number;
  items: { productId: string; qty: number }[];
}

const round5 = (n: number) => (n >= 10 ? Math.round(n / 5) * 5 : Math.max(1, Math.round(n)));

/* ---------------- component ---------------- */

export default function Starter() {
  const { products: PRODUCTS } = useProducts();
  const { user } = useAuth();
  const { addMany } = useCart();
  const router = useRouter();

  const [investment, setInvestment] = useState(150000);
  const [businessType, setBusinessType] = useState("chemist");
  const role = BUSINESS_TYPES.find((b) => b.id === businessType)!.role;

  // segments that actually have sellable products
  const availableSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    PRODUCTS.forEach((p) => {
      if (basePrice(p, role) > 0) counts[segmentOf(p)] = (counts[segmentOf(p)] ?? 0) + 1;
    });
    return SEGMENTS.filter((s) => counts[s.id]);
  }, [PRODUCTS, role]);

  const [mix, setMix] = useState<Record<string, number>>(DEFAULT_MIX);
  const [basket, setBasket] = useState<{ productId: string; qty: number }[]>([]);
  const [search, setSearch] = useState("");
  const [savedBaskets, setSavedBaskets] = useState<SavedBasket[]>([]);
  const [saveName, setSaveName] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState(40000);
  const [monthlySales, setMonthlySales] = useState(135000);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const storeKey = `hb_planner_v1_${user?.email ?? "guest"}`;

  /* ---- persist / restore progress ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.investment) setInvestment(s.investment);
        if (s.businessType) setBusinessType(s.businessType);
        if (s.mix) setMix(s.mix);
        if (s.monthlyExpenses) setMonthlyExpenses(s.monthlyExpenses);
        if (s.monthlySales) setMonthlySales(s.monthlySales);
        if (Array.isArray(s.savedBaskets)) setSavedBaskets(s.savedBaskets);
      }
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      storeKey,
      JSON.stringify({ investment, businessType, mix, monthlyExpenses, monthlySales, savedBaskets })
    );
  }, [loaded, storeKey, investment, businessType, mix, monthlyExpenses, monthlySales, savedBaskets]);

  /* ---- auto-generate basket from controls ---- */
  const productById = useMemo(() => {
    const m: Record<string, Product> = {};
    PRODUCTS.forEach((p) => (m[p.id] = p));
    return m;
  }, [PRODUCTS]);

  const mixSig = JSON.stringify(mix);
  useEffect(() => {
    if (!PRODUCTS.length) return;
    const segs = availableSegments;
    const totalWeight = segs.reduce((s, sg) => s + (mix[sg.id] ?? 0), 0) || 1;
    const items: { productId: string; qty: number }[] = [];
    for (const sg of segs) {
      const w = (mix[sg.id] ?? 0) / totalWeight;
      if (w <= 0) continue;
      const segBudget = investment * w;
      const pool = PRODUCTS.filter((p) => segmentOf(p) === sg.id && basePrice(p, role) > 0 && p.mrp > 0)
        .sort((a, b) => {
          const sc = (p: Product) =>
            (p.movement === "fast" ? 2 : p.movement === "seasonal" ? 1 : 0) +
            Math.max(0, marginPct(p.mrp, basePrice(p, role))) / 100;
          return sc(b) - sc(a);
        });
      const n = Math.max(1, Math.min(5, Math.round(w * 14)));
      const picks = pool.slice(0, n);
      const per = segBudget / (picks.length || 1);
      picks.forEach((p) => {
        const qty = round5(per / basePrice(p, role));
        if (qty > 0) items.push({ productId: p.id, qty });
      });
    }
    setBasket(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investment, businessType, mixSig, PRODUCTS.length]);

  /* ---- derived basket rows + totals ---- */
  const rows = basket
    .map((it) => {
      const p = productById[it.productId];
      if (!p) return null;
      const price = basePrice(p, role);
      return { p, qty: it.qty, price, cost: price * it.qty, seg: segmentOf(p) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // per-item margin fraction (0..1), capped so odd high-MRP data points can't distort blends
  const marginFrac = (p: Product, price: number) =>
    p.mrp > price ? Math.min(0.9, (p.mrp - price) / p.mrp) : 0;

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const shelf = rows.reduce((s, r) => s + Math.max(r.p.mrp, r.price) * r.qty, 0);
  // cost-weighted blended margin — robust to a few very-high-MRP items
  const grossMarginPct =
    totalCost > 0 ? (rows.reduce((s, r) => s + marginFrac(r.p, r.price) * r.cost, 0) / totalCost) * 100 : 0;

  // segment breakdowns for charts
  const segCost = availableSegments
    .map((s) => ({ label: s.label, color: s.color, value: rows.filter((r) => r.seg === s.id).reduce((a, r) => a + r.cost, 0) }))
    .filter((d) => d.value > 0);
  const segMargin = availableSegments
    .map((s) => {
      const rs = rows.filter((r) => r.seg === s.id);
      const costS = rs.reduce((a, r) => a + r.cost, 0);
      const gpS = rs.reduce((a, r) => a + marginFrac(r.p, r.price) * r.cost, 0);
      return { label: s.label, color: s.color, value: costS > 0 ? (gpS / costS) * 100 : 0 };
    })
    .filter((d) => d.value > 0);

  /* ---- financial projections ---- */
  const gm = grossMarginPct / 100;
  const monthlyGross = monthlySales * gm;
  const monthlyNet = monthlyGross - monthlyExpenses;
  const annualNet = monthlyNet * 12;
  const roiPct = investment > 0 ? (annualNet / investment) * 100 : 0;
  const paybackMonths = monthlyNet > 0 ? investment / monthlyNet : Infinity;
  const breakevenSales = gm > 0 ? monthlyExpenses / gm : 0;

  // break-even line chart
  const maxSales = Math.max(breakevenSales * 1.8, monthlySales * 1.4, 1);
  const bePoints = 6;
  const revenueSeries: [number, number][] = [];
  const costSeries: [number, number][] = [];
  for (let i = 0; i <= bePoints; i++) {
    const s = (maxSales * i) / bePoints;
    revenueSeries.push([s, s]);
    costSeries.push([s, monthlyExpenses + s * (1 - gm)]);
  }
  const beLabels = Array.from({ length: bePoints + 1 }, (_, i) => inr0((maxSales * i) / bePoints / 1000) + "k");

  // ROI cumulative curve over 12 months
  const roiPoints: [number, number][] = [];
  for (let m = 0; m <= 12; m++) roiPoints.push([m, monthlyNet * m]);
  const roiLabels = ["0", "2", "4", "6", "8", "10", "12"];

  /* ---- actions ---- */
  const searchResults = search.trim()
    ? PRODUCTS.filter(
        (p) =>
          basePrice(p, role) > 0 &&
          !basket.some((b) => b.productId === p.id) &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.composition.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 6)
    : [];

  const setQty = (id: string, qty: number) =>
    setBasket((b) => b.map((it) => (it.productId === id ? { ...it, qty: Math.max(1, qty) } : it)));
  const removeItem = (id: string) => setBasket((b) => b.filter((it) => it.productId !== id));
  const addItem = (id: string) => {
    setBasket((b) => (b.some((it) => it.productId === id) ? b : [...b, { productId: id, qty: 10 }]));
    setSearch("");
  };

  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(null), 2600);
  };

  const convertToOrder = () => {
    if (!user || user.isAdmin) {
      router.push("/register");
      return;
    }
    addMany(rows.map((r) => ({ productId: r.p.id, qty: r.qty })));
    router.push("/cart");
  };

  const saveBasket = () => {
    if (!rows.length) return;
    const name = saveName.trim() || `Plan ${savedBaskets.length + 1}`;
    setSavedBaskets((s) => [
      ...s,
      { id: "B" + Date.now().toString(36), name, businessType, investment, items: basket },
    ]);
    setSaveName("");
    flash(`Saved "${name}"`);
  };
  const loadBasket = (b: SavedBasket) => {
    setBusinessType(b.businessType);
    setInvestment(b.investment);
    setTimeout(() => setBasket(b.items), 0); // after regen effect
    flash(`Loaded "${b.name}"`);
  };
  const deleteBasket = (id: string) => setSavedBaskets((s) => s.filter((x) => x.id !== id));

  const downloadPlan = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const bt = BUSINESS_TYPES.find((b) => b.id === businessType)!;
    w.document.write(`
      <html><head><title>Helbrede Business Plan</title>
      <style>body{font-family:sans-serif;padding:40px;color:#111}h1{font-size:22px}h2{font-size:15px;margin-top:22px}
      table{width:100%;border-collapse:collapse;margin-top:10px}td,th{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left}
      .tot{display:flex;gap:24px;margin-top:10px;font-size:13px}.tot b{display:block;font-size:16px}</style></head><body>
      <h1>HELBREDE HEALTHCARE — Starter Business Plan</h1>
      <p><b>Model:</b> ${bt.label} &nbsp; <b>Investment:</b> ₹${investment.toLocaleString("en-IN")}</p>
      <div class="tot">
        <div>Basket cost<b>₹${Math.round(totalCost).toLocaleString("en-IN")}</b></div>
        <div>Shelf value (MRP)<b>₹${Math.round(shelf).toLocaleString("en-IN")}</b></div>
        <div>Gross margin<b>${grossMarginPct.toFixed(1)}%</b></div>
        <div>Projected ROI / yr<b>${roiPct.toFixed(0)}%</b></div>
      </div>
      <h2>Recommended starter stock</h2>
      <table><tr><th>Product</th><th>Pack</th><th>Qty</th><th>Rate</th><th>Cost</th><th>Margin</th></tr>
      ${rows.map((r) => `<tr><td>${r.p.name}</td><td>${r.p.packing}</td><td>${r.qty}</td><td>₹${r.price}</td><td>₹${Math.round(r.cost)}</td><td>${r.p.mrp > r.price ? marginPct(r.p.mrp, r.price) + "%" : "-"}</td></tr>`).join("")}
      </table>
      <h2>Projections (your assumptions)</h2>
      <p style="font-size:12px">Monthly sales ₹${monthlySales.toLocaleString("en-IN")} · Monthly expenses ₹${monthlyExpenses.toLocaleString("en-IN")}
      → Monthly net ₹${Math.round(monthlyNet).toLocaleString("en-IN")} · Payback ${isFinite(paybackMonths) ? paybackMonths.toFixed(1) + " months" : "—"} · Break-even sales ₹${Math.round(breakevenSales).toLocaleString("en-IN")}/mo</p>
      <h2>Licences you'll need — ${bt.label}</h2>
      <ul style="font-size:12px">${LICENSES[businessType].items.map((l) => `<li><b>${l.title}:</b> ${l.body}</li>`).join("")}</ul>
      <p style="font-size:11px;color:#777;margin-top:20px">Indicative plan generated on helbrede.com. Actual sell-through and approvals vary by market and state.</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <>
      {/* HERO */}
      <section className="grid-bg border-b border-line py-12">
        <div className="container-x">
          <p className="eyebrow">Business planner</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">
            Plan Your Pharma Business, Down to the Last Rupee
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-graphite">
            Set your budget and model, tune the product mix, and get a live starter basket with
            projected margins, break-even and ROI — then turn it into a real order in one click.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-x space-y-10">
          {/* 1 · CONTROLS */}
          <div className="card p-6">
            <h2 className="font-display text-lg font-black">1 · Set up your plan</h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {/* investment slider */}
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="label !mb-0">Starting investment</p>
                  <p className="font-display text-xl font-black">{inr0(investment)}</p>
                </div>
                <input
                  type="range"
                  min={INVEST_MIN}
                  max={INVEST_MAX}
                  step={5000}
                  value={investment}
                  onChange={(e) => setInvestment(parseInt(e.target.value))}
                  className="mt-2 w-full accent-[var(--green)]"
                />
                <div className="flex justify-between text-[11px] text-graphite">
                  <span>{inr0(INVEST_MIN)}</span>
                  <span>{inr0(INVEST_MAX)}</span>
                </div>
              </div>
              {/* business type */}
              <div>
                <p className="label">Business model</p>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBusinessType(b.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-bold transition-all ${
                        businessType === b.id ? "border-green bg-green-soft text-[var(--green)]" : "border-line hover:border-ink"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* category mix */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="label !mb-0">Product mix by segment</p>
                <button className="text-[12px] font-bold text-graphite hover:text-ink" onClick={() => setMix(DEFAULT_MIX)}>
                  Reset mix
                </button>
              </div>
              <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableSegments.map((s) => (
                  <div key={s.id}>
                    <div className="flex items-center justify-between text-[12px] font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span className="text-graphite">{mix[s.id] ?? 0}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={mix[s.id] ?? 0}
                      onChange={(e) => setMix((m) => ({ ...m, [s.id]: parseInt(e.target.value) }))}
                      className="mt-1 w-full accent-[var(--gold)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2 · BASKET */}
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-black">2 · Your starter basket</h2>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary !px-4 !py-2 !text-[12.5px]" onClick={convertToOrder}>
                  ↗ Convert to order
                </button>
                <button className="btn-ghost !px-4 !py-2 !text-[12.5px]" onClick={downloadPlan}>
                  ⬇ Download plan (PDF)
                </button>
              </div>
            </div>

            {/* add product */}
            <div className="relative mt-4 max-w-md">
              <input
                className="input"
                placeholder="Add a product to the basket…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      className="block w-full border-b border-line px-4 py-2 text-left text-[13px] font-semibold last:border-0 hover:bg-paper"
                      onClick={() => addItem(p.id)}
                    >
                      {p.name} <span className="text-graphite">· {p.packing} · {inr(basePrice(p, role))}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-graphite">
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Segment</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Rate</th>
                    <th className="py-2 pr-3">Cost</th>
                    <th className="py-2 pr-3">Margin</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.p.id} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3">
                        <Link href={`/products/${r.p.id}`} className="font-bold hover:underline">{r.p.name}</Link>
                        <span className="ml-1 text-graphite">{r.p.packing}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1.5 text-graphite">
                          <span className="h-2 w-2 rounded-sm" style={{ background: SEGMENT_BY_ID[r.seg]?.color }} />
                          {SEGMENT_BY_ID[r.seg]?.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost !h-7 !w-7 !p-0 !text-[12px]" onClick={() => setQty(r.p.id, r.qty - 5)}>−</button>
                          <input
                            type="number"
                            className="input !w-16 !py-1 text-center !text-[12px]"
                            value={r.qty}
                            onChange={(e) => setQty(r.p.id, parseInt(e.target.value) || 1)}
                          />
                          <button className="btn-ghost !h-7 !w-7 !p-0 !text-[12px]" onClick={() => setQty(r.p.id, r.qty + 5)}>+</button>
                        </div>
                      </td>
                      <td className="py-2 pr-3">{inr(r.price)}</td>
                      <td className="py-2 pr-3 font-semibold">{inr0(r.cost)}</td>
                      <td className="py-2 pr-3 font-bold" style={{ color: "var(--gold)" }}>
                        {r.p.mrp > r.price ? `${marginPct(r.p.mrp, r.price)}%` : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <button className="text-[12px] font-bold text-graphite hover:text-red-600" onClick={() => removeItem(r.p.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-graphite">Adjust the sliders above to generate a basket.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* stat tiles */}
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Basket cost" value={totalCost} fmt={inr0} />
              <Tile label="Shelf value (MRP)" value={shelf} fmt={inr0} color="var(--green)" />
              <Tile label="Gross margin" value={grossMarginPct} fmt={(n) => n.toFixed(1) + "%"} color="var(--gold)" />
              <Tile label="Items" value={rows.length} fmt={(n) => Math.round(n).toString()} />
            </div>

            {/* save / compare */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <input
                className="input !w-48 !py-2"
                placeholder="Name this plan…"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <button className="btn-ghost !px-4 !py-2 !text-[12.5px]" onClick={saveBasket}>💾 Save plan</button>
              {notice && <span className="text-[12.5px] font-bold" style={{ color: "var(--green)" }}>{notice}</span>}
              <span className="ml-auto text-[11.5px] text-graphite">
                {user ? "Progress auto-saved to your account." : "Progress saved on this device."}
              </span>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-display text-[15px] font-black">Basket composition</h3>
              <p className="text-[12px] text-graphite">Where your investment goes, by segment.</p>
              <div className="mt-4">
                {segCost.length ? <Donut data={segCost} /> : <p className="text-[13px] text-graphite">No data yet.</p>}
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-display text-[15px] font-black">Margin by segment</h3>
              <p className="text-[12px] text-graphite">Gross margin % at MRP for each segment in your basket.</p>
              <div className="mt-4">
                {segMargin.length ? <BarChart data={segMargin} suffix="%" /> : <p className="text-[13px] text-graphite">No data yet.</p>}
              </div>
            </div>
          </div>

          {/* 3 · PROJECTIONS */}
          <div className="card p-6">
            <h2 className="font-display text-lg font-black">3 · Profit, break-even &amp; ROI</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Expected monthly sales (₹)</label>
                <input type="number" className="input" value={monthlySales} onChange={(e) => setMonthlySales(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Monthly running expenses (₹)</label>
                <input type="number" className="input" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Monthly gross profit" value={monthlyGross} fmt={inr0} color="var(--green)" />
              <Tile label="Monthly net profit" value={monthlyNet} fmt={inr0} color={monthlyNet >= 0 ? "var(--green)" : "var(--red)"} />
              <Tile label="Projected ROI / yr" value={roiPct} fmt={(n) => Math.round(n) + "%"} color="var(--gold)" />
              <Tile label="Payback" value={isFinite(paybackMonths) ? paybackMonths : 0} fmt={(n) => (isFinite(paybackMonths) && n > 0 ? n.toFixed(1) + " mo" : "—")} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-[14px] font-black">Break-even</h3>
                <p className="text-[11.5px] text-graphite">
                  Break-even at ~{inr0(breakevenSales)}/month in sales (where revenue meets total cost).
                </p>
                <div className="mt-2">
                  <LineChart
                    series={[
                      { name: "Revenue", color: "var(--green)", points: revenueSeries },
                      { name: "Total cost", color: "var(--gold)", points: costSeries, dashed: true },
                    ]}
                    xLabels={beLabels}
                    yFormat={(n) => inr0(n / 1000) + "k"}
                    marker={gm > 0 ? { x: breakevenSales, label: "B/E" } : undefined}
                  />
                  <Legend items={[["Revenue", "var(--green)"], ["Total cost", "var(--gold)"]]} />
                </div>
              </div>
              <div>
                <h3 className="font-display text-[14px] font-black">Cumulative profit &amp; payback</h3>
                <p className="text-[11.5px] text-graphite">
                  {isFinite(paybackMonths) ? `Investment recovered in ~${paybackMonths.toFixed(1)} months.` : "Increase sales or margin to reach payback."}
                </p>
                <div className="mt-2">
                  <LineChart
                    series={[
                      { name: "Cumulative net profit", color: "var(--green)", points: roiPoints },
                      { name: "Investment", color: "var(--steel)", points: [[0, investment], [12, investment]], dashed: true },
                    ]}
                    xLabels={roiLabels}
                    yFormat={(n) => inr0(n / 1000) + "k"}
                    marker={isFinite(paybackMonths) && paybackMonths <= 12 ? { x: paybackMonths, label: "Payback" } : undefined}
                  />
                  <Legend items={[["Cumulative profit", "var(--green)"], ["Investment", "var(--steel)"]]} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-graphite">
              Projections are indicative and assume your basket&apos;s blended margin ({grossMarginPct.toFixed(1)}%).
              Actual results depend on your market, pricing and sell-through.
            </p>
          </div>

          {/* SAVED PLANS COMPARE */}
          {savedBaskets.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display text-lg font-black">4 · Compare your saved plans</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-graphite">
                      <th className="py-2 pr-3">Plan</th>
                      <th className="py-2 pr-3">Model</th>
                      <th className="py-2 pr-3">Investment</th>
                      <th className="py-2 pr-3">Items</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedBaskets.map((b) => (
                      <tr key={b.id} className="border-b border-line last:border-0">
                        <td className="py-2.5 pr-3 font-bold">{b.name}</td>
                        <td className="py-2.5 pr-3">{BUSINESS_TYPES.find((t) => t.id === b.businessType)?.label}</td>
                        <td className="py-2.5 pr-3">{inr0(b.investment)}</td>
                        <td className="py-2.5 pr-3">{b.items.length}</td>
                        <td className="py-2.5 text-right">
                          <button className="btn-ghost !px-3 !py-1 !text-[11px]" onClick={() => loadBasket(b)}>Load</button>
                          <button className="ml-1 text-[11px] font-bold text-graphite hover:text-red-600" onClick={() => deleteBasket(b.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LICENSES */}
          <div className="card p-6">
            <h2 className="font-display text-lg font-black">
              5 · Licences for a {BUSINESS_TYPES.find((b) => b.id === businessType)!.label}
            </h2>
            <p className="mt-1 text-[13px] text-graphite">{LICENSES[businessType].intro}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {LICENSES[businessType].items.map((l, i) => (
                <div key={l.title} className="rounded-xl bg-paper p-4">
                  <span className="font-display text-xl font-black" style={{ color: "var(--gold)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 font-display text-[14px] font-black">{l.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-graphite">{l.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 6 · LEAD CAPTURE */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PlanRequest investment={investment} />
            <Consultation />
          </div>

          {/* CTA */}
          <div className="card p-8 text-center">
            <h2 className="font-display text-xl font-black">Ready to make it real?</h2>
            <p className="mx-auto mt-2 max-w-lg text-[13.5px] text-graphite">
              Register free, get verified, and turn your plan into your first bulk order.
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

/* ---------------- small pieces ---------------- */

function Tile({ label, value, fmt, color }: { label: string; value: number; fmt: (n: number) => string; color?: string }) {
  return (
    <div className="rounded-xl bg-paper p-3 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">{label}</p>
      <CountUp value={value} format={fmt} className="font-display text-lg font-black" style={color ? { color } : undefined} />
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-3">
      {items.map(([l, c]) => (
        <span key={l} className="flex items-center gap-1.5 text-[11px] font-semibold text-graphite">
          <span className="h-2 w-3 rounded-sm" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  );
}

function PlanRequest({ investment }: { investment: number }) {
  const [f, setF] = useState({ name: "", phone: "", city: "", goal: GOALS[0] });
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "plan", ...f, budget: investment }),
    });
    setDone(true);
  };
  if (done)
    return (
      <div className="card p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-soft text-xl">✓</span>
        <h3 className="mt-3 font-display text-lg font-black">Plan request received</h3>
        <p className="mt-2 text-[13px] text-graphite">Our team will call you with a tailored plan for your budget and city.</p>
      </div>
    );
  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-black">Get a custom business plan</h3>
      <p className="mt-1 text-[12.5px] text-graphite">
        Tell us your budget, city and goal — our team builds a tailored stock &amp; licence plan for you.
      </p>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <input className="input" required placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" required placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className="input" placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <select className="input" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })}>
          {GOALS.map((g) => <option key={g}>{g}</option>)}
        </select>
        <div className="sm:col-span-2">
          <button className="btn-primary w-full">Get my plan (budget {inr0(investment)})</button>
        </div>
      </form>
    </div>
  );
}

function Consultation() {
  const [f, setF] = useState({ name: "", phone: "", note: "" });
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "consultation", name: f.name, phone: f.phone, note: f.note }),
    });
    setDone(true);
  };
  if (done)
    return (
      <div className="card p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-soft text-xl">✓</span>
        <h3 className="mt-3 font-display text-lg font-black">Consultation booked</h3>
        <p className="mt-2 text-[13px] text-graphite">A <BrandName full={false} /> business advisor will reach out to schedule your free call.</p>
      </div>
    );
  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-black">Book a free consultation</h3>
      <p className="mt-1 text-[12.5px] text-graphite">
        Talk to a <BrandName full={false} /> business advisor about licences, margins and getting started.
      </p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <input className="input" required placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" required placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className="input" placeholder="Preferred day/time (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <button className="btn-gold w-full">Book my free call</button>
      </form>
    </div>
  );
}
