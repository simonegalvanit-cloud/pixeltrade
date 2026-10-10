// Everything we read from Hyperliquid. All public, no API key needed:
// these are the same endpoints the Hyperliquid website uses.
// Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api

export const API = "https://api.hyperliquid.xyz/info";
export const WS = "wss://api.hyperliquid.xyz/ws";
export const LEADERBOARD = "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard";

export const STEP = 5 * 60 * 1000; // one candle = 5 minutes
export const WINDOW = 72; // candles shown on a chart = 6 hours
export const KEEP = 240; // candles kept in memory = 20 hours

// Coins we always load candles for (others are loaded when a card needs them).
export const CORE = ["BTC", "ETH", "SOL", "HYPE", "XRP", "DOGE"];

export type MarketData = {
  px: number; // latest price
  t: number[]; // candle start times
  o: number[]; // candle open prices
  h: number[]; // candle highs (top of the wick)
  l: number[]; // candle lows (bottom of the wick)
  c: number[]; // candle close prices
};

export type Snapshot = {
  mids: Record<string, number>; // latest price of every perp
  ctx: Record<string, { prevDay: number; funding: number }>; // 24h-ago price and funding
  markets: Record<string, MarketData>; // candles, only for coins we've loaded
};

// Add or update a candle, keeping at most KEEP of them.
export function upsertCandle(m: MarketData, t: number, o: number, h: number, l: number, c: number) {
  const last = m.t.length - 1;
  if (last >= 0 && m.t[last] === t) {
    m.o[last] = o; m.h[last] = h; m.l[last] = l; m.c[last] = c;
  } else if (last < 0 || t > m.t[last]) {
    m.t.push(t); m.o.push(o); m.h.push(h); m.l.push(l); m.c.push(c);
    if (m.t.length > KEEP) { m.t.shift(); m.o.shift(); m.h.shift(); m.l.shift(); m.c.shift(); }
  }
}

export type FetchOpts = RequestInit & { next?: { revalidate?: number } };

export async function info<T>(body: unknown, opts: FetchOpts = {}): Promise<T> {
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
type RawCandle = { t: number; o: string; h: string; l: string; c: string };

// Price, 24h-ago price and funding for every perp.
export async function fetchContexts(opts?: FetchOpts) {
  const [meta, ctxs] = await info<[{ universe: { name: string; isDelisted?: boolean }[] }, AssetCtx[]]>({ type: "metaAndAssetCtxs" }, opts);
  const mids: Snapshot["mids"] = {};
  const ctx: Snapshot["ctx"] = {};
  meta.universe.forEach((u, i) => {
    const c = ctxs[i];
    if (!c || u.isDelisted) return;
    mids[u.name] = +(c.midPx ?? c.markPx);
    ctx[u.name] = { prevDay: +c.prevDayPx, funding: +c.funding };
  });
  return { mids, ctx };
}

// The last 20 hours of 5-minute candles for one coin.
export async function fetchCandles(coin: string, opts?: FetchOpts): Promise<MarketData | null> {
  const now = Date.now();
  const cs = await info<RawCandle[]>({ type: "candleSnapshot", req: { coin, interval: "5m", startTime: now - STEP * KEEP, endTime: now } }, opts);
  if (!cs?.length) return null;
  return { px: +cs[cs.length - 1].c, t: cs.map((k) => k.t), o: cs.map((k) => +k.o), h: cs.map((k) => +k.h), l: cs.map((k) => +k.l), c: cs.map((k) => +k.c) };
}

// Prices for everything plus candles for the given coins.
export async function fetchSnapshot(coins: string[] = CORE, opts?: FetchOpts): Promise<Snapshot> {
  const [{ mids, ctx }, candles] = await Promise.all([
    fetchContexts(opts),
    Promise.all(coins.map((c) => fetchCandles(c, opts).catch(() => null))),
  ]);
  const markets: Snapshot["markets"] = {};
  coins.forEach((coin, i) => {
    const m = candles[i];
    if (m) markets[coin] = { ...m, px: mids[coin] ?? m.px };
  });
  return { mids, ctx, markets };
}

export async function fetchMids(opts?: FetchOpts) {
  return info<Record<string, string>>({ type: "allMids" }, opts);
}

// ---------- wallets ----------

export type RawPosition = {
  position: {
    coin: string; szi: string; entryPx: string; positionValue: string; unrealizedPnl: string;
    returnOnEquity: string; liquidationPx: string | null; marginUsed: string;
    leverage: { type: "cross" | "isolated"; value: number };
    cumFunding: { sinceOpen: string };
  };
};
export type RawState = {
  marginSummary: { accountValue: string; totalNtlPos: string; totalMarginUsed: string };
  assetPositions: RawPosition[];
};
export type RawOrder = {
  coin: string; side: "A" | "B"; triggerPx: string; isTrigger: boolean; reduceOnly: boolean;
  isPositionTpsl: boolean; orderType: string; triggerCondition: string;
};
export type RawFill = {
  coin: string; px: string; sz: string; side: "A" | "B"; time: number; dir: string;
  closedPnl: string; fee: string; hash: string; tid: number; startPosition: string;
};
export type RawPortfolio = [string, { accountValueHistory: [number, string][]; pnlHistory: [number, string][]; vlm: string }][];

export const fetchState = (user: string, opts?: FetchOpts) => info<RawState>({ type: "clearinghouseState", user }, opts);
export const fetchOrders = (user: string, opts?: FetchOpts) => info<RawOrder[]>({ type: "frontendOpenOrders", user }, opts);
export const fetchPortfolio = (user: string, opts?: FetchOpts) => info<RawPortfolio>({ type: "portfolio", user }, opts);
// The most recent fills (up to 2,000), partial fills of one order merged.
export const fetchFills = (user: string, opts?: FetchOpts) =>
  info<RawFill[]>({ type: "userFills", user, aggregateByTime: true }, opts);

export const isAddress = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);
export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
