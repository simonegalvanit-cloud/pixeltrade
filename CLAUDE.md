# perpy

Social trading app. Traders connect a wallet; their Hyperliquid perp trades
become public, verified posts. Others follow them, comment, and get alerts.

## Stack
Next.js (App Router, TypeScript), Supabase (later), Vercel.

## Rules
- I'm new to coding: explain in plain language, one step at a time,
  and tell me what to run and what I should see.
- The look is NEON ARCADE (dark only): neon green = win, neon pink = loss,
  cyan = info, yellow = coins. Pixel fonts (Press Start 2P titles, Silkscreen
  labels/buttons), Geist for text, Geist Mono for numbers. Traders are players
  (pixel sprite avatar, LV, class, win streak); trades are "matches" with a
  score, HP/target bar and WIN / REKT badges; likes are "GG", alerts "Tail".
  app/globals.css is the source of truth. design/perpy-designs.html is the old
  X-style prototype, kept for reference only.
- reference/pixeltrade.html has working Hyperliquid code (live prices,
  candles, websocket reconnects). Reuse its approach when we add live data.
- Never put API keys, secrets or private keys in code. Use .env.local.
- Commit to Git after each working step.

## Project layout
- app/: pages. `/` Pit + matches feed, `/u/[handle]` player card,
  `/post/[id]` match page, `/scores` hi-scores, `/learn` animated
  "how to play" walkthrough (components/TradeDemo).
- components/: TradeCard (a trade), Slip (a feed post), Pit (heatmap),
  Tape (ticker), Header + Dock (nav), Side (home side column),
  Avatar (pixel sprite from the handle), PostView, ProfileLive...
- lib/mock.ts: fictional traders; their trades are defined by time/side/size.
- lib/hyperliquid.ts: public Hyperliquid API (snapshot of prices + 5m candles).
- lib/positions.ts: entry, mark, PnL, TP/SL from live prices. lib/format.ts.
- components/Market.tsx: live store (websocket, reconnect, polling backup).
  Use useMarket() in any client component to read live prices.
- components/ChartMode.tsx: Line / Candles switch shared by all price charts.
- app/globals.css: all styles; color tokens at the top, light and dark.

## Status
Step 1 done: Next.js setup and static pages (mock data).
Redesign done: neon arcade look (replaced X-style, then the receipts look).
Deployed on Vercel from the repo root (Root Directory empty; vercel.json sets the framework).
Live prices done: every chart and number comes from Hyperliquid in real time.
Pages are rebuilt every 60s with a fresh snapshot (ISR), then the browser streams.
Line/candles toggle and the /learn walkthrough done.
Next: real wallets (connect a wallet, read its actual positions and fills).
