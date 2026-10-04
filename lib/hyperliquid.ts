// Reading public market data from Hyperliquid. No API key is needed:
// these are the same public endpoints the Hyperliquid website uses.
// Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api

import { COINS, type Coin } from "./mock";

export const API = "https://api.hyperliquid.xyz/info";
export const WS = "wss://api.hyperliquid.xyz/ws";

export const STEP = 5 * 60 * 1000; // one candle = 5 minutes
export const WINDOW = 72; // candles shown on a chart = 6 hours
export const KEEP = 240; // candles kept in memory = 20 hours

export type MarketData = {
  px: number; // latest price (mid)
  prevDay: number; // price 24h ago, for the % change
  funding: number; // hourly funding rate
  t: number[]; // candle start times
  c: number[]; // candle close prices
};

export type Snapshot = {
  // Start of the candle that was "now" when the data was first loaded.
  // Trade entries are measured back from here so they never shift.
  anchorT: number;
  markets: Partial<Record<Coin, MarketData>>;
};

type FetchOpts = RequestInit & { next?: { revalidate?: number } };

async function post<T>(body: unknown, opts: FetchOpts = {}): Promise<T> {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...opts,
  });
  if (!r.ok) throw new Error(`Hyperliquid ${r.status}`);
  return r.json() as Promise<T>;
}

type AssetCtx = { midPx?: string | null; markPx: string; prevDayPx: string; funding: string };
type Candle = { t: number; c: string };

// Prices, 24h change and funding for our coins.
export async function fetchContexts(opts?: FetchOpts) {
  const [meta, ctxs] = await post<[{ universe: { name: string }[] }, AssetCtx[]]>({ type: "metaAndAssetCtxs" }, opts);
  const out: Partial<Record<Coin, { px: number; prevDay: number; funding: number }>> = {};
  meta.universe.forEach((u, i) => {
    const c = ctxs[i];
    if (!c || !COINS.includes(u.name as Coin)) return;
    out[u.name as Coin] = { px: +(c.midPx ?? c.markPx), prevDay: +c.prevDayPx, funding: +c.funding };
  });
  return out;
}

// Everything a page needs: current prices plus the last 20 hours of 5-minute candles.
export async function fetchSnapshot(opts?: FetchOpts): Promise<Snapshot> {
  const now = Date.now();
  const start = now - STEP * KEEP;
  const [ctx, candles] = await Promise.all([
    fetchContexts(opts),
    Promise.all(
      COINS.map((coin) =>
        post<Candle[]>({ type: "candleSnapshot", req: { coin, interval: "5m", startTime: start, endTime: now } }, opts)
      )
    ),
  ]);
  const markets: Snapshot["markets"] = {};
  COINS.forEach((coin, i) => {
    const cs = candles[i];
    const x = ctx[coin];
    if (!x || !cs?.length) return;
    markets[coin] = { ...x, t: cs.map((k) => k.t), c: cs.map((k) => +k.c) };
  });
  return { anchorT: Math.floor(now / STEP) * STEP, markets };
}

// Latest price of every coin in one request (backup when the websocket is blocked).
export async function fetchMids(opts?: FetchOpts) {
  return post<Record<string, string>>({ type: "allMids" }, opts);
}
