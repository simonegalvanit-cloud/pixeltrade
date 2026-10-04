"use client";

import Link from "next/link";
import { COIN_SYMBOL, MY_BOOK, PEOPLE, TRENDING, WHO_TO_FOLLOW } from "@/lib/mock";
import { toPath } from "@/lib/chart";
import { pct, usd } from "@/lib/format";
import { dayChange, livePosition } from "@/lib/positions";
import Avatar from "./Avatar";
import { VerifiedCheck } from "./Icons";
import { FollowButton } from "./Buttons";
import { useMarket } from "./Market";

// Desktop side column on the home page.
export default function Side() {
  const { snap } = useMarket();
  return (
    <aside className="side">
      <div className="box">
        <h3>Your book <small>{MY_BOOK.length} open</small></h3>
        {MY_BOOK.map((key) => {
          const p = livePosition(key, snap);
          if (!p) return <div className="line" key={key}><span className="skel" style={{ width: "100%" }} /></div>;
          const dir = p.pnl >= 0 ? "up" : "down";
          return (
            <div className="line" key={key}>
              <span className={`coin ${p.coin}`}>{COIN_SYMBOL[p.coin]}</span>
              <div className="t"><b>{p.coin}</b><small className={p.side > 0 ? "up" : "down"}>{p.side > 0 ? "LONG" : "SHORT"} {p.lev}x</small></div>
              <svg className="spark" viewBox="0 0 64 24" aria-hidden="true"><path d={toPath(p.pts.slice(-36), 64, 24, 2, 2)} fill="none" stroke={`var(--${dir})`} strokeWidth="2" /></svg>
              <b className={`${dir} mono`} style={{ minWidth: 76, textAlign: "right", fontSize: 13.5 }}>{usd(p.pnl)}</b>
            </div>
          );
        })}
      </div>

      <div className="box">
        <h3>Worth tailing <small>30d</small></h3>
        {WHO_TO_FOLLOW.map((h) => {
          const p = PEOPLE[h];
          return (
            <div className="line" key={h}>
              <Avatar handle={h} size={36} />
              <Link className="t" href={`/u/${h}`}><b>{p.name.split(" ")[0]}{p.verified && <VerifiedCheck />}</b><small className="up">{p.stats.pnl30d} · {p.stats.winRate} wins</small></Link>
              <FollowButton small />
            </div>
          );
        })}
      </div>

      <div className="box">
        <h3>Most posted <small>24h</small></h3>
        {TRENDING.map((m) => {
          const ch = dayChange(snap?.markets[m.coin]);
          return (
            <div className="line" key={m.coin}>
              <span className={`coin ${m.coin}`}>{COIN_SYMBOL[m.coin]}</span>
              <div className="t"><b>{m.coin}</b><small>{m.note}</small></div>
              <b className={`${ch >= 0 ? "up" : "down"} mono`} style={{ fontSize: 13.5 }}>{snap ? pct(ch, 2) : "…"}</b>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
