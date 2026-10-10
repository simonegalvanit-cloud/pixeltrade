// Turns raw Hyperliquid wallet data into what perpy shows: players, positions,
// closed trades ("matches"), win rate, streaks and the arcade stats.
// Everything here is calculated from real onchain activity.

import type { RawFill, RawOrder, RawPortfolio, RawState } from "./hyperliquid";

export type Win = "day" | "week" | "month" | "allTime";
export type Perf = { pnl: number; roi: number; vlm: number };

// A perpy member as a player: who they are plus their real trading stats.
export type Player = {
  address: string; // their wallet
  handle: string; // @handle
  name: string; // display name
  named: boolean; // kept for the verified tick (always true for members)
  accountValue: number;
  perf: Record<Win, Perf>;
};

export type Position = {
  address: string;
  coin: string;
  szi: number; // size in coins, negative = short
  entryPx: number;
  lev: number;
  levType: "cross" | "isolated";
  marginUsed: number;
  liqPx: number | null;
  posValue: number; // size in dollars
  upnl: number; // unrealized PnL when we fetched it
  funding: number; // funding paid since open (positive = paid)
  tp?: number;
  sl?: number;
};

export type ClosedTrade = {
  id: string;
  address: string;
  coin: string;
  side: 1 | -1; // the side of the position that was closed
  sz: number;
  exitPx: number;
  entryPx: number;
  pnl: number; // realized PnL after fees
  fees: number;
  time: number;
};

// ---------- players ----------

const WIN_KEY: Record<Win, string> = { day: "perpDay", week: "perpWeek", month: "perpMonth", allTime: "perpAllTime" };

// Stats per time window from Hyperliquid's portfolio history for the wallet.
export function perfFromPortfolio(pf: RawPortfolio): Record<Win, Perf> {
  const out = {} as Record<Win, Perf>;
  for (const w of Object.keys(WIN_KEY) as Win[]) {
    const d = pf.find(([k]) => k === WIN_KEY[w])?.[1];
    const pnl = d?.pnlHistory ?? [];
    const av = d?.accountValueHistory ?? [];
    const gain = pnl.length ? +pnl[pnl.length - 1][1] - (w === "allTime" ? 0 : +pnl[0][1]) : 0;
    const start = av.length ? Math.max(...av.slice(0, 1).map((x) => +x[1]), 0) : 0;
    out[w] = { pnl: gain, roi: start > 0 ? gain / start : 0, vlm: d ? +d.vlm : 0 };
  }
  return out;
}

export function playerFrom(m: { wallet: string; handle: string; name: string }, pf: RawPortfolio, accountValue: number): Player {
  return { address: m.wallet, handle: m.handle, name: m.name, named: true, accountValue, perf: perfFromPortfolio(pf) };
}

// Arcade level from all-time trading volume: $10K ≈ LV.12, $1M ≈ LV.36, $1B ≈ LV.72.
export function levelOf(p: Player) {
  const v = Math.max(1, p.perf.allTime.vlm);
  return Math.max(1, Math.min(99, Math.round(Math.log10(v / 1000) * 12)));
}

// Progress toward the next level, 0..1.
export function xpOf(p: Player) {
  const x = Math.log10(Math.max(1, p.perf.allTime.vlm) / 1000) * 12;
  return Math.max(0, Math.min(1, x - Math.floor(x)));
}

// Character class, from how they actually trade.
export function classOf(p: Player, positions: Position[] = []) {
  const notional = positions.reduce((a, x) => a + x.posValue, 0);
  const net = positions.reduce((a, x) => a + Math.sign(x.szi) * x.posValue, 0);
  const avgLev = notional ? positions.reduce((a, x) => a + x.lev * x.posValue, 0) / notional : 0;
  if (p.accountValue >= 5_000_000) return "WHALE";
  if (avgLev >= 15) return "DEGEN";
  if (p.perf.month.roi >= 0.5) return "SNIPER";
  if (notional && net < -notional * 0.5) return "BEAR";
  if (notional && net > notional * 0.5) return "BULL";
  if (p.perf.month.vlm > p.accountValue * 100) return "SCALPER";
  return "TRADER";
}

// ---------- positions ----------

// TP / SL: trigger orders that would close part of the position.
function tpsl(orders: RawOrder[], coin: string, szi: number) {
  let tp: number | undefined, sl: number | undefined;
  for (const o of orders) {
    if (o.coin !== coin || !o.isTrigger || !(o.reduceOnly || o.isPositionTpsl)) continue;
    const px = +o.triggerPx;
    if (!px) continue;
    const isTp = /take profit/i.test(o.orderType);
    const isSl = /stop/i.test(o.orderType);
    // Keep the trigger nearest to entry on each side.
    if (isTp && (tp === undefined || (szi > 0 ? px < tp : px > tp))) tp = px;
    if (isSl && (sl === undefined || (szi > 0 ? px > sl : px < sl))) sl = px;
  }
  return { tp, sl };
}

export function parsePositions(address: string, s: RawState, orders: RawOrder[] = []): Position[] {
  return s.assetPositions.map(({ position: p }) => {
    const szi = +p.szi;
    return {
      address: address.toLowerCase(),
      coin: p.coin,
      szi,
      entryPx: +p.entryPx,
      lev: p.leverage.value,
      levType: p.leverage.type,
      marginUsed: +p.marginUsed,
      liqPx: p.liquidationPx ? +p.liquidationPx : null,
      posValue: +p.positionValue,
      upnl: +p.unrealizedPnl,
      funding: +p.cumFunding.sinceOpen,
      ...tpsl(orders, p.coin, szi),
    };
  }).filter((p) => p.szi !== 0);
}

// ---------- closed trades from fills ----------

// Fills that close (part of) a position, grouped into one trade when they're on
// the same coin within 10 minutes of each other.
export function closedTrades(address: string, fills: RawFill[]): ClosedTrade[] {
  const closing = fills
    .filter((f) => /^Close|>/.test(f.dir) && +f.closedPnl !== 0)
    .sort((a, b) => a.time - b.time);
  type Group = ClosedTrade & { notional: number; entryNotional: number };
  const out: Group[] = [];
  const open: Record<string, Group> = {};
  for (const f of closing) {
    const sz = +f.sz, px = +f.px, pnl = +f.closedPnl, fee = +f.fee;
    // A sell ("A") closes a long, a buy ("B") closes a short.
    const side: 1 | -1 = f.side === "A" ? 1 : -1;
    const entry = px - pnl / (sz * side);
    const g = open[f.coin];
    if (g && g.side === side && f.time - g.time < 10 * 60 * 1000) {
      g.sz += sz; g.notional += sz * px; g.entryNotional += sz * entry; g.pnl += pnl - fee; g.fees += fee; g.time = f.time;
      g.exitPx = g.notional / g.sz; g.entryPx = g.entryNotional / g.sz;
    } else {
      const t = { id: `${f.tid}`, address: address.toLowerCase(), coin: f.coin, side, sz, exitPx: px, entryPx: entry, pnl: pnl - fee, fees: fee, time: f.time, notional: sz * px, entryNotional: sz * entry };
      open[f.coin] = t;
      out.push(t);
    }
  }
  return out
    .map(({ notional: _n, entryNotional: _e, ...t }) => t)
    .sort((a, b) => b.time - a.time);
}

export function winRate(trades: ClosedTrade[]) {
  if (!trades.length) return null;
  return trades.filter((t) => t.pnl > 0).length / trades.length;
}

// Wins in a row, counting back from the most recent trade.
export function streakOf(trades: ClosedTrade[]) {
  let n = 0;
  for (const t of trades) { if (t.pnl > 0) n++; else break; }
  return n;
}

// Realized PnL per UTC day, for the track record grid.
export function dailyPnl(trades: ClosedTrade[]) {
  const m = new Map<number, number>();
  for (const t of trades) {
    const d = Math.floor(t.time / 86400000);
    m.set(d, (m.get(d) ?? 0) + t.pnl);
  }
  return m;
}

export function ago(time: number, now = Date.now()) {
  const s = Math.max(0, (now - time) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
