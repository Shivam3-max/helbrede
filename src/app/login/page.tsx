"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageTitle from "@/components/PageTitle";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (em: string, pw: string) => {
    const err = await login(em, pw);
    if (err) return setError(err);
    router.push(em === "admin@helbrede.com" ? "/admin" : "/dashboard");
  };

  return (
    <section className="grid-bg py-16">
      <PageTitle title="Partner Login | HELBREDE HEALTHCARE" />
      <div className="container-x">
        <div className="card mx-auto max-w-md p-7">
          <p className="eyebrow">Partner login</p>
          <h1 className="mt-2 font-display text-2xl font-black">Welcome back</h1>
          <p className="mt-1 text-[13.5px] text-graphite">
            Login to unlock your trade prices across the catalog.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit(email, password);
            }}
          >
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && (
              <p className="rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--red)]">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full">Login</button>
          </form>
          <p className="mt-4 text-center text-[13px] text-graphite">
            New here?{" "}
            <Link href="/register" className="font-bold" style={{ color: "var(--green)" }}>
              Register your business free →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
