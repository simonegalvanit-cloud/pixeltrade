# perpy

Social trading app. Traders connect a wallet; their Hyperliquid perp trades
become public, verified posts. Others follow them, comment, and get alerts.

## Stack
Next.js (App Router, TypeScript), Supabase (later), Vercel.

## Rules
- I'm new to coding: explain in plain language, one step at a time,
  and tell me what to run and what I should see.
- The look is "show the receipts": every trade is a printed receipt (mono
  numbers, torn edge, stamp, barcode), the Pit heatmap replaces stories,
  profiles are trader cards. app/globals.css is the source of truth.
  design/perpy-designs.html is the old X-style prototype, kept for reference.
- reference/pixeltrade.html has working Hyperliquid code (live prices,
  candles, websocket reconnects). Reuse its approach when we add live data.
- Never put API keys, secrets or private keys in code. Use .env.local.
- Commit to Git after each working step.

## Project layout
- app/: pages. `/` feed, `/u/[handle]` profile, `/post/[id]` trade post,
  `/learn` animated "how a trade works" walkthrough (components/TradeDemo).
- components/: Receipt (a trade), Slip (a feed post), Pit (heatmap),
  Tape (ticker), Header + Dock (nav), Side (home side column), Avatar...
- lib/mock.ts: fictional traders; their trades are defined by time/side/size.
- lib/hyperliquid.ts: public Hyperliquid API (snapshot of prices + 5m candles).
- lib/positions.ts: entry, mark, PnL, TP/SL from live prices. lib/format.ts.
- components/Market.tsx: live store (websocket, reconnect, polling backup).
  Use useMarket() in any client component to read live prices.
- components/ChartMode.tsx: Line / Candles switch shared by all price charts.
- app/globals.css: all styles; color tokens at the top, light and dark.

## Status
Step 1 done: Next.js setup and static pages (mock data).
Redesign done: "show the receipts" look replaced the X-style layout.
Deployed on Vercel from the repo root (Root Directory empty; vercel.json sets the framework).
Live prices done: every chart and number comes from Hyperliquid in real time.
Pages are rebuilt every 60s with a fresh snapshot (ISR), then the browser streams.
Line/candles toggle and the /learn walkthrough done.
Next: real wallets (connect a wallet, read its actual positions and fills).
