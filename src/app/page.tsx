import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import BrandName from "@/components/BrandName";
import ProductImage from "@/components/ProductImage";
import { HeroDemandMap } from "@/components/LiveActivity";
import { groupsOf } from "@/lib/data";
import { listProducts } from "@/lib/db";
import { ROLES } from "@/lib/pricing";
import { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATS = [
  { value: "359", label: "Live SKUs" },
  { value: "13", label: "Categories" },
  { value: "4", label: "Buyer tiers" },
  { value: "Net", label: "Distributor rates" },
  { value: "GST", label: "Invoicing built-in" },
  { value: "9", label: "States served" },
];

const ROLE_ICONS: Record<Role, string> = {
  distributor: "M3 21V8l9-5 9 5v13H3zm9-9a2 2 0 100-4 2 2 0 000 4z",
  stockist: "M4 21V7l8-4 8 4v14H4zm4-8h8m-8 4h8",
  chemist: "M6 21h12M9 3h6v6l3 9H6l3-9V3z",
  doctor: "M12 3v6m-3-3h6M5 21a7 7 0 0114 0",
};

const ROLE_TIER: Record<Role, string> = {
  distributor: "Net distributor rate",
  stockist: "Distributor +20%",
  chemist: "Distributor +44%",
  doctor: "Clinic dispensing rate",
};

const STEPS = [
  {
    title: "Register with your license",
    body: "Pick your role — stockist, distributor, chemist or doctor — and submit your drug license / GST / registration details.",
  },
  {
    title: "Get verified & see your rate",
    body: "Our team verifies your credentials. Instantly the whole catalog switches from MRP to your fixed role-based trade rate.",
  },
  {
    title: "Order in bulk, one clear rate",
    body: "Every product shows one transparent price for your role — distributor, stockist, chemist or doctor. Add to cart and check out.",
  },
  {
    title: "Track, reorder, grow",
    body: "GST invoices, order tracking, one-click reorder — plus calculators and franchise tools to scale your business.",
  },
];

export default async function Home() {
  const products = await listProducts();
  const groupCounts = groupsOf(products)
    .map((g) => ({
      name: g,
      count: products.filter((p) => p.group === g).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      {/* HERO */}
      <section className="grid-bg relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-gold-soft blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-64 h-[380px] w-[380px] rounded-full bg-green-soft blur-3xl" />
        <div className="container-x relative grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-20">
          <div>
            <Reveal>
              <span className="chip badge-gold">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
                A decade of <BrandName /> · now online
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] sm:text-5xl lg:text-[3.4rem]">
                {/* Two-tone brand wordmark, matching the logo */}
                <BrandName />,{" "}
                <br className="hidden sm:block" />
                now booking in{" "}
                <span className="relative inline-block">
                  <span style={{ color: "var(--green)" }}>Bulk Online</span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    height="8"
                    viewBox="0 0 120 8"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 6 Q60 0 118 5"
                      stroke="var(--gold)"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-graphite">
                The complete <BrandName full={false} /> range — 360+ pharma, Ayurvedic and nutraceutical products —
                booked in bulk at transparent trade rates for stockists, distributors, chemists
                and doctors. No phone calls, no PDF price lists, no haggling.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/products" className="btn-primary">
                  Browse 360+ Products
                </Link>
                <Link href="/register" className="btn-gold">
                  Register Your Business
                </Link>
                <Link href="/tools" className="btn-ghost">
                  Trade Calculators
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="chip">License-verified buyers</span>
                <span className="chip">Role-based trade pricing</span>
                <span className="chip">GST invoicing</span>
                <span className="chip">Net distributor rates</span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <HeroDemandMap />
          </Reveal>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-line bg-paper py-14">
        <div className="container-x">
          <SectionHead
            eyebrow="Trade, digitized"
            title="The Pharma Trade Counter, Rebuilt Online"
          />
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 60}>
                <div className="card h-full p-4 text-center">
                  <p className="font-display text-2xl font-black" style={{ color: "var(--green)" }}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-graphite">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="py-16">
        <div className="container-x">
          <SectionHead
            eyebrow="Who it's for"
            title="Every Buyer Gets Their Own Rate"
            sub="The same product, four fixed trade rates — one for each role in the channel."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(ROLES) as Role[]).map((r, i) => (
              <Reveal key={r} delay={i * 80}>
                <Link href="/register" className="card card-hover block h-full p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-soft">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d={ROLE_ICONS[r]} />
                    </svg>
                  </span>
                  <h3 className="mt-4 font-display text-[17px] font-black">{ROLES[r].label}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-graphite">{ROLES[r].blurb}</p>
                  <p className="mt-3 text-[12.5px] font-bold" style={{ color: "var(--gold)" }}>
                    {ROLE_TIER[r]} →
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-line bg-paper py-16">
        <div className="container-x">
          <SectionHead eyebrow="How it works" title="From License to First Order in 4 Steps" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="card h-full p-5">
                  <span className="font-display text-3xl font-black" style={{ color: "var(--gold)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-[16px] font-black">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-graphite">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16">
        <div className="container-x">
          <SectionHead
            eyebrow="The catalog"
            title={<>Every <BrandName full={false} /> Range, Ready to Book</>}
            sub="Complete live catalog — allopathic, Ayurvedic, nutraceutical and personal care."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {groupCounts.map((g, i) => (
              <Reveal key={g.name} delay={i * 60}>
                <Link
                  href={`/products?group=${encodeURIComponent(g.name)}`}
                  className="card card-hover block overflow-hidden p-3"
                >
                  <ProductImage className="aspect-[5/3] w-full" label="Category image" />
                  <div className="px-1.5 pb-1 pt-3">
                    <h3 className="font-display text-[14.5px] font-black leading-tight">{g.name}</h3>
                    <p className="mt-0.5 text-[12px] font-semibold text-graphite">
                      {g.count} products →
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS TOOLS */}
      <section className="border-y border-line bg-paper py-16">
        <div className="container-x">
          <SectionHead
            eyebrow="Beyond ordering"
            title="Start & Scale Your Pharma Business Here"
            sub="Not just a catalog — a toolkit for anyone building a pharma trade business."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Reveal>
              <Link href="/tools" className="card card-hover block h-full p-6">
                <span className="chip badge-gold">6 free calculators</span>
                <h3 className="mt-4 font-display text-lg font-black">Trade Calculators</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-graphite">
                  PTR/PTS, margin per product, scheme converter, GST, breakeven and ROI projector —
                  wired to real catalog prices.
                </p>
                <p className="mt-3 text-[13px] font-bold" style={{ color: "var(--green)" }}>
                  Open the toolkit →
                </p>
              </Link>
            </Reveal>
            <Reveal delay={80}>
              <Link href="/business-starter" className="card card-hover block h-full p-6">
                <span className="chip badge-green">Guided setup</span>
                <h3 className="mt-4 font-display text-lg font-black">Business Starter</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-graphite">
                  Enter your budget, get a recommended starter basket with projected margins — plus
                  the license &amp; GST checklist to launch legally.
                </p>
                <p className="mt-3 text-[13px] font-bold" style={{ color: "var(--green)" }}>
                  Plan my launch →
                </p>
              </Link>
            </Reveal>
            <Reveal delay={160}>
              <Link href="/franchise" className="card card-hover block h-full p-6">
                <span className="chip badge-steel">Monopoly rights</span>
                <h3 className="mt-4 font-display text-lg font-black">Franchise Territories</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-graphite">
                  Claim exclusive district-level monopoly rights. See which territories are open
                  right now and apply in two minutes.
                </p>
                <p className="mt-3 text-[13px] font-bold" style={{ color: "var(--green)" }}>
                  Check my district →
                </p>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-x">
          <Reveal>
            <div className="card grid-bg relative overflow-hidden p-8 text-center sm:p-12">
              <div className="pointer-events-none absolute -right-24 -top-24 h-[280px] w-[280px] rounded-full bg-gold-soft blur-3xl" />
              <p className="eyebrow">Join the revolution</p>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                Stop Ordering Over WhatsApp. Start Booking at Slab Prices.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] text-graphite">
                Registration is free. Verification takes one working day. Your prices are waiting.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="btn-primary">
                  Register Free
                </Link>
                <Link href="/login" className="btn-ghost">
                  Partner Login
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
