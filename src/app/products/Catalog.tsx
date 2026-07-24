"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { groupsOf } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";

const PAGE_SIZE = 24;

type SortKey = "name" | "mrp-asc" | "mrp-desc" | "margin";

export default function Catalog() {
  const params = useSearchParams();
  const { user } = useAuth();
  const { products: PRODUCTS, ready } = useProducts();
  const GROUPS = useMemo(() => groupsOf(PRODUCTS), [PRODUCTS]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [group, setGroup] = useState(params.get("group") ?? "");
  const [sort, setSort] = useState<SortKey>("name");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let list = PRODUCTS.filter(
      (p) =>
        (!group || p.group === group) &&
        (!t ||
          p.name.toLowerCase().includes(t) ||
          p.composition.toLowerCase().includes(t) ||
          p.category.toLowerCase().includes(t))
    );
    list = [...list].sort((a, b) => {
      if (sort === "mrp-asc") return a.mrp - b.mrp;
      if (sort === "mrp-desc") return b.mrp - a.mrp;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [PRODUCTS, q, group, sort]);

  const shown = filtered.slice(0, page * PAGE_SIZE);

  return (
    <>
      <section className="border-b border-line bg-paper py-10">
        <div className="container-x">
          <p className="eyebrow">Live catalog</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Product Catalog</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] text-graphite">
            Search by brand name <em>or</em> composition — &quot;ofloxacin&quot; finds every SKU
            containing it.{" "}
            {!user && (
              <span className="font-semibold" style={{ color: "var(--green)" }}>
                Login to switch MRP to your trade prices.
              </span>
            )}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              className="input flex-[2]"
              placeholder="Search 360+ products by name, salt or category…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="input flex-1"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              className="input flex-1"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="name">Sort: A – Z</option>
              <option value="mrp-asc">Sort: MRP low → high</option>
              <option value="mrp-desc">Sort: MRP high → low</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] font-semibold text-graphite">
              {filtered.length} of {PRODUCTS.length} products
            </span>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-x">
          {!ready ? (
            <div className="card p-10 text-center text-graphite">Loading catalog…</div>
          ) : shown.length === 0 ? (
            <div className="card p-10 text-center text-graphite">
              No products match. Try a shorter search — e.g. a salt fragment like
              &quot;clotrim&quot;.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {shown.length < filtered.length && (
            <div className="mt-8 text-center">
              <button onClick={() => setPage(page + 1)} className="btn-ghost">
                Load more ({filtered.length - shown.length} remaining)
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
