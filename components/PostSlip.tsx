"use client";

import Link from "next/link";
import type { Post } from "@/lib/db";
import { fmtPx, moneyShort } from "@/lib/format";
import type { MarketData } from "@/lib/hyperliquid";
import { ago, type Player, type Position } from "@/lib/trading";
import Avatar from "./Avatar";
import Coin from "./Coin";
import { useMarket } from "./Market";
import PostLink from "./PostLink";
import { PlayerLine } from "./Slip";
import { GG, Share, Tail } from "./Social";
import { OpenCard } from "./TradeCard";

// A written post: the trader's call, with their position attached.
// If the position is still open it's shown live; otherwise as it was when posted.
export function PostBody({ post, pos, market }: { post: Post; pos?: Position | null; market?: MarketData | null }) {
  const { snap } = useMarket();
  return (
    <>
      {post.body && <p className="note" style={{ whiteSpace: "pre-wrap" }}>{post.body}</p>}
      {pos ? (
        <OpenCard pos={pos} market={market} />
      ) : post.coin ? (
        <>
          <div className="mk">
            <Coin coin={post.coin} />
            <span className="sym">{post.coin}-PERP</span>
            <span className={`tag ${post.side === 1 ? "long" : "short"}`}>{post.side === 1 ? "long" : "short"} ×{post.lev}</span>
            <span className="tag cy">closed since</span>
          </div>
          <div className="stats4">
            <div><span>Entry</span><b>{post.entry_px ? fmtPx(post.entry_px) : "—"}</b></div>
            <div><span>Now</span><b>{snap?.mids[post.coin] ? fmtPx(snap.mids[post.coin]) : "—"}</b></div>
            <div><span>Size</span><b>{post.size_usd ? moneyShort(post.size_usd) : "—"}</b></div>
            <div><span>Moved</span><b>{post.entry_px && snap?.mids[post.coin] ? `${(((snap.mids[post.coin] - post.entry_px) / post.entry_px) * 100 * (post.side ?? 1)).toFixed(2)}%` : "—"}</b></div>
          </div>
        </>
      ) : null}
    </>
  );
}

export default function PostSlip({ post, player, pos, market }: { post: Post; player: Player; pos?: Position | null; market?: MarketData | null }) {
  return (
    <PostLink href={`/p/${post.id}`} className="match click">
      <div className="mh">
        <Link href={`/u/${player.handle}`} aria-label={player.name}><Avatar seed={player.address} size={40} label={player.name} /></Link>
        <PlayerLine player={player} sub={<span>{ago(new Date(post.created_at).getTime())} ago</span>} />
      </div>
      <div className="ctx">Called a shot{post.coin ? ` · ${post.coin}` : ""}</div>
      <PostBody post={post} pos={pos} market={market} />
      <div className="vfoot"><span>✓ position verified onchain</span><b>@{player.handle}</b></div>
      <div className="acts">
        <GG target={`post:${post.id}`} />
        <Share path={`/p/${post.id}`} />
        <span className="sp" />
        <Tail wallet={player.address} handle={player.handle} small />
      </div>
    </PostLink>
  );
}
