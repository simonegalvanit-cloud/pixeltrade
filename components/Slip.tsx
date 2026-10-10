"use client";

import Link from "next/link";
import type { MarketData } from "@/lib/hyperliquid";
import { ago, levelOf, type ClosedTrade, type Player, type Position } from "@/lib/trading";
import { livePos } from "@/lib/positions";
import Avatar from "./Avatar";
import { VerifiedCheck } from "./Icons";
import { GG, Share, Tail } from "./Social";
import { useMarket } from "./Market";
import PostLink from "./PostLink";
import { ClosedCard, OpenCard } from "./TradeCard";

export const Flame = ({ n }: { n: number }) => n > 0 ? (
  <span className="flame" title={`${n} wins in a row`}>
    <svg viewBox="0 0 6 7" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 0h1v1h1v1h1v4H4v1H1V6H0V3h1V2h1z" fill="#FF8A3D" /><path d="M2 4h2v2H2z" fill="#FFE14D" /></svg>
    ×{n}
  </span>
) : null;

export function PlayerLine({ player, sub }: { player: Player; sub?: React.ReactNode }) {
  return (
    <div className="t">
      <Link className="nm" href={`/u/${player.handle}`}>{player.name}<VerifiedCheck /><span className="muted mono" style={{ fontWeight: 500, fontSize: 12.5 }}>@{player.handle}</span></Link>
      <div className="sub"><span className="tag lv">LV.{levelOf(player)}</span>{sub}</div>
    </div>
  );
}

type Item = { kind: "open"; player: Player; pos: Position } | { kind: "closed"; player: Player; trade: ClosedTrade };

// One real trade in the feed, shown as a "match" card.
export default function Slip({ item, market }: { item: Item; market?: MarketData | null }) {
  const { snap } = useMarket();
  const p = item.player;
  const open = item.kind === "open";
  const live = open ? livePos(item.pos, snap, market) : null;
  const ring = live ? (live.pnl >= 0 ? "up" : "down") : undefined;
  const state = open ? "" : item.trade.pnl >= 0 ? " won" : " rekt";
  const href = open ? `/m/${p.handle}/${encodeURIComponent(item.pos.coin)}` : `/u/${p.handle}`;
  return (
    <PostLink href={href} className={`match click${state}`}>
      <div className="mh">
        <Link href={`/u/${p.handle}`} aria-label={p.name}><Avatar seed={p.address} size={40} ring={ring} label={p.name} /></Link>
        <PlayerLine player={p} sub={<span>{open ? "in a match now" : `${ago(item.trade.time)} ago`}</span>} />
      </div>
      <div className="ctx">{open ? "Open position · live" : item.trade.pnl >= 0 ? "Closed a position · in profit" : "Closed a position · at a loss"}</div>
      {open ? <OpenCard pos={item.pos} market={market} /> : <ClosedCard trade={item.trade} />}
      <div className="vfoot"><span>✓ verified onchain</span><b>@{p.handle}</b></div>
      <div className="acts">
        <GG target={open ? `pos:${p.address}:${item.pos.coin}` : `trade:${p.address}:${item.trade.id}`} />
        <Share path={href} />
        <span className="sp" />
        <Tail wallet={p.address} handle={p.handle} small />
      </div>
    </PostLink>
  );
}
