// Fake data for step 1. Every person here is fictional and every number is made up.
// It mirrors the mock data in design/perpy-designs.html. Later steps replace it
// with real Hyperliquid trades and a database.

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
  stats: { pnl30d: string; winRate: string; avgLev: string; best: string };
};

export const ME = "mayatrades";

export const PEOPLE: Record<string, Person> = {
  mayatrades: {
    handle: "mayatrades", name: "Maya Chen", colors: ["#0E9F5C", "#7DD3A8"], verified: true,
    bio: "BTC and ETH swing trader. Max 5x, always a stop. Posting every trade, wins and losses.",
    wallet: "0x7a3f…c91e", link: "x.com/mayatrades", joined: "Joined April 2026",
    following: "208", followers: "1,904", alerts: "312", trades: 74,
    stats: { pnl30d: "+$4,812", winRate: "61%", avgLev: "3.8x", best: "+$1,250" },
  },
  "kaia.trades": {
    handle: "kaia.trades", name: "Kaia Moreno", colors: ["#6D5BD0", "#B9A8FF"], verified: true,
    bio: "ETH maximalist with a stop loss. Swing trades on the 4h.",
    wallet: "0x41c2…07ad", joined: "Joined February 2026",
    following: "190", followers: "6,820", alerts: "1.2K", trades: 121,
    stats: { pnl30d: "+$9,340", winRate: "58%", avgLev: "6.2x", best: "+$3,410" },
  },
  liqhunter: {
    handle: "liqhunter", name: "Liam Okafor", colors: ["#E5484D", "#FF9F7A"], verified: true,
    bio: "Shorting euphoria, buying fear. Mostly SOL and BTC, 3–5x.\nEvery trade posted, including the ugly ones.",
    wallet: "0x9e1d…4b20", link: "t.me/liqhunter", joined: "Joined March 2026",
    following: "412", followers: "12.4K", alerts: "3.1K", trades: 188,
    stats: { pnl30d: "+$48.2K", winRate: "64%", avgLev: "4.1x", best: "+$8.9K" },
  },
  fundingfarmer: {
    handle: "fundingfarmer", name: "Jun Park", colors: ["#C08A12", "#F3CF6B"], verified: true,
    bio: "Low leverage, funding-driven trades. Patience over prediction.",
    wallet: "0x2b88…e5f1", joined: "Joined January 2026",
    following: "77", followers: "4,410", alerts: "690", trades: 96,
    stats: { pnl30d: "+$7,880", winRate: "71%", avgLev: "2.1x", best: "+$2,050" },
  },
  mossy: {
    handle: "mossy", name: "Ola Svensson", colors: ["#2B7A9E", "#8BD3F0"], verified: false,
    bio: "Auto-posting every trade. Learning in public.",
    wallet: "0xc03e…91aa", joined: "Joined May 2026",
    following: "54", followers: "311", alerts: "18", trades: 39,
    stats: { pnl30d: "+$3,105", winRate: "55%", avgLev: "3.0x", best: "+$940" },
  },
  degenrin: {
    handle: "degenrin", name: "Rin Tanaka", colors: ["#14161A", "#5B616E"], verified: false,
    bio: "Too much leverage, working on it.",
    wallet: "0x5d7a…2c3b", joined: "Joined June 2026",
    following: "320", followers: "980", alerts: "41", trades: 210,
    stats: { pnl30d: "+$1,940", winRate: "47%", avgLev: "8.4x", best: "+$1,120" },
  },
  candlemonk: {
    handle: "candlemonk", name: "Dev Mehta", colors: ["#B4436C", "#F2A1C1"], verified: true,
    bio: "Price action only. BTC majors, weekly levels.",
    wallet: "0x88f0…d412", joined: "Joined February 2026",
    following: "140", followers: "8,050", alerts: "1.9K", trades: 143,
    stats: { pnl30d: "+$31.9K", winRate: "59%", avgLev: "4.0x", best: "+$6,300" },
  },
  "zoe.perps": {
    handle: "zoe.perps", name: "Zoe Laurent", colors: ["#2E8B57", "#A8E6CF"], verified: false,
    bio: "Memecoin shorts and coffee.",
    wallet: "0x3a19…b7e0", joined: "Joined July 2026",
    following: "260", followers: "1,120", alerts: "64", trades: 58,
    stats: { pnl30d: "+$1,620", winRate: "62%", avgLev: "5.0x", best: "+$700" },
  },
};

export const COIN_SYMBOL: Record<Coin, string> = { BTC: "₿", ETH: "Ξ", SOL: "S", HYPE: "H", DOGE: "Ð" };

export type Level = { v: number; kind: "t" | "e" | "s"; label: string };

export type OpenCard = {
  state: "open";
  coin: Coin; side: "long" | "short"; lev: number;
  seed: number; from: number; to: number; vol: number;
  levels?: Level[];
  hiddenLevels?: boolean;
  stats: [string, string, ("up" | "down")?][];
};
export type ClosedCard = {
  state: "closed";
  coin: Coin; side: "long" | "short"; lev: number;
  pnl: string; roe: string; win: boolean;
  stats: [string, string][];
};
export type TradeCardData = OpenCard | ClosedCard;

export type Reply = { handle: string; time: string; text: string; likes: number };

export type Post = {
  id: string;
  handle: string;
  time: string;
  context: string;
  text: string;
  card: TradeCardData;
  counts: { replies: number; reposts: number; likes: number };
  // Extra content only shown on the post page.
  detail?: {
    title: string;
    paragraphs: string[];
    plan: { entry: string; entryNote: string; tp: string; tpNote: string; sl: string; slNote: string };
    postedAt: string; views: string; alerts: number;
    timeline: { icon: "g" | "k" | ""; mark: string; title: string; note: string; time: string }[];
    replies: Reply[];
  };
};

const ETH_LEVELS: Level[] = [
  { v: 3800, kind: "t", label: "TP 3,800" },
  { v: 3588, kind: "e", label: "Entry 3,588" },
  { v: 3480, kind: "s", label: "SL 3,480" },
];

export const POSTS: Post[] = [
  {
    id: "1", handle: "kaia.trades", time: "2h", context: "Opened a position",
    text: "ETH reclaiming the weekly open. Funding is flat and OI is rebuilding slowly. Holding for 3,800, out on a 4h close below 3,480.",
    card: {
      state: "open", coin: "ETH", side: "long", lev: 8, seed: 11, from: 3540, to: 3641, vol: 70, levels: ETH_LEVELS,
      stats: [["Entry", "3,588.20"], ["Mark", "3,641.70"], ["Size", "$24,000"], ["PnL", "+$357.80", "up"]],
    },
    counts: { replies: 18, reposts: 24, likes: 142 },
    detail: {
      title: "ETH reclaiming the weekly open",
      paragraphs: [
        "Funding reset to flat after last week's flush, and open interest is rebuilding slowly instead of chasing. Spot bids have absorbed every dip into 3,550.",
        "I'm holding for a retest of 3,800. If we lose 3,480 on a 4h close the idea is wrong and I'm out. No averaging down.",
      ],
      plan: {
        entry: "3,588", entryNote: "filled 2h ago",
        tp: "3,800", tpNote: "+5.9%, +47% on margin",
        sl: "3,480", slNote: "−3.0%, −24% on margin",
      },
      postedAt: "2:14 PM, Oct 2, 2026", views: "18.4K", alerts: 31,
      timeline: [
        { icon: "g", mark: "+", title: "Opened long 8x", note: "$12,000 at 3,571.40", time: "2h" },
        { icon: "g", mark: "+", title: "Added $12,000", note: "at 3,605.00, average now 3,588.20", time: "1h" },
        { icon: "k", mark: "✓", title: "Set take profit and stop loss", note: "3,800 and 3,480", time: "1h" },
        { icon: "", mark: "", title: "Still open", note: "Funding paid so far: $2.10", time: "now" },
      ],
      replies: [
        { handle: "liqhunter", time: "1h", text: "Clean level. I'd move the stop to entry once 3,700 prints.", likes: 6 },
        { handle: "mossy", time: "58m", text: "What made you add at 3,605 instead of waiting for a retest?", likes: 7 },
        { handle: "kaia.trades", time: "51m", text: "OI was building while funding stayed flat, so it isn't a crowded long yet. Retests have been shallow all week.", likes: 7 },
      ],
    },
  },
  {
    id: "2", handle: "liqhunter", time: "3h", context: "Closed a position",
    text: "Took the SOL short off into the 177 bid. Second time this level has held, not pressing it.",
    card: {
      state: "closed", coin: "SOL", side: "short", lev: 5, pnl: "+$1,520", roe: "+30.4%", win: true,
      stats: [["Entry", "188.40"], ["Exit", "176.95"], ["Held", "1d 4h"], ["Fees", "$9.80"]],
    },
    counts: { replies: 34, reposts: 41, likes: 211 },
  },
  {
    id: "3", handle: "mossy", time: "4h", context: "Opened a position · posted automatically", text: "",
    card: {
      state: "open", coin: "BTC", side: "long", lev: 3, hiddenLevels: true, seed: 5, from: 95400, to: 95840, vol: 500,
      stats: [["Entry", "95,840"], ["Mark", "96,120"], ["Size", "$6,000"], ["PnL", "+$17.50", "up"]],
    },
    counts: { replies: 2, reposts: 0, likes: 12 },
  },
  {
    id: "4", handle: "degenrin", time: "5h", context: "Closed a position",
    text: "Stopped out on HYPE. 10x into resistance was too much size. Lesson noted, posting it anyway.",
    card: {
      state: "closed", coin: "HYPE", side: "long", lev: 10, pnl: "−$555", roe: "−55.5%", win: false,
      stats: [["Entry", "39.82"], ["Exit", "37.61"], ["Held", "6h"], ["Fees", "$4.10"]],
    },
    counts: { replies: 21, reposts: 3, likes: 96 },
  },
  {
    id: "5", handle: "fundingfarmer", time: "7h", context: "Opened a position",
    text: "Funding has been +0.004%/h for three days while price chops. Small short to collect funding and fade the crowded side.",
    card: {
      state: "open", coin: "BTC", side: "short", lev: 2, seed: 23, from: 97300, to: 96388, vol: 600,
      levels: [
        { v: 93000, kind: "t", label: "TP 93,000" },
        { v: 97120, kind: "e", label: "Entry 97,120" },
        { v: 99500, kind: "s", label: "SL 99,500" },
      ],
      stats: [["Entry", "97,120"], ["Mark", "96,388"], ["Size", "$40,000"], ["PnL", "+$301.40", "up"]],
    },
    counts: { replies: 9, reposts: 5, likes: 77 },
  },
];

// Story rings: everyone with an open position, and how it is doing.
export const STORIES: { handle: string; ring: Ring; pnl: string }[] = [
  { handle: "mayatrades", ring: "up", pnl: "+$612" },
  { handle: "liqhunter", ring: "up", pnl: "+$2.1k" },
  { handle: "kaia.trades", ring: "up", pnl: "+$358" },
  { handle: "fundingfarmer", ring: "up", pnl: "+$301" },
  { handle: "degenrin", ring: "down", pnl: "−$84" },
  { handle: "candlemonk", ring: "up", pnl: "+$1.2k" },
  { handle: "mossy", ring: "up", pnl: "+$18" },
  { handle: "zoe.perps", ring: "down", pnl: "−$40" },
];

// Right column: the signed-in user's open positions.
export const MY_POSITIONS: { coin: Coin; side: "long" | "short"; lev: number; pnl: string; dir: "up" | "down"; spark: number[] }[] = [
  { coin: "BTC", side: "long", lev: 5, pnl: "+$612.40", dir: "up", spark: [3, 4, 3, 5, 6, 6, 8, 7, 9] },
  { coin: "SOL", side: "short", lev: 3, pnl: "−$48.10", dir: "down", spark: [6, 5, 6, 5, 4, 5, 4, 3, 3] },
];

export const WHO_TO_FOLLOW = ["liqhunter", "candlemonk", "fundingfarmer"];

export const TRENDING: { coin: Coin; note: string; change: string; dir: "up" | "down" }[] = [
  { coin: "BTC", note: "412 traders posting", change: "+1.98%", dir: "up" },
  { coin: "ETH", note: "288 traders posting", change: "+2.41%", dir: "up" },
  { coin: "SOL", note: "151 traders posting", change: "−3.12%", dir: "down" },
  { coin: "HYPE", note: "97 traders posting", change: "+5.06%", dir: "up" },
];

// Profile grid tiles: [coin, side+lev, result, kind (w = win, l = loss, o = open), sub]
export const TILES: [Coin, string, string, "w" | "l" | "o", string][] = [
  ["SOL", "Short 5x", "+$1,520", "w", "30%"],
  ["BTC", "Long 4x", "+$8,940", "w", "62%"],
  ["ETH", "Short 3x", "−$410", "l", "−11%"],
  ["BTC", "Long 3x", "Open", "o", "+$2.1K"],
  ["SOL", "Short 4x", "+$2,280", "w", "38%"],
  ["DOGE", "Long 5x", "−$260", "l", "−26%"],
  ["HYPE", "Long 3x", "+$740", "w", "22%"],
  ["BTC", "Short 2x", "+$1,130", "w", "9%"],
  ["SOL", "Long 5x", "Open", "o", "−$84"],
];

export function ringFor(handle: string): Ring | undefined {
  return STORIES.find((s) => s.handle === handle)?.ring;
}
