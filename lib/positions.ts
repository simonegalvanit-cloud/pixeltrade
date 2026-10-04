// Turns trade definitions (lib/mock.ts) plus live market data into the numbers
// we show: entry, mark, PnL, return on margin, TP / SL levels and the chart line.

import { POSITIONS, type ClosedDef, type Coin } from "./mock";
import { STEP, WINDOW, type MarketData, type Snapshot } from "./hyperliquid";
import { fmtLevel, fmtPx, niceLevel, pct } from "./format";

// Close price of the candle that started at time t (or the nearest one we have).
function closeAt(m: MarketData, t: number) {
  let best = 0;
  for (let i = 0; i < m.t.length; i++) {
    if (Math.abs(m.t[i] - t) < Math.abs(m.t[best] - t)) best = i;
  }
  return m.c[best];
}

export type Candle = { o: number; h: number; l: number; c: number };

// The last 6 hours of candles. The newest one is still forming, so its close
// is the live price (and its wick stretches if the price runs past it).
export function chartPoints(m: MarketData, count = WINDOW) {
  const closes = m.c.slice(-count);
  const times = m.t.slice(-count);
  closes[closes.length - 1] = m.px;
  const start = m.t.length - times.length;
  const candles: Candle[] = times.map((_, i) => {
    const j = start + i;
    const c = closes[i];
    return { o: m.o[j], h: Math.max(m.h[j], c), l: Math.min(m.l[j], c), c };
  });
  return { pts: closes, times, candles };
}

export type LivePosition = {
  key: string; handle: string; coin: Coin; side: 1 | -1; lev: number; size: number;
  entry: number; mark: number; pnl: number; roe: number;
  tpPx?: number; slPx?: number;
  pts: number[]; candles: Candle[]; entryIndex: number;
};

export function livePosition(key: string, snap: Snapshot | null): LivePosition | null {
  const d = POSITIONS[key];
  const m = d && snap?.markets[d.coin];
  if (!d || !m || !snap) return null;
  const entryT = snap.anchorT - d.ago * STEP;
  const entry = closeAt(m, entryT);
  const mark = m.px;
  const pnl = (d.side * (mark - entry)) / entry * d.size;
  const { pts, times, candles } = chartPoints(m);
  return {
    key, handle: d.handle, coin: d.coin, side: d.side, lev: d.lev, size: d.size,
    entry, mark, pnl, roe: (pnl / (d.size / d.lev)) * 100,
    tpPx: d.tp !== undefined ? niceLevel(entry * (1 + d.tp)) : undefined,
    slPx: d.sl !== undefined ? niceLevel(entry * (1 + d.sl)) : undefined,
    pts, candles, entryIndex: times.findIndex((t) => t >= entryT),
  };
}

export type LiveClosed = { entry: number; exit: number; pnl: number; roe: number };

// A closed trade: the exit is the real price when it closed, the entry is worked
// back from the trade's move, so the result stays what the trader made.
export function closedTrade(d: ClosedDef, snap: Snapshot | null): LiveClosed | null {
  const m = snap?.markets[d.coin];
  if (!m || !snap) return null;
  const exit = closeAt(m, snap.anchorT - d.closedAgo * STEP);
  const entry = exit / (1 + d.side * d.move);
  return { entry, exit, pnl: d.move * d.size, roe: d.move * d.lev * 100 };
}

// 24h change in %.
export function dayChange(m: MarketData | undefined) {
  return m && m.prevDay ? (m.px / m.prevDay - 1) * 100 : 0;
}

// Fill {tp} {sl} {entry}... in a post's text with numbers from its live position.
export function fillText(text: string, p: LivePosition | null) {
  if (!p) return text.replace(/\{\w+\}/g, "…");
  const tpMove = p.tpPx ? p.tpPx / p.entry - 1 : 0;
  const slMove = p.slPx ? p.slPx / p.entry - 1 : 0;
  const vals: Record<string, string> = {
    tp: p.tpPx ? fmtLevel(p.tpPx) : "…",
    sl: p.slPx ? fmtLevel(p.slPx) : "…",
    entry: fmtPx(p.entry),
    dip: fmtLevel(p.entry * (p.side > 0 ? 0.99 : 1.01)),
    e1: fmtPx(p.entry * (p.side > 0 ? 0.9985 : 1.0015)),
    e2: fmtPx(p.entry * (p.side > 0 ? 1.0015 : 0.9985)),
    tpNote: `${pct(tpMove * 100)}, ${pct(tpMove * p.lev * 100, 0)} on margin`,
    slNote: `${pct(slMove * 100)}, ${pct(slMove * p.lev * 100, 0)} on margin`,
  };
  return text.replace(/\{(\w+)\}/g, (_, k) => vals[k] ?? "…");
}
