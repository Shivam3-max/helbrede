"use client";

import { useEffect, useState } from "react";
import { dateShort, inr0 } from "@/lib/format";

interface Lead {
  id: string;
  kind: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  goal?: string | null;
  budget?: number | null;
  note?: string | null;
  createdAt: string;
}

const KIND_LABEL: Record<string, string> = {
  plan: "Custom plan",
  consultation: "Consultation",
  franchise: "Franchise",
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | "plan" | "consultation" | "franchise">("all");

  useEffect(() => {
    fetch("/api/leads").then((r) => r.json()).then((d) => setLeads(d.leads ?? [])).catch(() => {});
  }, []);

  const shown = leads.filter((l) => filter === "all" || l.kind === filter);

  return (
    <div>
      <h1 className="font-display text-2xl font-black">Business Leads</h1>
      <p className="text-[13px] text-graphite">
        Enquiries from the Start-a-Business planner — custom plan requests and consultation bookings.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "plan", "consultation", "franchise"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip !cursor-pointer ${filter === f ? "badge-green !border-green" : "hover:border-ink"}`}
          >
            {f === "all" ? "All" : f === "plan" ? "Plan requests" : f === "consultation" ? "Consultations" : "Franchise"}{" "}
            ({f === "all" ? leads.length : leads.filter((l) => l.kind === f).length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-graphite">No leads yet.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.map((l) => (
            <div key={l.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display text-[15px] font-black">
                  {l.name}{" "}
                  <span className={`chip !py-0.5 !text-[10px] ${l.kind === "plan" ? "badge-gold" : l.kind === "franchise" ? "badge-green" : "badge-steel"}`}>
                    {KIND_LABEL[l.kind] ?? l.kind}
                  </span>
                </p>
                <p className="mt-1 text-[12.5px] text-graphite">
                  {l.phone && <>📞 {l.phone} · </>}
                  {l.city && <>{l.city} · </>}
                  {l.goal && <>Goal: {l.goal} · </>}
                  {l.budget ? <>Budget: {inr0(l.budget)} · </> : null}
                  {dateShort(l.createdAt)}
                </p>
                {l.note && <p className="mt-1 text-[12.5px] text-slate">{l.note}</p>}
              </div>
              {l.phone && (
                <a href={`tel:${l.phone}`} className="btn-ghost !px-4 !py-2 !text-[13px]">
                  Call back
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
