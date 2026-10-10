// Server-side loaders for each page. They call Hyperliquid and keep results in
// memory for a short time, so many visitors don't mean many requests
// (Hyperliquid limits how often one server may ask).

import "server-only";
import { LEADERBOARD, fetchCandles, fetchFills, fetchOrders, fetchPortfolio, fetchState, type MarketData, type RawFill, type RawPortfolio } from "./hyperliquid";
import { closedTrades, emptyPlayer, parsePositions, playerFromRow, type ClosedTrade, type Player, type Position, type Win } from "./trading";

const memory = new Map<string, { at: number; value: Promise<unknown> }>();

// Run fn at most once per ttl seconds for the same key; failures aren't kept.
function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < ttl * 1000) return hit.value as Promise<T>;
  const value = fn().catch((e) => { memory.delete(key); throw e; });
  memory.set(key, { at: Date.now(), value });
  return value;
}

// Run tasks a few at a time instead of all at once.
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const opts = (s = 8) => ({ signal: AbortSignal.timeout(s * 1000), next: { revalidate: 60 } });

// ---------- leaderboard ----------

// The full Hyperliquid leaderboard (~47,000 wallets, ~40 MB), kept 10 minutes.
export function getLeaderboard(): Promise<Player[]> {
  return cached("lb", 600, async () => {
    const r = await fetch(LEADERBOARD, { signal: AbortSignal.timeout(25000), next: { revalidate: 600 } });
    if (!r.ok) throw new Error(`leaderboard ${r.status}`);
    const d = (await r.json()) as { leaderboardRows: Parameters<typeof playerFromRow>[0][] };
    return d.leaderboardRows.map(playerFromRow);
  });
}

// Real traders worth watching: profitable this month, at least $25K in the
// account, and not a market-making bot (bots trade 100s of times their account).
export function isPlayable(p: Player) {
  return p.accountValue >= 25_000 && p.perf.month.pnl > 0 && p.perf.month.vlm < p.accountValue * 150;
}

export async function getRanked(win: Win = "month", n = 50) {
  const lb = await getLeaderboard();
  return lb
    .filter((p) => p.accountValue >= 10_000 && p.perf[win].vlm > 0 && p.perf.month.vlm < p.accountValue * 150)
    .sort((a, b) => b.perf[win].pnl - a.perf[win].pnl)
    .slice(0, n);
}

export async function getPlayer(address: string): Promise<Player> {
  const a = address.toLowerCase();
  const lb = await getLeaderboard().catch(() => [] as Player[]);
  return lb.find((p) => p.address === a) ?? emptyPlayer(a);
}

// ---------- wallets ----------

export const getPositions = (address: string, withOrders = false) =>
  cached(`pos:${address}:${withOrders}`, 45, async () => {
    const [s, o] = await Promise.all([fetchState(address, opts()), withOrders ? fetchOrders(address, opts()).catch(() => []) : Promise.resolve([])]);
    return { positions: parsePositions(address, s, o), accountValue: +s.marginSummary.accountValue };
  });

// Raw fills (every buy/sell) from the last N days, out of the latest 2,000.
const getAllFills = (address: string) => cached(`fills:${address}`, 300, () => fetchFills(address, opts(12)) as Promise<RawFill[]>);
export const getFills = async (address: string, days = 30) => {
  const since = Date.now() - days * 86400000;
  return (await getAllFills(address)).filter((f) => f.time >= since);
};

export const getTrades = async (address: string, days = 30) => closedTrades(address, await getFills(address, days));

export const getPortfolio = (address: string) =>
  cached(`pf:${address}`, 300, () => fetchPortfolio(address, opts()).catch(() => [] as RawPortfolio));

export const getCandles = (coin: string) =>
  cached(`c:${coin}`, 60, () => fetchCandles(coin, opts()).catch(() => null as MarketData | null));

// ---------- home page ----------

export type HomeData = {
  pit: { player: Player; pos: Position }[];
  feed: ({ kind: "open"; player: Player; pos: Position } | { kind: "closed"; player: Player; trade: ClosedTrade })[];
  ranked: Player[];
  markets: Record<string, MarketData>;
};

export const getHome = () => cached("home", 50, async (): Promise<HomeData> => {
  const lb = await getLeaderboard();
  const players = lb.filter(isPlayable).sort((a, b) => b.perf.month.pnl - a.perf.month.pnl).slice(0, 36);
  const states = await pool(players, 6, (p) => getPositions(p.address).catch(() => null));

  // The Pit: each player's biggest open position, biggest first.
  const open = players.flatMap((player, i) => (states[i]?.positions ?? []).map((pos) => ({ player, pos })));
  const seen = new Set<string>();
  const pit = open
    .sort((a, b) => b.pos.posValue - a.pos.posValue)
    .filter((x) => (seen.has(x.player.address) ? false : (seen.add(x.player.address), true)))
    .slice(0, 8);

  // Feed: the most dramatic open positions plus the latest closed trades.
  const liveFeed = [...open].sort((a, b) => Math.abs(b.pos.upnl) - Math.abs(a.pos.upnl));
  const seen2 = new Set<string>();
  const openItems = liveFeed
    .filter((x) => (seen2.has(x.player.address) ? false : (seen2.add(x.player.address), true)))
    .slice(0, 6)
    .map((x) => ({ kind: "open" as const, ...x }));
  const recent = players.slice(0, 10);
  const trades = await pool(recent, 4, (p) => getTrades(p.address, 3).catch(() => [] as ClosedTrade[]));
  const closedItems = recent
    .flatMap((player, i) => trades[i].slice(0, 2).map((trade) => ({ kind: "closed" as const, player, trade })))
    .sort((a, b) => b.trade.time - a.trade.time)
    .slice(0, 6);
  const feed: HomeData["feed"] = [];
  for (let i = 0; i < Math.max(openItems.length, closedItems.length); i++) {
    if (openItems[i]) feed.push(openItems[i]);
    if (closedItems[i]) feed.push(closedItems[i]);
  }

  // Candles for every coin shown in an open-position chart.
  const coins = [...new Set(openItems.map((x) => x.pos.coin))];
  const candles = await pool(coins, 4, getCandles);
  const markets: Record<string, MarketData> = {};
  coins.forEach((c, i) => { if (candles[i]) markets[c] = candles[i]!; });

  return { pit, feed, ranked: players.slice(0, 5), markets };
});
