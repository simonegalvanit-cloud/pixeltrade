# perpy

SocialFi trading app. You sign up with email, Google or Apple (Privy), pick an
@handle, and Privy creates your own wallet (non-custodial: perpy never holds
keys). You fund it, trade real Hyperliquid perps inside perpy, and your trades
become public, verified matches. MEMBERS ONLY: the Pit, feed, hi-scores and
profiles only show perpy members, never the wider Hyperliquid world.

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
- app/: `/` the Pit + feed (members only), `/u/[handle]` player card,
  `/m/[handle]/[coin]` one live position, `/p/[id]` a post, `/scores` hi-scores
  of members, `/welcome` pick @handle after sign-up, `/wallet` address,
  balances and deposit to Hyperliquid, `/learn` animated walkthrough.
- Login: components/Providers.tsx (PrivyProvider: email/google/apple, embedded
  ETH wallet created on login, Arbitrum). components/Session.tsx (useSession,
  authFetch sends the Privy token, MeSync sends new users to /welcome).
  lib/auth.ts verifies Privy tokens with Privy's public JWKS (no secret) and
  asks Privy's API (with PRIVY_APP_SECRET) which wallet belongs to a user.
- Database: supabase/schema.sql: members (privy id, handle, name, wallet, bio),
  posts, follows, ggs, comments. RLS on with no policies: only the server's
  secret key can read/write. lib/db.ts. Posts/follows/ggs/comments are keyed
  by the member's wallet address.
- lib/data.ts: members-only loaders (listMembers → each wallet's positions,
  fills and portfolio from Hyperliquid), short in-memory caching.
- lib/hyperliquid.ts: Hyperliquid info API + websocket constants.
- lib/trading.ts: players (member + portfolio stats), positions with TP/SL,
  closed trades, win rate, streaks, levels, classes.
- lib/arbitrum.ts + components/AutoDeposit.tsx: AUTOMATIC deposits. While a
  member is on the site, every 20s: if their wallet has >= 5 USDC and a bit of
  ETH (user pays the fee), all USDC is sent to Hyperliquid's Bridge2 from their
  own Privy wallet with showWalletUIs:false (no popup). 3-min cooldown in
  localStorage prevents double sends. Under 5 USDC is never sent (it'd be
  LOST). Bridge verified active on-chain 2026-10-10; docs call it legacy:
  move to CCTP. WalletPanel shows address, balances and auto-deposit status.
- components/Market.tsx: live prices (websocket, reconnect, polling backup).
- components/: TradeCard, Slip, PostSlip, Feed, Pit, Side, Tape, Header,
  Account (badge, welcome form), Search (find @handle), Social (GG, Tail,
  Chat, Share), Composer, ScoreTable, PlayerLive, Avatar, Coin, TradeDemo.
- Env vars (see .env.example): PRIVY_APP_SECRET, SUPABASE_URL,
  SUPABASE_SECRET_KEY (NEXT_PUBLIC_PRIVY_APP_ID optional, built in).
- .npmrc legacy-peer-deps=true (Privy's optional smart-wallet peers conflict).
- app/globals.css: all styles; color tokens at the top.

## Status
- Stage 1 done: sign-up (Privy), @handle profiles, members-only Pit/feed/
  scores/profiles, wallet page with deposit, posts/GG/Tail/chat.
- Stage 2 next: trading inside perpy. Plan: user's Privy wallet signs a
  one-time approveAgent (user-signed action); a browser-generated agent key
  signs orders (L1 actions, chainId 1337) and can't withdraw.
- Stage 3: withdrawals, card on-ramp, alerts, region blocking.
