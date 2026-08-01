"use client";

import { useMemo, useRef, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { useProducts } from "@/context/ProductsContext";
import { categoriesOf, groupsOf } from "@/lib/data";
import { inr } from "@/lib/format";
import { sampleImageForProduct } from "@/lib/product-images";
import { marginPct, ROLES, round2 } from "@/lib/pricing";
import { Product, Role } from "@/lib/types";

interface FormState {
  name: string;
  composition: string;
  packing: string;
  mrp: string;
  category: string;
  isRx: boolean;
  schemeBuy: string;
  schemeFree: string;
  stock: string;
  priceDistributor: string;
  priceStockist: string;
  priceChemist: string;
  priceDoctor: string;
}

const EMPTY: FormState = {
  name: "", composition: "", packing: "", mrp: "", category: "",
  isRx: false, schemeBuy: "", schemeFree: "", stock: "1000",
  priceDistributor: "", priceStockist: "", priceChemist: "", priceDoctor: "",
};

const PRICE_FIELDS: { key: keyof FormState & `price${string}`; role: Role }[] = [
  { key: "priceDistributor", role: "distributor" },
  { key: "priceStockist", role: "stockist" },
  { key: "priceChemist", role: "chemist" },
  { key: "priceDoctor", role: "doctor" },
];

export default function AdminProducts() {
  const { products, refresh, ready } = useProducts();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => groupsOf(products), [products]);
  const categories = useMemo(() => categoriesOf(products), [products]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!group || p.group === group) &&
        (!t || p.name.toLowerCase().includes(t) || p.composition.toLowerCase().includes(t) || p.category.toLowerCase().includes(t))
    );
  }, [products, q, group]);

  const openNew = () => {
    setForm(EMPTY);
    setError(null);
    setEditing("new");
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      composition: p.composition,
      packing: p.packing,
      mrp: String(p.mrp),
      category: p.category,
      isRx: p.isRx,
      schemeBuy: p.scheme ? String(p.scheme.buy) : "",
      schemeFree: p.scheme ? String(p.scheme.free) : "",
      stock: String(p.stock),
      priceDistributor: p.prices.distributor != null ? String(p.prices.distributor) : "",
      priceStockist: p.prices.stockist != null ? String(p.prices.stockist) : "",
      priceChemist: p.prices.chemist != null ? String(p.prices.chemist) : "",
      priceDoctor: p.prices.doctor != null ? String(p.prices.doctor) : "",
    });
    setError(null);
    setEditing(p);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const body = {
      name: form.name,
      composition: form.composition,
      packing: form.packing,
      mrp: form.mrp,
      category: form.category || "Other",
      isRx: form.isRx,
      schemeBuy: form.schemeBuy || null,
      schemeFree: form.schemeFree || null,
      stock: form.stock,
      priceDistributor: form.priceDistributor || null,
      priceStockist: form.priceStockist || null,
      priceChemist: form.priceChemist || null,
      priceDoctor: form.priceDoctor || null,
    };
    const res =
      editing === "new"
        ? await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/products/${(editing as Product).id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Could not save.");
    await refresh();
    setEditing(null);
  };

  const removeProduct = async (p: Product) => {
    if (!confirm(`Delete "${p.name} ${p.packing}" permanently?`)) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    await refresh();
  };

  const uploadImage = async (p: Product, file: File) => {
    setUploadingId(p.id);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/products/${p.id}/image`, { method: "POST", body: fd });
    setUploadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Upload failed.");
      return;
    }
    await refresh();
  };

  const removeImage = async (p: Product) => {
    await fetch(`/api/products/${p.id}/image`, { method: "DELETE" });
    await refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black">Products</h1>
          <p className="text-[13px] text-graphite">{products.length} SKUs live · {products.filter((p) => p.image).length} with images</p>
        </div>
        <button className="btn-primary !px-5 !py-2.5 !text-[13px]" onClick={openNew}>
          + Add Product
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input className="input flex-[2]" placeholder="Search name, salt or category…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input flex-1" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">All groups</option>
          {groups.map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>

      {!ready ? (
        <div className="card mt-4 p-10 text-center text-graphite">Loading…</div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.slice(0, 60).map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="relative">
                <ProductImage src={sampleImageForProduct(p)} alt={p.name} label="" className="h-20 w-20 shrink-0" />
                {uploadingId === p.id && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 text-[10px] font-bold">
                    Uploading…
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[14.5px] font-black">
                  {p.name} <span className="font-body text-[12px] font-semibold text-graphite">· {p.packing}</span>
                </p>
                <p className="truncate text-[12px] text-graphite">{p.category} · {p.composition || "No composition"}</p>
                <p className="mt-0.5 text-[12px] font-semibold">
                  MRP {inr(p.mrp)} · stock {p.stock}
                  {p.scheme && <span style={{ color: "var(--gold)" }}> · {p.scheme.buy}+{p.scheme.free}</span>}
                  {p.isRx && <span className="ml-1 chip badge-steel !px-1.5 !py-0 !text-[9px]">Rx</span>}
                  {Object.values(p.prices).some((v) => v != null) && (
                    <span className="ml-1 chip badge-gold !px-1.5 !py-0 !text-[9px]">Custom rates</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="btn-ghost !cursor-pointer !px-3.5 !py-1.5 !text-[12px]">
                  {p.image ? "Change image" : "⬆ Upload image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(p, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {p.image && (
                  <button className="btn-ghost !px-3.5 !py-1.5 !text-[12px]" onClick={() => removeImage(p)}>
                    Remove image
                  </button>
                )}
                <button className="btn-ghost !px-3.5 !py-1.5 !text-[12px]" onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button
                  className="btn-ghost !px-3.5 !py-1.5 !text-[12px] hover:!border-[var(--red)] hover:!text-[var(--red)]"
                  onClick={() => removeProduct(p)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length > 60 && (
            <p className="text-center text-[12px] text-graphite">
              Showing 60 of {filtered.length} — refine your search to see the rest.
            </p>
          )}
          {filtered.length === 0 && (
            <div className="card p-10 text-center text-graphite">No products match.</div>
          )}
        </div>
      )}

      {/* add/edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setEditing(null)}>
          <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-black">
                {editing === "new" ? "Add product" : `Edit — ${(editing as Product).name}`}
              </h2>
              <button className="text-graphite hover:text-ink" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Product name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Composition</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.composition}
                  onChange={(e) => setForm({ ...form, composition: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Packing * (e.g. 30GM, 200 ML)</label>
                <input className="input" value={form.packing} onChange={(e) => setForm({ ...form, packing: e.target.value })} />
              </div>
              <div>
                <label className="label">MRP (₹) *</label>
                <input className="input" type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" list="hb-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <datalist id="hb-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="label">Stock (units)</label>
                <input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className="label">Scheme — buy</label>
                <input className="input" type="number" min="0" placeholder="e.g. 10" value={form.schemeBuy} onChange={(e) => setForm({ ...form, schemeBuy: e.target.value })} />
              </div>
              <div>
                <label className="label">Scheme — free</label>
                <input className="input" type="number" min="0" placeholder="e.g. 2" value={form.schemeFree} onChange={(e) => setForm({ ...form, schemeFree: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-[13px] font-bold sm:col-span-2">
                <input type="checkbox" checked={form.isRx} onChange={(e) => setForm({ ...form, isRx: e.target.checked })} />
                Prescription (Rx) product — license-verified buyers only
              </label>

              {/* per-role trade pricing */}
              <div className="sm:col-span-2 rounded-xl border border-line bg-paper p-4">
                <p className="text-[13px] font-black">Trade Pricing — fixed rate per role</p>
                <p className="mt-0.5 text-[11.5px] text-graphite">
                  Each buyer role pays this fixed rate. Seeded from the distributor list
                  (stockist = +20%, chemist &amp; doctor = +44%). Edit any value to override.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {PRICE_FIELDS.map(({ key, role }) => {
                    const mrpNum = parseFloat(form.mrp) || 0;
                    const defaultRate = mrpNum > 0 ? round2(mrpNum * ROLES[role].multiplier) : 0;
                    const typed = parseFloat(form[key] as string);
                    const effective = typed > 0 ? typed : defaultRate;
                    const invalid = typed > 0 && mrpNum > 0 && typed >= mrpNum;
                    return (
                      <div key={key}>
                        <label className="label !mb-1">{ROLES[role].label} (₹)</label>
                        <input
                          className="input !py-2.5"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={mrpNum > 0 ? `default ${defaultRate}` : "set MRP first"}
                          value={form[key] as string}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        />
                        <p className={`mt-1 text-[11px] font-bold ${invalid ? "text-[var(--red)]" : ""}`}
                           style={invalid ? undefined : { color: "var(--gold)" }}>
                          {mrpNum > 0
                            ? invalid
                              ? "Must be below MRP"
                              : `${marginPct(mrpNum, effective)}% margin ${typed > 0 ? "· custom" : "· default"}`
                            : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--red)]">{error}</p>
            )}
            <div className="mt-5 flex gap-2">
              <button className="btn-primary flex-1 disabled:opacity-40" disabled={saving} onClick={save}>
                {saving ? "Saving…" : editing === "new" ? "Create product" : "Save changes"}
              </button>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
            {editing === "new" && (
              <p className="mt-3 text-center text-[11.5px] text-graphite">
                Upload the image from the product list after creating.
              </p>
            )}
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" className="hidden" />
    </div>
  );
}
