"use client";

import Link from "next/link";
import { useState } from "react";
import { ReachMap } from "@/components/LiveActivity";
import BrandName from "@/components/BrandName";

const PERKS = [
  { title: "District exclusivity", body: "One partner per district. Your area, your brand presence — zero intra-brand competition." },
  { title: "Deepest net rate", body: "Franchise partners buy at or below distributor rates, with custom pricing on volume." },
  { title: "Marketing kit included", body: "Visual aids, product cards, WhatsApp promo creatives and printable price lists for your territory." },
  { title: "Protected leads", body: "Every enquiry from your district on this platform routes to you, automatically." },
];

export default function Franchise() {
  const [applied, setApplied] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", district: "" });

  return (
    <>
      <section className="grid-bg border-b border-line py-12">
        <div className="container-x">
          <p className="eyebrow">Monopoly rights</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">
            Own Your District. Exclusively.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-graphite">
            <BrandName /> franchise partners get monopoly marketing rights for the full 360-SKU range
            in their district — with a fast-growing network already spanning the country.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-x grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <ReachMap />
          </div>

          <div>
            <div className="card sticky top-24 p-6">
              {applied ? (
                <div className="text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-soft text-xl">✓</span>
                  <h3 className="mt-3 font-display text-lg font-black">Application received</h3>
                  <p className="mt-2 text-[13px] text-graphite">
                    We&apos;ve logged your interest for <b>{applied}</b>. Our franchise team will
                    call you within 48 hours with terms and the starter kit.
                  </p>
                  <Link href="/business-starter" className="btn-primary mt-5 inline-flex">
                    Plan my starter stock →
                  </Link>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-lg font-black">Territory application</h3>
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setApplied(form.district || "your selected district");
                    }}
                  >
                    <div>
                      <label className="label">Your name</label>
                      <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input className="input" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">District</label>
                      <input className="input" required placeholder="e.g. Ludhiana, Punjab" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                    </div>
                    <button type="submit" className="btn-gold w-full">Apply for monopoly rights</button>
                  </form>
                </>
              )}
              <div className="mt-6 space-y-3 border-t border-line pt-4">
                {PERKS.map((p) => (
                  <div key={p.title}>
                    <p className="text-[13px] font-black">{p.title}</p>
                    <p className="text-[12.5px] text-graphite">{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
