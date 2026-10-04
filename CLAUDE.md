# perpy

Social trading app. Traders connect a wallet; their Hyperliquid perp trades
become public, verified posts. Others follow them, comment, and get alerts.

## Stack
Next.js (App Router, TypeScript), Supabase (later), Vercel.

## Rules
- I'm new to coding: explain in plain language, one step at a time,
  and tell me what to run and what I should see.
- design/perpy-designs.html is the source of truth for the look.
- reference/pixeltrade.html has working Hyperliquid code (live prices,
  candles, websocket reconnects). Reuse its approach when we add live data.
- Never put API keys, secrets or private keys in code. Use .env.local.
- Commit to Git after each working step.

## Project layout
- app/: pages. `/` feed, `/u/[handle]` profile, `/post/[id]` trade post.
- components/: UI pieces (Avatar, TradeCard, PostItem, Nav, RightColumn...).
- lib/mock.ts: fake data for now. lib/chart.ts: SVG line helpers.
- app/globals.css: the design's CSS, copied from design/perpy-designs.html.

## Status
Step 1 done: Next.js setup and static pages from the design (mock data).
Deployed on Vercel from the repo root (Root Directory empty; vercel.json sets the framework).
Next: live prices.
