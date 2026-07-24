"use client";

import Link from "next/link";
import { useState } from "react";

interface Territory {
  district: string;
  status: "open" | "taken" | "hot";
  potential: "High" | "Medium" | "Growing";
}

const TERRITORIES: Record<string, Territory[]> = {
  Punjab: [
    { district: "Ludhiana", status: "taken", potential: "High" },
    { district: "Amritsar", status: "open", potential: "High" },
    { district: "Jalandhar", status: "hot", potential: "High" },
    { district: "Patiala", status: "open", potential: "Medium" },
    { district: "Bathinda", status: "open", potential: "Medium" },
    { district: "Mohali", status: "taken", potential: "High" },
  ],
  Haryana: [
    { district: "Gurugram", status: "hot", potential: "High" },
    { district: "Faridabad", status: "open", potential: "High" },
    { district: "Panchkula", status: "taken", potential: "Medium" },
    { district: "Karnal", status: "open", potential: "Medium" },
    { district: "Hisar", status: "open", potential: "Growing" },
    { district: "Ambala", status: "open", potential: "Medium" },
  ],
  "Himachal Pradesh": [
    { district: "Shimla", status: "open", potential: "Medium" },
    { district: "Solan (Baddi belt)", status: "hot", potential: "High" },
    { district: "Kangra", status: "open", potential: "Growing" },
    { district: "Mandi", status: "open", potential: "Growing" },
  ],
  Rajasthan: [
    { district: "Jaipur", status: "hot", potential: "High" },
    { district: "Jodhpur", status: "open", potential: "High" },
    { district: "Udaipur", status: "open", potential: "Medium" },
    { district: "Kota", status: "open", potential: "Medium" },
    { district: "Bikaner", status: "open", potential: "Growing" },
  ],
  "Uttar Pradesh": [
    { district: "Lucknow", status: "hot", potential: "High" },
    { district: "Kanpur", status: "open", potential: "High" },
    { district: "Noida / GB Nagar", status: "taken", potential: "High" },
    { district: "Varanasi", status: "open", potential: "High" },
    { district: "Agra", status: "open", potential: "Medium" },
    { district: "Meerut", status: "open", potential: "Medium" },
  ],
  Delhi: [
    { district: "Central & New Delhi", status: "taken", potential: "High" },
    { district: "East Delhi", status: "open", potential: "High" },
    { district: "West Delhi", status: "hot", potential: "High" },
    { district: "South Delhi", status: "open", potential: "High" },
  ],
  Uttarakhand: [
    { district: "Dehradun", status: "open", potential: "Medium" },
    { district: "Haridwar", status: "open", potential: "Medium" },
    { district: "Udham Singh Nagar", status: "open", potential: "Growing" },
  ],
  "Jammu & Kashmir": [
    { district: "Jammu", status: "open", potential: "Medium" },
    { district: "Srinagar", status: "open", potential: "Medium" },
  ],
  Chandigarh: [{ district: "Chandigarh UT", status: "taken", potential: "High" }],
};

const PERKS = [
  { title: "District exclusivity", body: "One partner per district. Your area, your brand presence — zero intra-brand competition." },
  { title: "Deepest net rate", body: "Franchise partners buy at or below distributor rates, with custom pricing on volume." },
  { title: "Marketing kit included", body: "Visual aids, product cards, WhatsApp promo creatives and printable price lists for your territory." },
  { title: "Protected leads", body: "Every enquiry from your district on this platform routes to you, automatically." },
];

export default function Franchise() {
  const [state, setState] = useState("Punjab");
  const [applied, setApplied] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", district: "" });

  const list = TERRITORIES[state];

  return (
    <>
      <section className="grid-bg border-b border-line py-12">
        <div className="container-x">
          <p className="eyebrow">Monopoly rights</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">
            Own Your District. Exclusively.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-graphite">
            Helbrede Healthcare franchise partners get monopoly marketing rights for the full 360-SKU range
            in their district — see live availability below.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-semibold">
            <span className="chip badge-green">● Open — apply now</span>
            <span className="chip badge-gold">● Hot — multiple applicants</span>
            <span className="chip">● Taken</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-x grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(TERRITORIES).map((s) => (
                <button
                  key={s}
                  onClick={() => setState(s)}
                  className={`chip !cursor-pointer ${state === s ? "badge-green !border-green" : "hover:border-ink"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {list.map((t) => (
                <div
                  key={t.district}
                  className={`card p-4 ${t.status === "taken" ? "opacity-55" : "card-hover"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[15px] font-black">{t.district}</h3>
                    <span
                      className={`chip !py-0.5 !text-[10px] ${
                        t.status === "open" ? "badge-green" : t.status === "hot" ? "badge-gold" : ""
                      }`}
                    >
                      {t.status === "open" ? "Open" : t.status === "hot" ? "Hot" : "Taken"}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-graphite">Market potential: {t.potential}</p>
                  {t.status !== "taken" && (
                    <button
                      className="btn-ghost mt-3 !px-4 !py-1.5 !text-[12px]"
                      onClick={() => setForm({ ...form, district: `${t.district}, ${state}` })}
                    >
                      Apply for this district →
                    </button>
                  )}
                </div>
              ))}
            </div>
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
                      <input className="input" required placeholder="Pick from the list ←" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
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
