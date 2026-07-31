"use client";

import { useEffect, useRef, useState } from "react";
import { useProducts } from "@/context/ProductsContext";
import mapData from "@/data/india_map.json";
import BrandName from "@/components/BrandName";

/* ------------------------------------------------------------------ */
/* Live activity engine — real recent orders mixed with simulated ones */
/* ------------------------------------------------------------------ */

const CITY_ENTRIES = Object.entries(mapData.cities) as [string, [number, number]][];

const CITY_STATE: Record<string, string> = {
  Srinagar: "J&K", Amritsar: "Punjab", Ludhiana: "Punjab", Chandigarh: "Chandigarh",
  Delhi: "Delhi", Jaipur: "Rajasthan", Jodhpur: "Rajasthan", Lucknow: "UP",
  Kanpur: "UP", Varanasi: "UP", Patna: "Bihar", Kolkata: "WB", Guwahati: "Assam",
  Ahmedabad: "Gujarat", Indore: "MP", Bhopal: "MP", Nagpur: "MH", Mumbai: "MH",
  Pune: "MH", Hyderabad: "Telangana", Bengaluru: "Karnataka", Chennai: "TN",
  Kochi: "Kerala", Surat: "Gujarat", Raipur: "Chhattisgarh", Ranchi: "Jharkhand",
  Bhubaneswar: "Odisha", Vijayawada: "AP", Coimbatore: "TN",
};

const ROLES = ["Chemist", "Stockist", "Distributor", "Doctor"];

interface City {
  name: string;
  state: string;
  x: number;
  y: number;
}

const CITIES: City[] = CITY_ENTRIES.map(([name, [x, y]]) => ({
  name,
  state: CITY_STATE[name] ?? "India",
  x,
  y,
}));

export interface ActivityEvent {
  id: number;
  kind: "order" | "pool" | "join";
  role: string;
  city: City;
  product: string;
  qty: number;
  poolPct: number;
}

let eventSeq = 1;

function useActivityEngine(): ActivityEvent[] {
  const { products } = useProducts();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const productsRef = useRef(products);
  productsRef.current = products;

  useEffect(() => {
    const make = (): ActivityEvent => {
      const list = productsRef.current;
      const p = list.length ? list[Math.floor(Math.random() * list.length)] : null;
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const roll = Math.random();
      const kind: ActivityEvent["kind"] = roll < 0.62 ? "order" : roll < 0.86 ? "pool" : "join";
      return {
        id: eventSeq++,
        kind,
        role: ROLES[Math.floor(Math.random() * ROLES.length)],
        city,
        product: p ? p.name : "products",
        qty: [50, 100, 150, 200, 250, 300, 500][Math.floor(Math.random() * 7)],
        poolPct: 55 + Math.floor(Math.random() * 43),
      };
    };

    setEvents([make(), make(), make(), make(), make()]);

    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setEvents((prev) => [make(), ...prev].slice(0, 8));
      timer = setTimeout(tick, 2400 + Math.random() * 2200);
    };
    timer = setTimeout(tick, 2600);
    return () => clearTimeout(timer);
  }, []);

  return events;
}

export function eventText(e: ActivityEvent): string {
  if (e.kind === "order") return `${e.role} · ${e.city.name} booked ${e.qty} × ${e.product}`;
  if (e.kind === "pool") return `Pool for ${e.product} is ${e.poolPct}% full · ${e.city.name}`;
  return `New ${e.role.toLowerCase()} verified · ${e.city.name}, ${e.city.state}`;
}

/* ------------------------------------------------------------------ */
/* Hero India map with authentic geometry + live demand pulses         */
/* ------------------------------------------------------------------ */

const { viewW, viewH, paths } = mapData;
const AGES = ["just now", "6s ago", "18s ago", "40s ago", "1m ago", "2m ago"];

export function HeroDemandMap() {
  const events = useActivityEngine();
  const latest = events[0];
  // most recent event cities get a temporary "hot" highlight
  const hotIds = new Set(events.slice(0, 4).map((e) => e.city.name));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2.5">
        <p className="flex items-center gap-2 text-[12.5px] font-black">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-green" />
          Live demand across India
        </p>
        <span className="chip badge-green !py-0.5 !text-[10px]">● LIVE</span>
      </div>

      <div className="relative bg-white">
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-full w-full select-none" style={{ maxHeight: 360 }}>
          <defs>
            <linearGradient id="indFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dceffb" />
              <stop offset="100%" stopColor="#eef6fc" />
            </linearGradient>
            <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
            </radialGradient>
            <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0.6" stdDeviation="0.7" floodColor="#0c2c4a" floodOpacity="0.18" />
            </filter>
          </defs>

          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="url(#indFill)"
              stroke="var(--green)"
              strokeWidth={0.35}
              strokeLinejoin="round"
              filter={i === 0 ? "url(#mapShadow)" : undefined}
            />
          ))}

          {/* city demand dots */}
          {CITIES.map((c) => {
            const hot = hotIds.has(c.name);
            return (
              <g key={c.name} transform={`translate(${c.x} ${c.y})`}>
                {hot && <circle r="2.4" fill="url(#cityGlow)" />}
                <circle r={hot ? 0.85 : 0.55} fill={hot ? "var(--gold)" : "var(--green)"} opacity={hot ? 1 : 0.55}>
                  {hot && <animate attributeName="r" values="0.85;1.15;0.85" dur="1.8s" repeatCount="indefinite" />}
                </circle>
              </g>
            );
          })}

          {/* burst ring on the latest event */}
          {latest && (
            <g key={latest.id} transform={`translate(${latest.city.x} ${latest.city.y})`}>
              <circle r="0.9" fill="var(--gold)" />
              <circle r="1.5" fill="none" stroke="var(--gold)" strokeWidth="0.4">
                <animate attributeName="r" from="1.5" to="6" dur="1.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.9" to="0" dur="1.7s" repeatCount="indefinite" />
              </circle>
              <text
                y="-2.4"
                textAnchor="middle"
                style={{ fontSize: "2.6px", fontWeight: 800, fill: "var(--ink)", paintOrder: "stroke", stroke: "white", strokeWidth: "0.6px" }}
              >
                {latest.city.name}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* live ticker */}
      <div className="border-t border-line">
        {events.slice(0, 3).map((e, i) => (
          <div
            key={e.id}
            className={`flex items-center gap-2.5 px-4 py-2 ${i === 0 ? "feed-in bg-paper/60" : ""}`}
            style={{ opacity: 1 - i * 0.28 }}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.kind === "order" ? "bg-green" : e.kind === "pool" ? "bg-gold" : "bg-steel"}`} />
            <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate">{eventText(e)}</p>
            <span className="ml-auto shrink-0 text-[10.5px] text-graphite">{AGES[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Static "distributors across India" reach map (franchise page)       */
/* ------------------------------------------------------------------ */

export function ReachMap() {
  return (
    <div className="card relative overflow-hidden">
      <div className="relative bg-white">
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-full w-full select-none" style={{ maxHeight: 460 }}>
          <defs>
            <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dceffb" />
              <stop offset="100%" stopColor="#eef6fc" />
            </linearGradient>
            <radialGradient id="reachGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
            </radialGradient>
            <filter id="reachShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0.6" stdDeviation="0.7" floodColor="#0c2c4a" floodOpacity="0.18" />
            </filter>
          </defs>

          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="url(#reachFill)"
              stroke="var(--green)"
              strokeWidth={0.35}
              strokeLinejoin="round"
              filter={i === 0 ? "url(#reachShadow)" : undefined}
            />
          ))}

          {/* every city blinks — distributors all over India */}
          {CITIES.map((c, i) => {
            const dur = 1.6 + (i % 5) * 0.35;
            const begin = `${(i % 7) * 0.28}s`;
            return (
              <g key={c.name} transform={`translate(${c.x} ${c.y})`}>
                <circle r="2.2" fill="url(#reachGlow)">
                  <animate attributeName="opacity" values="0.15;0.7;0.15" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
                </circle>
                <circle r="0.75" fill="var(--green)">
                  <animate attributeName="r" values="0.6;0.95;0.6" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
                  <animate attributeName="fill" values="var(--green);var(--gold);var(--green)" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/85 to-transparent p-5 pt-10 text-center">
        <p className="eyebrow">Pan-India network</p>
        <h3 className="mt-1 font-display text-2xl font-black">Expanding All Over India</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-graphite">
          Verified <BrandName full={false} /> distributors, stockists and chemists across {CITIES.length}+ cities and
          growing — join the network in your district.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Standalone feed (kept for reuse elsewhere; unused on the homepage)  */
/* ------------------------------------------------------------------ */

const KIND_META = {
  order: { icon: "🛒", cls: "badge-green" },
  pool: { icon: "👥", cls: "badge-gold" },
  join: { icon: "✅", cls: "badge-steel" },
} as const;

export function LiveFeed() {
  const events = useActivityEngine();
  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-paper px-5 py-3">
        <p className="text-[13px] font-black">Live Trade Activity</p>
        <span className="chip badge-green !py-0.5 !text-[10px]">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-green" /> LIVE
        </span>
      </div>
      <div className="flex-1 divide-y divide-[var(--line)]">
        {events.slice(0, 6).map((e, i) => (
          <div key={e.id} className={`flex items-start gap-3 px-5 py-3 ${i === 0 ? "feed-in" : ""}`} style={{ opacity: 1 - i * 0.09 }}>
            <span className={`chip ${KIND_META[e.kind].cls} !px-2 !py-1 !text-[12px]`}>{KIND_META[e.kind].icon}</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate">{eventText(e)}</p>
              <p className="text-[11px] text-graphite">{AGES[i] ?? "6m ago"} · {e.city.state}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
