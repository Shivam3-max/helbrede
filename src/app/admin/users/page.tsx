"use client";

import { useEffect, useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { dateShort } from "@/lib/format";
import { ROLES } from "@/lib/pricing";
import { businessTypeLabel, TURNOVER_BANDS } from "@/lib/registration";
import { Role, User, UserStatus } from "@/lib/types";

type PublicUser = Omit<User, "password">;

const STATES = [
  "Chandigarh", "Delhi", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Punjab", "Rajasthan", "Uttar Pradesh", "Uttarakhand", "Other",
];

interface NewAccount {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  firmName: string;
  drugLicense: string;
  gstNumber: string;
  medicalRegNo: string;
  city: string;
  state: string;
  isAdmin: boolean;
}

const EMPTY: NewAccount = {
  name: "", email: "", password: "", phone: "", role: "chemist",
  firmName: "", drugLicense: "", gstNumber: "", medicalRegNo: "",
  city: "", state: "Punjab", isAdmin: false,
};

export default function AdminUsers() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewAccount>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, Role>>({});

  const load = () =>
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users ?? [])).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const roleFor = (u: PublicUser): Role => roleDraft[u.email] ?? (u.role in ROLES ? (u.role as Role) : "chemist");

  const putUser = async (email: string, body: { role?: Role; status?: UserStatus }) => {
    setActionError(null);
    setBusyEmail(email);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Could not update this account.");
        return;
      }
      await load();
    } catch {
      setActionError("Network error — could not reach the server.");
    } finally {
      setBusyEmail(null);
    }
  };

  const setStatus = (email: string, status: UserStatus) => putUser(email, { status });
  // Approving a pending applicant assigns the role picked in the queue in the same call.
  const approve = (u: PublicUser) => putUser(u.email, { role: roleFor(u), status: "active" });
  const changeRole = (email: string, role: Role) => putUser(email, { role });

  const removeUser = async (u: PublicUser) => {
    if (!confirm(`Delete account "${u.firmName || u.name}" (${u.email})? Their orders stay on record.`)) return;
    setActionError(null);
    setBusyEmail(u.email);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(u.email)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Could not delete this account.");
        return;
      }
      await load();
    } catch {
      setActionError("Network error — could not reach the server.");
    } finally {
      setBusyEmail(null);
    }
  };

  const createAccount = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "active" }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Could not create account.");
    setCreating(false);
    setForm(EMPTY);
    load();
  };

  const pending = users.filter((u) => u.status === "pending");
  const rest = users.filter((u) => u.status !== "pending");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black">Users &amp; Accounts</h1>
          <p className="text-[13px] text-graphite">
            {users.length} accounts · {pending.length} awaiting verification
          </p>
        </div>
        <button className="btn-primary !px-5 !py-2.5 !text-[13px]" onClick={() => { setCreating(true); setError(null); }}>
          + Create Account
        </button>
      </div>

      {actionError && (
        <p className="mt-4 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--red)]">
          {actionError}
        </p>
      )}

      {/* pending queue */}
      <h2 className="mt-6 font-display text-[15px] font-black">Verification queue</h2>
      {pending.length === 0 ? (
        <div className="card mt-3 p-6 text-center text-[13px] text-graphite">Queue is clear. ✓</div>
      ) : (
        <div className="mt-3 space-y-3">
          {pending.map((u) => (
            <div key={u.email} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display text-[15px] font-black">
                  {u.firmName || u.name}{" "}
                  <span className="chip badge-steel !py-0.5 !text-[10px]">
                    {u.role in ROLES ? ROLES[u.role as Role].label : "No role yet"}
                  </span>
                  {businessTypeLabel(u.businessType) && u.businessType !== u.role && (
                    <span className="chip !py-0.5 !text-[10px]">{businessTypeLabel(u.businessType)}</span>
                  )}
                  {u.turnoverBand && (
                    <span className="chip !py-0.5 !text-[10px]">
                      {TURNOVER_BANDS.find((b) => b.id === u.turnoverBand)?.label ?? u.turnoverBand}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[12.5px] text-graphite">
                  {[u.name, u.email, u.phone, [u.city, u.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                </p>
                <p className="text-[12.5px] font-semibold">
                  {u.drugLicense && <>DL: {u.drugLicense} · </>}
                  {u.gstNumber && <>GST: {u.gstNumber} · </>}
                  {u.medicalRegNo && <>Reg: {u.medicalRegNo} · </>}
                  applied {dateShort(u.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="input !w-auto !py-2 !text-[12.5px]"
                  value={roleFor(u)}
                  onChange={(e) => setRoleDraft({ ...roleDraft, [u.email]: e.target.value as Role })}
                >
                  {(Object.keys(ROLES) as Role[]).map((r) => (
                    <option key={r} value={r}>{ROLES[r].label}</option>
                  ))}
                </select>
                <button
                  className="btn-primary !px-4 !py-2 !text-[13px] disabled:opacity-40"
                  disabled={busyEmail === u.email}
                  onClick={() => approve(u)}
                >
                  {busyEmail === u.email ? "…" : "Approve"}
                </button>
                <button
                  className="btn-ghost !px-4 !py-2 !text-[13px] disabled:opacity-40"
                  disabled={busyEmail === u.email}
                  onClick={() => setStatus(u.email, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* all users */}
      <h2 className="mt-8 font-display text-[15px] font-black">All accounts</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-graphite">
              <th className="px-4 py-2.5">Account</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Credentials</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((u) => (
              <tr key={u.email} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">
                  <p className="font-bold">{u.firmName || u.name}</p>
                  <p className="text-graphite">{u.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  {u.isAdmin ? (
                    <span className="chip badge-gold !py-0.5 !text-[10px]">Admin</span>
                  ) : (
                    <select
                      className="input !w-auto !py-1 !text-[12.5px]"
                      value={roleFor(u)}
                      disabled={busyEmail === u.email}
                      onChange={(e) => changeRole(u.email, e.target.value as Role)}
                    >
                      {(Object.keys(ROLES) as Role[]).map((r) => (
                        <option key={r} value={r}>{ROLES[r].label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-2.5 text-graphite">{u.city || "—"}{u.state ? `, ${u.state}` : ""}</td>
                <td className="px-4 py-2.5 text-graphite">{u.drugLicense || u.medicalRegNo || "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`chip !py-0.5 !text-[10px] ${u.status === "active" ? "badge-green" : "badge-red"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {!u.isAdmin && (
                    <div className="flex justify-end gap-1.5">
                      {u.status === "active" ? (
                        <button
                          className="btn-ghost !px-3 !py-1 !text-[11px] disabled:opacity-40"
                          disabled={busyEmail === u.email}
                          onClick={() => setStatus(u.email, "rejected")}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="btn-ghost !px-3 !py-1 !text-[11px] disabled:opacity-40"
                          disabled={busyEmail === u.email}
                          onClick={() => setStatus(u.email, "active")}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        className="btn-ghost !px-3 !py-1 !text-[11px] hover:!border-[var(--red)] hover:!text-[var(--red)] disabled:opacity-40"
                        disabled={busyEmail === u.email}
                        onClick={() => removeUser(u)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* create account drawer */}
      {creating && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setCreating(false)}>
          <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-black">Create account</h2>
              <button className="text-graphite hover:text-ink" onClick={() => setCreating(false)}>✕</button>
            </div>
            <p className="mt-1 text-[12.5px] text-graphite">
              Created accounts are instantly active — share the email &amp; password with the partner.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={form.isAdmin ? "admin" : form.role}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "admin") setForm({ ...form, isAdmin: true });
                    else setForm({ ...form, isAdmin: false, role: v as Role });
                  }}
                >
                  {(Object.keys(ROLES) as Role[]).map((r) => (
                    <option key={r} value={r}>{ROLES[r].label}</option>
                  ))}
                  <option value="admin">Admin (full panel access)</option>
                </select>
              </div>
              <div>
                <label className="label">Contact person *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Password *</label>
                <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Firm / clinic name</label>
                <input className="input" value={form.firmName} onChange={(e) => setForm({ ...form, firmName: e.target.value })} />
              </div>
              {!form.isAdmin && form.role !== "doctor" && (
                <>
                  <div>
                    <label className="label">Drug license no.</label>
                    <input className="input" value={form.drugLicense} onChange={(e) => setForm({ ...form, drugLicense: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">GST number</label>
                    <input className="input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                  </div>
                </>
              )}
              {!form.isAdmin && form.role === "doctor" && (
                <div className="sm:col-span-2">
                  <label className="label">Medical registration no.</label>
                  <input className="input" value={form.medicalRegNo} onChange={(e) => setForm({ ...form, medicalRegNo: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="label">State</label>
                <select className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--red)]">{error}</p>
            )}
            <div className="mt-5 flex gap-2">
              <button className="btn-primary flex-1 disabled:opacity-40" disabled={saving} onClick={createAccount}>
                {saving ? "Creating…" : "Create active account"}
              </button>
              <button className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
