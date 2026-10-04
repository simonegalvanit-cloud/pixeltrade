"use client";

import Link from "next/link";
import { COIN_SYMBOL, POSITIONS, POSTS, positionKeyFor, type Coin } from "@/lib/mock";
import { toPath } from "@/lib/chart";
import { pct, usd, usdShort } from "@/lib/format";
import { livePosition } from "@/lib/positions";
import Avatar from "./Avatar";
import { useMarket } from "./Market";

// Small live pieces of the profile page.

export function LiveAvatar({ handle, size }: { handle: string; size: number }) {
  const { snap } = useMarket();
  const key = positionKeyFor(handle);
  const p = key ? livePosition(key, snap) : null;
  return <Avatar handle={handle} size={size} ring={p ? (p.pnl >= 0 ? "up" : "down") : undefined} live={p ? usdShort(p.pnl) : undefined} />;
}

export function LiveNow({ handle }: { handle: string }) {
  const { snap } = useMarket();
  const key = positionKeyFor(handle);
  if (!key) return null;
  const d = POSITIONS[key];
  const p = livePosition(key, snap);
  return (
    <span>In a trade now: <b>{d.coin} {d.side > 0 ? "long" : "short"} {d.lev}x{p && ` · ${usd(p.pnl)}`}</b></span>
  );
}

// The trader's open position as a mini receipt that moves with the market.
export function OpenTile({ handle }: { handle: string }) {
  const { snap } = useMarket();
  const key = positionKeyFor(handle);
  if (!key) return null;
  const d = POSITIONS[key];
  const p = livePosition(key, snap);
  const col = !p ? "var(--ink)" : p.pnl >= 0 ? "var(--up)" : "var(--down)";
  const post = POSTS.find((x) => x.trade.kind === "open" && x.trade.pos === key);
  return (
    <Link className="mini-rc rc-wrap" href={post ? `/post/${post.id}` : "#"}>
      <div className="rc">
        <div className="hd"><span>No. live</span><span className="up">● open</span></div>
        <hr />
        <div className="mk"><span className={`coin ${d.coin}`}>{COIN_SYMBOL[d.coin]}</span><span className="sym" style={{ fontSize: 17 }}>{d.coin}</span><span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>{d.side > 0 ? "LONG" : "SHORT"} {d.lev}X</span></div>
        <div className="pv" style={{ color: col }}>{p ? usd(p.pnl, 0) : "…"}</div>
        <div className="muted" style={{ fontSize: 11.5 }}>{p ? `${pct(p.roe)} on margin, live` : "loading"}</div>
        {p && <svg className="sp" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><path d={toPath(p.pts, 100, 36, 3, 3)} fill="none" stroke={col} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>}
      </div>
    </Link>
  );
}

// Real price line for a coin over an earlier stretch of time (for past trades).
export function CoinSpark({ coin, offset, color }: { coin: Coin; offset: number; color: string }) {
  const { snap } = useMarket();
  const m = snap?.markets[coin];
  if (!m) return <svg className="sp" viewBox="0 0 100 36" aria-hidden="true" />;
  const end = Math.max(24, m.c.length - offset);
  const pts = m.c.slice(end - 24, end);
  return (
    <svg className="sp" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
      <path d={toPath(pts, 100, 36, 3, 3)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
