// Live numbers for a real position: mark price, PnL and the chart, updated as
// prices stream in.

import { WINDOW, type MarketData, type Snapshot } from "./hyperliquid";
import type { Position } from "./trading";

export type Candle = { o: number; h: number; l: number; c: number };

// The last 6 hours of candles. The newest one is still forming, so its close
// is the live price (and its wick stretches if the price runs past it).
export function chartPoints(m: MarketData, px: number, count = WINDOW) {
  const closes = m.c.slice(-count);
  const times = m.t.slice(-count);
  closes[closes.length - 1] = px;
  const start = m.t.length - times.length;
  const candles: Candle[] = times.map((_, i) => {
    const j = start + i;
    const c = closes[i];
    return { o: m.o[j], h: Math.max(m.h[j], c), l: Math.min(m.l[j], c), c };
  });
  return { pts: closes, times, candles };
}

export function markOf(coin: string, snap: Snapshot | null, fallback?: number) {
  return snap?.mids[coin] ?? fallback ?? 0;
}

export type Live = {
  mark: number;
  pnl: number; // unrealized PnL now
  roe: number; // % return on the margin used
  chart: ReturnType<typeof chartPoints> | null;
};

export function livePos(p: Position, snap: Snapshot | null, market?: MarketData | null): Live {
  const fallbackMark = p.szi ? p.entryPx + p.upnl / p.szi : p.entryPx;
  const mark = markOf(p.coin, snap, fallbackMark);
  const pnl = p.szi * (mark - p.entryPx);
  const m = snap?.markets[p.coin] ?? market ?? null;
  return { mark, pnl, roe: p.marginUsed ? (pnl / p.marginUsed) * 100 : 0, chart: m ? chartPoints(m, mark) : null };
}

// 24h change in %.
export function dayChange(coin: string, snap: Snapshot | null) {
  const px = snap?.mids[coin], prev = snap?.ctx[coin]?.prevDay;
  return px && prev ? (px / prev - 1) * 100 : 0;
}
