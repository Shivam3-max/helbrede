"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/pricing";
import { Role } from "@/lib/types";

const STATES = [
  "Chandigarh", "Delhi", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Punjab", "Rajasthan", "Uttar Pradesh", "Uttarakhand", "Other",
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("chemist");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "", email: "", password: "", phone: "", firmName: "",
    drugLicense: "", gstNumber: "", medicalRegNo: "", city: "", state: "Punjab",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const needsLicense = role !== "doctor";

  if (done) {
    return (
      <section className="grid-bg py-16">
        <div className="container-x">
          <div className="card mx-auto max-w-md p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-soft text-2xl">✓</span>
            <h1 className="mt-4 font-display text-2xl font-black">Application submitted!</h1>
            <p className="mt-2 text-[14px] text-graphite">
              Our team will verify your {needsLicense ? "drug license and GST" : "registration"}{" "}
              details — typically within one working day. You&apos;ll be able to login once
              approved.
            </p>
            <p className="mt-3 rounded-lg bg-paper px-4 py-3 text-[12.5px] text-graphite">
              Demo tip: login as <b>Admin</b> and approve your own application from the
              verification queue.
            </p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">Back to login</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid-bg py-16">
      <div className="container-x">
        <div className="card mx-auto max-w-2xl p-7">
          <p className="eyebrow">Free registration</p>
          <h1 className="mt-2 font-display text-2xl font-black">Register your business</h1>
          <p className="mt-1 text-[13.5px] text-graphite">
            Verified partners see fixed role-based trade rates on all 360+ SKUs.
          </p>

          <p className="label mt-6">I am a…</p>
          <div className="grid gap-2 sm:grid-cols-4">
            {(Object.keys(ROLES) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border px-3 py-3 text-[13px] font-bold transition-all ${
                  role === r
                    ? "border-green bg-green-soft text-[var(--green)]"
                    : "border-line hover:border-ink"
                }`}
              >
                {ROLES[r].label}
              </button>
            ))}
          </div>

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const err = await register({
                name: f.name, email: f.email, password: f.password, phone: f.phone,
                role,
                firmName: f.firmName || undefined,
                drugLicense: needsLicense ? f.drugLicense : undefined,
                gstNumber: needsLicense ? f.gstNumber : undefined,
                medicalRegNo: role === "doctor" ? f.medicalRegNo : undefined,
                city: f.city, state: f.state,
              });
              if (err) setError(err);
              else setDone(true);
            }}
          >
            <div>
              <label className="label">Contact person *</label>
              <input className="input" required value={f.name} onChange={set("name")} />
            </div>
            <div>
              <label className="label">{role === "doctor" ? "Clinic name" : "Firm name *"}</label>
              <input className="input" required={role !== "doctor"} value={f.firmName} onChange={set("firmName")} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" required value={f.email} onChange={set("email")} />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" type="tel" required value={f.phone} onChange={set("phone")} />
            </div>
            {needsLicense ? (
              <>
                <div>
                  <label className="label">Drug license no. (20B/21B) *</label>
                  <input className="input" required placeholder="e.g. PB-20B-114455" value={f.drugLicense} onChange={set("drugLicense")} />
                </div>
                <div>
                  <label className="label">GST number *</label>
                  <input className="input" required placeholder="e.g. 03AAACV1234F1Z5" value={f.gstNumber} onChange={set("gstNumber")} />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="label">Medical registration no. *</label>
                <input className="input" required placeholder="e.g. PMC-56789" value={f.medicalRegNo} onChange={set("medicalRegNo")} />
              </div>
            )}
            <div>
              <label className="label">City *</label>
              <input className="input" required value={f.city} onChange={set("city")} />
            </div>
            <div>
              <label className="label">State *</label>
              <select className="input" value={f.state} onChange={set("state")}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Password *</label>
              <input className="input" type="password" required minLength={6} value={f.password} onChange={set("password")} />
            </div>
            {error && (
              <p className="sm:col-span-2 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--red)]">
                {error}
              </p>
            )}
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full">Submit for verification</button>
              <p className="mt-2 text-center text-[11.5px] text-graphite">
                By registering you confirm your trade credentials are valid and current.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
