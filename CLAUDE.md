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
- app/: pages. `/` feed, `/u/[handle]` profile, `/post/[id]` trade post.
- components/: Receipt (a trade), Slip (a feed post), Pit (heatmap),
  Tape (ticker), Header + Dock (nav), Side (home side column), Avatar...
- lib/mock.ts: fake data for now. lib/chart.ts: SVG line helpers.
- app/globals.css: all styles; color tokens at the top, light and dark.

## Status
Step 1 done: Next.js setup and static pages (mock data).
Redesign done: "show the receipts" look replaced the X-style layout.
Deployed on Vercel from the repo root (Root Directory empty; vercel.json sets the framework).
Next: live prices.
