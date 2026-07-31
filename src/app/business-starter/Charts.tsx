"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- animated number ---------- */

export function CountUp({
  value,
  format = (n) => Math.round(n).toString(),
  className,
  style,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  shownRef.current = shown;

  useEffect(() => {
    const from = shownRef.current;
    const to = value;
    if (from === to) return;
    const steps = 16;
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= steps) {
        setShown(to);
        clearInterval(id);
      } else {
        const t = i / steps;
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(from + (to - from) * eased);
      }
    }, 28);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className} style={style}>
      {format(shown)}
    </span>
  );
}

/* ---------- donut ---------- */

export function Donut({
  data,
  size = 150,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--warm)" strokeWidth="16" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              style={{ transition: "stroke-dasharray .5s, stroke-dashoffset .5s" }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="truncate font-semibold text-slate">{d.label}</span>
            <span className="ml-auto shrink-0 font-bold text-graphite">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- horizontal bars ---------- */

export function BarChart({
  data,
  suffix = "",
}: {
  data: { label: string; value: number; color: string }[];
  suffix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-[12px] font-semibold">
            <span className="text-slate">{d.label}</span>
            <span className="text-graphite">
              {Math.round(d.value)}
              {suffix}
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color, transition: "width .5s" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- line chart (break-even / ROI) ---------- */

export interface LineSeries {
  name: string;
  color: string;
  points: [number, number][];
  dashed?: boolean;
}

export function LineChart({
  series,
  xLabels,
  yFormat = (n) => Math.round(n).toString(),
  marker,
  height = 200,
}: {
  series: LineSeries[];
  xLabels: string[];
  yFormat?: (n: number) => string;
  marker?: { x: number; label: string };
  height?: number;
}) {
  const W = 320;
  const H = height;
  const padL = 44;
  const padB = 24;
  const padT = 10;
  const padR = 10;
  const allX = series.flatMap((s) => s.points.map((p) => p[0]));
  const allY = series.flatMap((s) => s.points.map((p) => p[1]));
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const maxY = Math.max(...allY, 1);
  const minY = Math.min(...allY, 0);

  const sx = (x: number) => padL + ((x - minX) / (maxX - minX || 1)) * (W - padL - padR);
  const sy = (y: number) => padT + (1 - (y - minY) / (maxY - minY || 1)) * (H - padT - padB);

  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* y grid + labels */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const val = minY + ((maxY - minY) * i) / yTicks;
        const y = sy(val);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--line)" strokeWidth="0.5" />
            <text x={padL - 5} y={y + 3} textAnchor="end" style={{ fontSize: 8, fill: "var(--graphite)" }}>
              {yFormat(val)}
            </text>
          </g>
        );
      })}
      {/* x labels */}
      {xLabels.map((lb, i) => {
        const x = padL + (i / (xLabels.length - 1 || 1)) * (W - padL - padR);
        return (
          <text key={i} x={x} y={H - 8} textAnchor="middle" style={{ fontSize: 8, fill: "var(--graphite)" }}>
            {lb}
          </text>
        );
      })}
      {/* marker (break-even / payback) */}
      {marker && (
        <g>
          <line x1={sx(marker.x)} y1={padT} x2={sx(marker.x)} y2={H - padB} stroke="var(--gold)" strokeWidth="1" strokeDasharray="3 3" />
          <text x={sx(marker.x)} y={padT + 8} textAnchor="middle" style={{ fontSize: 8, fontWeight: 800, fill: "#8a6b30" }}>
            {marker.label}
          </text>
        </g>
      )}
      {/* series */}
      {series.map((s, i) => (
        <polyline
          key={i}
          points={s.points.map((p) => `${sx(p[0])},${sy(p[1])}`).join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray={s.dashed ? "4 3" : undefined}
        />
      ))}
    </svg>
  );
}
