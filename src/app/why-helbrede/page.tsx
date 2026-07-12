import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";

export const metadata: Metadata = {
  title: "Why Helbrede Healthcare",
};

const OLD_NEW = [
  ["PDF price lists forwarded on WhatsApp", "Live catalog with your personal slab prices"],
  ["Rates negotiated call-by-call", "Transparent quantity slabs — same rules for everyone"],
  ["Orders lost in chat threads", "Tracked orders with status timeline & GST invoices"],
  ["No idea what's in stock", "Real-time availability with fast-mover signals"],
  ["Schemes you hear about too late", "10+2 style schemes auto-applied in cart"],
  ["Business advice from hearsay", "Calculators, starter baskets & franchise tooling built in"],
];

const PILLARS = [
  {
    title: "Verified trade only",
    body: "Every buyer is drug-license or registration verified. Rx products stay gated. That protects the channel — and your margins.",
  },
  {
    title: "Pricing you can plan on",
    body: "Four role ladders × four quantity slabs, published and predictable. Bulk planning becomes a spreadsheet exercise, not a phone negotiation.",
  },
  {
    title: "Built to grow businesses",
    body: "From the first drug license to district monopoly rights — the platform carries a partner from day zero to scale.",
  },
];

export default function WhyPage() {
  return (
    <>
      <section className="grid-bg border-b border-line py-14">
        <div className="container-x">
          <p className="eyebrow">Why Helbrede Healthcare</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
            The Pharma Trade Runs on Phone Calls and PDFs. We&apos;re Retiring Both.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-graphite">
            Distribution in Indian pharma still works the way it did in 1995 — printed price
            lists, WhatsApp forwards, rates that depend on who you know. Helbrede Healthcare replaces that
            with something radically simple: <b>every verified buyer sees their true price,
            computed live from their role and order size.</b>
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container-x">
          <SectionHead eyebrow="Before / after" title="What Changes When Trade Goes Live" />
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {OLD_NEW.map(([oldWay, newWay], i) => (
              <Reveal key={oldWay} delay={i * 60}>
                <div className="card grid gap-0 overflow-hidden sm:grid-cols-2">
                  <div className="border-b border-line bg-paper px-5 py-4 sm:border-b-0 sm:border-r">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-graphite">The old way</p>
                    <p className="mt-1 text-[13.5px] font-semibold text-graphite line-through decoration-[var(--red)]/40">
                      {oldWay}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                      On Helbrede
                    </p>
                    <p className="mt-1 text-[13.5px] font-bold">{newWay}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper py-14">
        <div className="container-x">
          <SectionHead eyebrow="Our pillars" title="Three Promises We Won't Break" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="card h-full p-6">
                  <span className="font-display text-3xl font-black" style={{ color: "var(--gold)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-[17px] font-black">{p.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-graphite">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/register" className="btn-primary">Join as a verified partner</Link>
          </div>
        </div>
      </section>
    </>
  );
}
