"use client";

import Link from "next/link";
import { useState } from "react";
import PageTitle from "@/components/PageTitle";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { BUSINESS_TYPES, BusinessType, TURNOVER_BANDS, TurnoverBand } from "@/lib/registration";

const STATES = [
  "Chandigarh", "Delhi", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Punjab", "Rajasthan", "Uttar Pradesh", "Uttarakhand", "Other",
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [band, setBand] = useState<TurnoverBand>("upto25");
  const [businessType, setBusinessType] = useState<BusinessType>("chemist");
  const [f, setF] = useState({
    name: "", email: "", password: "", phone: "", firmName: "",
    drugLicense: "", gstNumber: "", medicalRegNo: "", city: "", state: "Punjab",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  if (done) {
    return (
      <section className="grid-bg py-16">
        <div className="container-x">
          <div className="card mx-auto max-w-md p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-soft text-2xl">✓</span>
            <h1 className="mt-4 font-display text-2xl font-black">Application received</h1>
            <p className="mt-2 text-[14px] text-graphite">
              Our team will verify your details and set up your account&apos;s trade role and pricing tier.
              You&apos;ll be able to log in as soon as it&apos;s approved.
            </p>
            <p className="mt-3 rounded-lg bg-paper px-4 py-3 text-left text-[12.5px] text-graphite">
              <span className="font-bold text-ink">Your login details</span><br />
              Email: <b>{f.email}</b><br />
              Password: the one you just set<br />
              Try logging in anytime at <b>/login</b> — you&apos;ll get a message if you&apos;re still awaiting approval.
            </p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">Go to login →</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid-bg py-16">
      <PageTitle title="Register Your Business | HELBREDE HEALTHCARE" />
      <div className="container-x">
        <div className="card mx-auto max-w-2xl p-7">
          <p className="eyebrow">Free registration</p>
          <h1 className="mt-2 font-display text-2xl font-black">Register your business</h1>
          <p className="mt-1 text-[13.5px] text-graphite">
            Tell us your annual turnover — our team verifies your details and activates your account
            with the right trade role (distributor / stockist / chemist / doctor) and pricing tier.
            Nothing here is mandatory except contact, email and password.
          </p>

          <p className="label mt-6">Annual turnover</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {TURNOVER_BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBand(b.id)}
                className={`rounded-xl border px-3 py-3 text-center transition-all ${
                  band === b.id
                    ? "border-green bg-green-soft text-[var(--green)]"
                    : "border-line hover:border-ink"
                }`}
              >
                <span className="block text-[13px] font-bold">{b.label}</span>
              </button>
            ))}
          </div>

          {band === "upto25" && (
            <div className="mt-4">
              <label className="label">What best describes you?</label>
              <select
                className="input"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const err = await register({
                name: f.name, email: f.email, password: f.password, phone: f.phone,
                firmName: f.firmName || undefined,
                drugLicense: f.drugLicense || undefined,
                gstNumber: f.gstNumber || undefined,
                medicalRegNo: f.medicalRegNo || undefined,
                city: f.city || undefined,
                state: f.state || undefined,
                turnoverBand: band,
                businessType: band === "upto25" ? businessType : undefined,
              });
              if (err) {
                setError(err);
                setSubmitting(false);
                return;
              }
              setDone(true);
            }}
          >
            <div>
              <label className="label">Contact person *</label>
              <input className="input" required value={f.name} onChange={set("name")} />
            </div>
            <div>
              <label className="label">Firm / clinic name</label>
              <input className="input" value={f.firmName} onChange={set("firmName")} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" required value={f.email} onChange={set("email")} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" value={f.phone} onChange={set("phone")} />
            </div>
            <div>
              <label className="label">Drug license no. (20B/21B)</label>
              <input className="input" placeholder="e.g. PB-20B-114455" value={f.drugLicense} onChange={set("drugLicense")} />
            </div>
            <div>
              <label className="label">GST number</label>
              <input className="input" placeholder="e.g. 03AAACV1234F1Z5" value={f.gstNumber} onChange={set("gstNumber")} />
            </div>
            <div>
              <label className="label">Medical registration no. (doctors)</label>
              <input className="input" placeholder="e.g. PMC-56789" value={f.medicalRegNo} onChange={set("medicalRegNo")} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={f.city} onChange={set("city")} />
            </div>
            <div>
              <label className="label">State</label>
              <select className="input" value={f.state} onChange={set("state")}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Password *</label>
              <PasswordInput required minLength={6} value={f.password} onChange={set("password")} autoComplete="new-password" />
            </div>
            {error && (
              <p className="sm:col-span-2 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--red)]">
                {error}
              </p>
            )}
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-40">
                {submitting ? "Submitting…" : "Submit application"}
              </button>
              <p className="mt-2 text-center text-[11.5px] text-graphite">
                Your account activates once our team verifies your details — usually within 24 hours.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
