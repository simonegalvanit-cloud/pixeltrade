"use client";

import { useState } from "react";
import { usd, usdBig, usdShort } from "@/lib/format";
import { livePos } from "@/lib/positions";
import type { Position } from "@/lib/trading";
import Avatar from "./Avatar";
import { useMarket } from "./Market";

// Big avatar with the live total of all open positions.
export function LiveAvatar({ address, positions, size, label }: { address: string; positions: Position[]; size: number; label: string }) {
  const { snap } = useMarket();
  const total = positions.reduce((a, p) => a + livePos(p, snap).pnl, 0);
  return <Avatar seed={address} size={size} label={label} ring={positions.length ? (total >= 0 ? "up" : "down") : undefined} live={positions.length ? usdShort(total) : undefined} />;
}

export function LiveTotal({ positions }: { positions: Position[] }) {
  const { snap } = useMarket();
  if (!positions.length) return <span>Not in a match right now</span>;
  const total = positions.reduce((a, p) => a + livePos(p, snap).pnl, 0);
  return <span>{positions.length} live match{positions.length > 1 ? "es" : ""}: <b className={total >= 0 ? "up" : "down"}>{usdBig(total)}</b></span>;
}

// PnL over time, straight from Hyperliquid's portfolio history.
export function PnlHistory({ series }: { series: Record<"7D" | "30D" | "All", [number, number][]> }) {
  const [w, setW] = useState<"7D" | "30D" | "All">("30D");
  const pts = series[w];
  const W = 600, H = 170;
  let chart = <p className="muted mono" style={{ margin: 0 }}>No history yet.</p>;
  if (pts.length > 1) {
    const vals = pts.map((p) => p[1]);
    const mn = Math.min(0, ...vals), mx = Math.max(0, ...vals), pad = (mx - mn) * 0.12 || 1;
    const t0 = pts[0][0], t1 = pts[pts.length - 1][0];
    const x = (t: number) => ((t - t0) / (t1 - t0 || 1)) * W;
    const y = (v: number) => H - ((v - (mn - pad)) / (mx + pad - (mn - pad))) * H;
    const d = pts.map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const up = vals[vals.length - 1] >= vals[0];
    const col = up ? "#39FF88" : "#FF3D7F";
    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="pnl-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col} stopOpacity=".3" /><stop offset="1" stopColor={col} stopOpacity="0" /></linearGradient></defs>
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--line-2)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <path d={`${d}L${W},${H}L0,${H}Z`} fill="url(#pnl-g)" />
        <path d={d} fill="none" stroke={col} strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${col})` }} />
      </svg>
    );
  }
  const last = pts.length ? pts[pts.length - 1][1] - pts[0][1] : 0;
  return (
    <div className="box pnlchart">
      <h3>
        PnL from the chain <span className={`mono ${last >= 0 ? "up" : "down"}`} style={{ fontSize: 12 }}>{usd(last, 0)}</span>
        <span className="seg" role="group" aria-label="Range">
          {(["7D", "30D", "All"] as const).map((k) => <button key={k} type="button" className={k === w ? "on" : ""} aria-pressed={k === w} onClick={() => setW(k)}>{k}</button>)}
        </span>
      </h3>
      {chart}
    </div>
  );
}
