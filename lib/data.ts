// Server-side loaders for each page. Only perpy members are shown: we take the
// members from our database and read their wallets' real activity from
// Hyperliquid. Results are kept in memory for a short time so many visitors
// don't mean many requests (Hyperliquid limits how often one server may ask).

import "server-only";
import { fetchCandles, fetchFills, fetchOrders, fetchPortfolio, fetchState, type MarketData, type RawFill, type RawPortfolio } from "./hyperliquid";
import { listMembers, memberByHandle, type Member } from "./db";
import { closedTrades, parsePositions, playerFrom, type ClosedTrade, type Player, type Position, type Win } from "./trading";

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

// ---------- one wallet ----------

export const getPositions = (address: string, withOrders = false) =>
  cached(`pos:${address}:${withOrders}`, 30, async () => {
    const [s, o] = await Promise.all([fetchState(address, opts()), withOrders ? fetchOrders(address, opts()).catch(() => []) : Promise.resolve([])]);
    return { positions: parsePositions(address, s, o), accountValue: +s.marginSummary.accountValue };
  });

// Raw fills (every buy/sell) from the last N days, out of the latest 2,000.
const getAllFills = (address: string) => cached(`fills:${address}`, 120, () => fetchFills(address, opts(12)) as Promise<RawFill[]>);
export const getFills = async (address: string, days = 30) => {
  const since = Date.now() - days * 86400000;
  return (await getAllFills(address)).filter((f) => f.time >= since);
};

export const getTrades = async (address: string, days = 30) => closedTrades(address, await getFills(address, days));

export const getPortfolio = (address: string) =>
  cached(`pf:${address}`, 120, () => fetchPortfolio(address, opts()).catch(() => [] as RawPortfolio));

export const getCandles = (coin: string) =>
  cached(`c:${coin}`, 60, () => fetchCandles(coin, opts()).catch(() => null as MarketData | null));

// A member with their real stats.
export async function getPlayer(m: Member): Promise<Player> {
  const [pf, book] = await Promise.all([getPortfolio(m.wallet), getPositions(m.wallet).catch(() => null)]);
  return playerFrom(m, pf, book?.accountValue ?? 0);
}

export async function getMemberPlayer(handle: string) {
  const m = await memberByHandle(handle);
  return m ? { member: m, player: await getPlayer(m) } : null;
}

// ---------- all members ----------

export const getPlayers = () => cached("players", 60, async () => {
  const members = await listMembers(300);
  const players = await pool(members, 6, (m) => getPlayer(m).catch(() => null));
  return players.filter((p): p is Player => !!p);
});

// Hi-scores: members ranked by PnL over a time window.
export async function getScores(win: Win, n = 50) {
  const players = await getPlayers();
  return [...players].sort((a, b) => b.perf[win].pnl - a.perf[win].pnl).slice(0, n);
}

// ---------- home page ----------

export type HomeData = {
  pit: { player: Player; pos: Position }[];
  feed: ({ kind: "open"; player: Player; pos: Position } | { kind: "closed"; player: Player; trade: ClosedTrade })[];
  ranked: Player[];
  markets: Record<string, MarketData>;
  members: number;
};

export const getHome = () => cached("home", 30, async (): Promise<HomeData> => {
  const players = await getPlayers();
  const states = await pool(players, 6, (p) => getPositions(p.address).catch(() => null));

  // The Pit: each member's biggest open position, biggest first.
  const open = players.flatMap((player, i) => (states[i]?.positions ?? []).map((pos) => ({ player, pos })));
  const biggest = new Map<string, { player: Player; pos: Position }>();
  for (const x of [...open].sort((a, b) => b.pos.posValue - a.pos.posValue)) if (!biggest.has(x.player.address)) biggest.set(x.player.address, x);
  const pit = [...biggest.values()].slice(0, 8);

  // Feed: every member's open positions (most dramatic first) and recent closed trades.
  const openItems = [...open].sort((a, b) => Math.abs(b.pos.upnl) - Math.abs(a.pos.upnl)).slice(0, 12).map((x) => ({ kind: "open" as const, ...x }));
  const active = players.slice(0, 40);
  const trades = await pool(active, 4, (p) => getTrades(p.address, 7).catch(() => [] as ClosedTrade[]));
  const closedItems = active
    .flatMap((player, i) => trades[i].slice(0, 3).map((trade) => ({ kind: "closed" as const, player, trade })))
    .sort((a, b) => b.trade.time - a.trade.time)
    .slice(0, 12);
  const feed: HomeData["feed"] = [];
  for (let i = 0; i < Math.max(openItems.length, closedItems.length); i++) {
    if (openItems[i]) feed.push(openItems[i]);
    if (closedItems[i]) feed.push(closedItems[i]);
  }

  const coins = [...new Set(openItems.map((x) => x.pos.coin))];
  const candles = await pool(coins, 4, getCandles);
  const markets: Record<string, MarketData> = {};
  coins.forEach((c, i) => { if (candles[i]) markets[c] = candles[i]!; });

  const ranked = [...players].sort((a, b) => b.perf.month.pnl - a.perf.month.pnl).slice(0, 5);
  return { pit, feed, ranked, markets, members: players.length };
});

// Players for a list of wallets (e.g. post authors). Wallets that aren't members are skipped.
export async function playersByWallets(wallets: string[]): Promise<Map<string, Player>> {
  const { membersByWallets } = await import("./db");
  const ms = await membersByWallets([...new Set(wallets)]);
  const ps = await Promise.all(ms.map((m) => getPlayer(m).catch(() => null)));
  return new Map(ps.filter((p): p is Player => !!p).map((p) => [p.address, p]));
}
