// Example traders and their trades. The PEOPLE are fictional, but their trades
// are anchored to REAL Hyperliquid prices: we store when a trade was opened and
// how (side, leverage, size), and lib/positions.ts works out entry, mark and PnL
// from live market data. A later step replaces this with real wallets.

export type Coin = "BTC" | "ETH" | "SOL" | "HYPE" | "DOGE";
export type Ring = "up" | "down" | "seen";

export type Person = {
  handle: string;
  name: string;
  colors: [string, string];
  verified: boolean;
  bio: string;
  wallet: string;
  link?: string;
  joined: string;
  following: string;
  followers: string;
  alerts: string;
  trades: number;
  klass: string; // their "character class" in the arcade
  streak: number; // wins in a row
  stats: { pnl30d: string; winRate: string; avgLev: string; best: string };
};

export const ME = "mayatrades";

export const PEOPLE: Record<string, Person> = {
  mayatrades: {
    handle: "mayatrades", name: "Maya Chen", colors: ["#0E9F5C", "#7DD3A8"], verified: true,
    bio: "BTC and ETH swing trader. Max 5x, always a stop. Posting every trade, wins and losses.",
    wallet: "0x7a3f…c91e", link: "x.com/mayatrades", joined: "Joined April 2026",
    following: "208", followers: "1,904", alerts: "312", trades: 74,
    klass: "SWING", streak: 3,
    stats: { pnl30d: "+$4,812", winRate: "61%", avgLev: "3.8x", best: "+$1,250" },
  },
  "kaia.trades": {
    handle: "kaia.trades", name: "Kaia Moreno", colors: ["#6D5BD0", "#B9A8FF"], verified: true,
    bio: "ETH maximalist with a stop loss. Swing trades on the 4h.",
    wallet: "0x41c2…07ad", joined: "Joined February 2026",
    following: "190", followers: "6,820", alerts: "1.2K", trades: 121,
    klass: "WAVE RIDER", streak: 4,
    stats: { pnl30d: "+$9,340", winRate: "58%", avgLev: "6.2x", best: "+$3,410" },
  },
  liqhunter: {
    handle: "liqhunter", name: "Liam Okafor", colors: ["#E5484D", "#FF9F7A"], verified: true,
    bio: "Shorting euphoria, buying fear. Mostly SOL and BTC, 3–5x.\nEvery trade posted, including the ugly ones.",
    wallet: "0x9e1d…4b20", link: "t.me/liqhunter", joined: "Joined March 2026",
    following: "412", followers: "12.4K", alerts: "3.1K", trades: 188,
    klass: "SNIPER", streak: 7,
    stats: { pnl30d: "+$48.2K", winRate: "64%", avgLev: "4.1x", best: "+$8.9K" },
  },
  fundingfarmer: {
    handle: "fundingfarmer", name: "Jun Park", colors: ["#C08A12", "#F3CF6B"], verified: true,
    bio: "Low leverage, funding-driven trades. Patience over prediction.",
    wallet: "0x2b88…e5f1", joined: "Joined January 2026",
    following: "77", followers: "4,410", alerts: "690", trades: 96,
    klass: "FARMER", streak: 5,
    stats: { pnl30d: "+$7,880", winRate: "71%", avgLev: "2.1x", best: "+$2,050" },
  },
  mossy: {
    handle: "mossy", name: "Ola Svensson", colors: ["#2B7A9E", "#8BD3F0"], verified: false,
    bio: "Auto-posting every trade. Learning in public.",
    wallet: "0xc03e…91aa", joined: "Joined May 2026",
    following: "54", followers: "311", alerts: "18", trades: 39,
    klass: "ROOKIE", streak: 1,
    stats: { pnl30d: "+$3,105", winRate: "55%", avgLev: "3.0x", best: "+$940" },
  },
  degenrin: {
    handle: "degenrin", name: "Rin Tanaka", colors: ["#14161A", "#5B616E"], verified: false,
    bio: "Too much leverage, working on it.",
    wallet: "0x5d7a…2c3b", joined: "Joined June 2026",
    following: "320", followers: "980", alerts: "41", trades: 210,
    klass: "DEGEN", streak: 0,
    stats: { pnl30d: "+$1,940", winRate: "47%", avgLev: "8.4x", best: "+$1,120" },
  },
  candlemonk: {
    handle: "candlemonk", name: "Dev Mehta", colors: ["#B4436C", "#F2A1C1"], verified: true,
    bio: "Price action only. BTC majors, weekly levels.",
    wallet: "0x88f0…d412", joined: "Joined February 2026",
    following: "140", followers: "8,050", alerts: "1.9K", trades: 143,
    klass: "MONK", streak: 3,
    stats: { pnl30d: "+$31.9K", winRate: "59%", avgLev: "4.0x", best: "+$6,300" },
  },
  "zoe.perps": {
    handle: "zoe.perps", name: "Zoe Laurent", colors: ["#2E8B57", "#A8E6CF"], verified: false,
    bio: "Memecoin shorts and coffee.",
    wallet: "0x3a19…b7e0", joined: "Joined July 2026",
    following: "260", followers: "1,120", alerts: "64", trades: 58,
    klass: "SHORT QUEEN", streak: 2,
    stats: { pnl30d: "+$1,620", winRate: "62%", avgLev: "5.0x", best: "+$700" },
  },
};

export const COIN_SYMBOL: Record<Coin, string> = { BTC: "₿", ETH: "Ξ", SOL: "S", HYPE: "H", DOGE: "Ð" };
export const COINS: Coin[] = ["BTC", "ETH", "SOL", "HYPE", "DOGE"];

// ---------- open positions (live) ----------
// ago: how many 5-minute candles ago the trade was opened (24 = 2 hours, max 230).
// tp / sl: take profit and stop loss as a % move from entry (0.059 = +5.9%).
export type PositionDef = {
  handle: string; coin: Coin; side: 1 | -1; lev: number; size: number; ago: number;
  tp?: number; sl?: number;
  tile: 1 | 2 | 3 | 4; // tile size in the Pit, bigger position = bigger tile
};

export const POSITIONS: Record<string, PositionDef> = {
  liam:    { handle: "liqhunter",     coin: "SOL",  side: -1, lev: 5,  size: 42000, ago: 190, tile: 4 },
  dev:     { handle: "candlemonk",    coin: "BTC",  side: 1,  lev: 4,  size: 30000, ago: 150, tile: 3 },
  kaia:    { handle: "kaia.trades",   coin: "ETH",  side: 1,  lev: 8,  size: 24000, ago: 24, tp: 0.059, sl: -0.03, tile: 2 },
  maya:    { handle: "mayatrades",    coin: "BTC",  side: 1,  lev: 5,  size: 18400, ago: 120, tp: 0.08, sl: -0.025, tile: 2 },
  ola:     { handle: "mossy",         coin: "BTC",  side: 1,  lev: 3,  size: 6000,  ago: 48, tile: 1 },
  rin:     { handle: "degenrin",      coin: "HYPE", side: 1,  lev: 10, size: 5000,  ago: 10, tile: 1 },
  jun:     { handle: "fundingfarmer", coin: "BTC",  side: -1, lev: 2,  size: 4000,  ago: 60, tp: -0.043, sl: 0.0245, tile: 1 },
  zoe:     { handle: "zoe.perps",     coin: "DOGE", side: -1, lev: 5,  size: 3000,  ago: 100, tile: 1 },
  mayaSol: { handle: "mayatrades",    coin: "SOL",  side: -1, lev: 3,  size: 3600,  ago: 6,  tile: 1 },
};

// Order of tiles in the Pit (one main position per trader).
export const PIT_ORDER = ["liam", "dev", "rin", "ola", "maya", "kaia", "jun", "zoe"];

// The signed-in user's open positions, shown in "Your book".
export const MY_BOOK = ["maya", "mayaSol"];

// ---------- closed trades ----------
// closedAgo: 5-minute candles ago the trade was closed. The exit is the real price
// then. move: the price move in the trader's favor (0.0608 = +6.08%, negative = loss).
export type ClosedDef = {
  coin: Coin; side: 1 | -1; lev: number; size: number; closedAgo: number; move: number; held: string; fees: string;
};

// ---------- posts ----------
// Text can contain {tp} {sl} {entry} {dip} {e1} {e2} {tpNote} {slNote}, which are
// filled in from the live position so the words always match the chart.
export type TradeRef = { kind: "open"; pos: string; hiddenLevels?: boolean } | ({ kind: "closed" } & ClosedDef);

export type Reply = { handle: string; time: string; text: string; likes: number };

export type Post = {
  id: string;
  handle: string;
  time: string;
  context: string;
  text: string;
  trade: TradeRef;
  counts: { replies: number; reposts: number; likes: number };
  // Extra content only shown on the post page.
  detail?: {
    title: string;
    paragraphs: string[];
    postedAt: string; views: string; alerts: number;
    timeline: { mark: string; title: string; note: string; time: string }[];
    replies: Reply[];
  };
};

export const POSTS: Post[] = [
  {
    id: "1", handle: "kaia.trades", time: "2h", context: "Opened a position",
    text: "ETH reclaiming the weekly open. Funding is flat and OI is rebuilding slowly. Holding for {tp}, out on a 4h close below {sl}.",
    trade: { kind: "open", pos: "kaia" },
    counts: { replies: 18, reposts: 24, likes: 142 },
    detail: {
      title: "ETH reclaiming the weekly open",
      paragraphs: [
        "Funding reset to flat after last week's flush, and open interest is rebuilding slowly instead of chasing. Spot bids have absorbed every dip into {dip}.",
        "I'm holding for a retest of {tp}. If we lose {sl} on a 4h close the idea is wrong and I'm out. No averaging down.",
      ],
      postedAt: "posted 2h ago", views: "18.4K", alerts: 31,
      timeline: [
        { mark: "+", title: "Opened long 8x", note: "$12,000 at {e1}", time: "2h" },
        { mark: "+", title: "Added $12,000", note: "at {e2}, average now {entry}", time: "2h" },
        { mark: "✓", title: "Set take profit and stop loss", note: "{tp} and {sl}", time: "2h" },
        { mark: "", title: "Still open", note: "live below", time: "now" },
      ],
      replies: [
        { handle: "liqhunter", time: "1h", text: "Clean level. I'd move the stop to entry once it runs.", likes: 6 },
        { handle: "mossy", time: "58m", text: "What made you add instead of waiting for a retest?", likes: 7 },
        { handle: "kaia.trades", time: "51m", text: "OI was building while funding stayed flat, so it isn't a crowded long yet. Retests have been shallow all week.", likes: 7 },
      ],
    },
  },
  {
    id: "2", handle: "liqhunter", time: "3h", context: "Closed a position",
    text: "Took the SOL short off into the bid. Second time this level has held, not pressing it.",
    trade: { kind: "closed", coin: "SOL", side: -1, lev: 5, size: 25000, closedAgo: 36, move: 0.0608, held: "1d 4h", fees: "$9.80" },
    counts: { replies: 34, reposts: 41, likes: 211 },
  },
  {
    id: "3", handle: "mossy", time: "4h", context: "Opened a position · posted automatically", text: "",
    trade: { kind: "open", pos: "ola", hiddenLevels: true },
    counts: { replies: 2, reposts: 0, likes: 12 },
  },
  {
    id: "4", handle: "degenrin", time: "5h", context: "Closed a position",
    text: "Stopped out on HYPE. 10x into resistance was too much size. Lesson noted, posting it anyway.",
    trade: { kind: "closed", coin: "HYPE", side: 1, lev: 10, size: 10000, closedAgo: 60, move: -0.0555, held: "6h", fees: "$4.10" },
    counts: { replies: 21, reposts: 3, likes: 96 },
  },
  {
    id: "5", handle: "fundingfarmer", time: "5h", context: "Opened a position",
    text: "Funding has been positive for three days while price chops. Small short to collect funding and fade the crowded side. Target {tp}, out above {sl}.",
    trade: { kind: "open", pos: "jun" },
    counts: { replies: 9, reposts: 5, likes: 77 },
  },
];

export const WHO_TO_FOLLOW = ["liqhunter", "candlemonk", "fundingfarmer"];

// "Most posted" markets in the side column. The % change is live.
export const TRENDING: { coin: Coin; note: string }[] = [
  { coin: "BTC", note: "412 traders posting" },
  { coin: "ETH", note: "288 traders posting" },
  { coin: "SOL", note: "151 traders posting" },
  { coin: "HYPE", note: "97 traders posting" },
];

// Past trades on a profile: [coin, side+lev, result, kind (w = win, l = loss, o = open), sub]
export const TILES: [Coin, string, string, "w" | "l" | "o", string][] = [
  ["SOL", "Short 5x", "+$1,520", "w", "30%"],
  ["BTC", "Long 4x", "+$8,940", "w", "62%"],
  ["ETH", "Short 3x", "−$410", "l", "−11%"],
  ["SOL", "Short 4x", "+$2,280", "w", "38%"],
  ["DOGE", "Long 5x", "−$260", "l", "−26%"],
  ["HYPE", "Long 3x", "+$740", "w", "22%"],
  ["BTC", "Short 2x", "+$1,130", "w", "9%"],
  ["ETH", "Long 6x", "+$2,410", "w", "41%"],
  ["SOL", "Long 5x", "−$384", "l", "−18%"],
];

// Arcade level: one level per ~4.5 trades posted.
export function levelOf(p: Person) {
  return Math.max(1, Math.round(p.trades / 4.5));
}

// Parse "+$48.2K" style strings into a number, for sorting the high scores.
export function pnlValue(s: string) {
  const n = parseFloat(s.replace(/[^\d.]/g, "")) * (/K$/i.test(s) ? 1000 : 1);
  return /^[−-]/.test(s) ? -n : n;
}

// Everyone, best 30-day PnL first (the hi-score table).
export const RANKED = Object.values(PEOPLE).sort((a, b) => pnlValue(b.stats.pnl30d) - pnlValue(a.stats.pnl30d));

// Which open position (if any) belongs to a trader.
export function positionKeyFor(handle: string): string | undefined {
  return PIT_ORDER.find((k) => POSITIONS[k].handle === handle);
}
