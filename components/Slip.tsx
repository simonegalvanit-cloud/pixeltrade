"use client";

import Link from "next/link";
import { PEOPLE, levelOf, type Post } from "@/lib/mock";
import { fillText, livePosition } from "@/lib/positions";
import Avatar from "./Avatar";
import { BellIcon, ReplyIcon, ShareIcon, VerifiedCheck } from "./Icons";
import { LikeButton } from "./Buttons";
import { useMarket } from "./Market";
import PostLink from "./PostLink";
import TradeCard from "./TradeCard";
import { ToastButton } from "./Toast";

export const Flame = ({ n }: { n: number }) => n > 0 ? (
  <span className="flame" title={`${n} wins in a row`}>
    <svg viewBox="0 0 6 7" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 0h1v1h1v1h1v4H4v1H1V6H0V3h1V2h1z" fill="#FF8A3D" /><path d="M2 4h2v2H2z" fill="#FFE14D" /></svg>
    ×{n}
  </span>
) : null;

// One post in the feed, shown as a "match" card.
export default function Slip({ post }: { post: Post }) {
  const { snap } = useMarket();
  const u = PEOPLE[post.handle];
  const p = post.trade.kind === "open" ? livePosition(post.trade.pos, snap) : null;
  const ring = p ? (p.pnl >= 0 ? "up" : "down") : undefined;
  const state = post.trade.kind === "open" ? "" : post.trade.move >= 0 ? " won" : " rekt";
  return (
    <PostLink href={`/post/${post.id}`} className={`match click${state}`}>
      <div className="mh">
        <Link href={`/u/${u.handle}`} aria-label={u.name}><Avatar handle={u.handle} size={40} ring={ring} /></Link>
        <div className="t">
          <Link className="nm" href={`/u/${u.handle}`}>{u.name}{u.verified && <VerifiedCheck />}</Link>
          <div className="sub"><span className="tag lv">LV.{levelOf(u)}</span><span className="tag cl">{u.klass}</span><Flame n={u.streak} /><span>{post.time}</span></div>
        </div>
      </div>
      <div className="ctx">{post.context}</div>
      {post.text && <p className="note">{fillText(post.text, p)}</p>}
      <TradeCard id={`feed-${post.id}`} handle={post.handle} trade={post.trade} />
      <div className="acts">
        <LikeButton count={post.counts.likes} />
        <ToastButton className="btn" aria-label="Chat" message="Chat comes in a later level"><ReplyIcon />{post.counts.replies}</ToastButton>
        <ToastButton className="btn" aria-label="Share" message="Link copied"><ShareIcon /></ToastButton>
        <span className="sp" />
        <ToastButton className="btn cy" aria-label={`Get alerts when ${u.name} trades`} message="Trade alerts come in a later level"><BellIcon small />Tail</ToastButton>
      </div>
    </PostLink>
  );
}
