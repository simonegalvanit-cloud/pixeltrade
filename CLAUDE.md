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
- app/: `/` the Pit + real matches, `/u/[address]` player card for any wallet,
  `/m/[address]/[coin]` one live position, `/scores` real leaderboard,
  `/learn` animated "how to play" walkthrough (components/TradeDemo).
- lib/hyperliquid.ts: every Hyperliquid call (prices, candles, leaderboard,
  clearinghouseState, frontendOpenOrders, userFills, portfolio). Public, no key.
- lib/trading.ts: turns wallet data into players, positions (with TP/SL),
  closed trades, win rate, streaks, levels (from volume) and classes.
- lib/data.ts: server-only page loaders with short in-memory caching
  (Hyperliquid rate-limits per IP). Leaderboard is ~50 MB, cached 10 min.
- lib/positions.ts: live PnL/ROE/chart for a position from streaming prices.
- components/Market.tsx: live store (websocket allMids + candles, reconnect,
  polling backup). useMarket() for prices, useCoin(coin) loads candles.
- components/Wallet.tsx: connect a browser wallet (EIP-6963), wallet search.
- Accounts: lib/session.ts (sign-in message, HMAC-signed cookies), app/api/auth/*
  (nonce → wallet signs → verify with viem → session). components/Session.tsx.
- Database: supabase/schema.sql (posts, follows, ggs, comments; RLS on, no
  policies: only the server's secret key can read/write). lib/db.ts.
  app/api/{posts,follow,gg,comments,social}. components/Social.tsx (GG, Tail,
  Chat, Share), Composer.tsx, PostSlip.tsx, Feed.tsx, /p/[id] post page.
- Env vars (Vercel + .env.local, see .env.example): SUPABASE_URL,
  SUPABASE_SECRET_KEY, SESSION_SECRET. Without them the social parts switch off.
- components/: TradeCard (OpenCard / ClosedCard), Slip (feed card), Pit, Side,
  Tape, Header + Dock, ScoreTable, PlayerLive, Avatar (sprite from address), Coin.
- app/globals.css: all styles; color tokens at the top.

## Status
- Neon arcade design. Deployed on Vercel from the repo root.
- REAL DATA: the Pit, feed, player cards, match pages and hi-scores all come
  from real Hyperliquid wallets. Prices stream live. Bots filtered out.
- Wallet connect: P1 = your wallet, "Your book" shows your live positions.
- Accounts built: sign in with wallet, post calls (with a real position
  attached, verified on Hyperliquid), Tail (follow), GG, chat, Tailing feed.
- Not yet: alerts (push/Telegram/email when someone you tail trades),
  smart-contract wallets for sign-in (only regular wallets for now).
