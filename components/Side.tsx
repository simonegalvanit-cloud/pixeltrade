import Link from "next/link";
import { COIN_SYMBOL, MY_POSITIONS, PEOPLE, TRENDING, WHO_TO_FOLLOW } from "@/lib/mock";
import { toPath } from "@/lib/chart";
import Avatar from "./Avatar";
import { VerifiedCheck } from "./Icons";
import { FollowButton } from "./Buttons";

// Desktop side column on the home page.
export default function Side() {
  return (
    <aside className="side">
      <div className="box">
        <h3>Your book <small>2 open</small></h3>
        {MY_POSITIONS.map((p) => (
          <div className="line" key={p.coin}>
            <span className={`coin ${p.coin}`}>{COIN_SYMBOL[p.coin]}</span>
            <div className="t"><b>{p.coin}</b><small className={p.side === "long" ? "up" : "down"}>{p.side.toUpperCase()} {p.lev}x</small></div>
            <svg className="spark" viewBox="0 0 64 24" aria-hidden="true"><path d={toPath(p.spark, 64, 24, 2, 2)} fill="none" stroke={`var(--${p.dir})`} strokeWidth="2" /></svg>
            <b className={`${p.dir} mono`} style={{ minWidth: 72, textAlign: "right", fontSize: 13.5 }}>{p.pnl}</b>
          </div>
        ))}
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
        {TRENDING.map((m) => (
          <div className="line" key={m.coin}>
            <span className={`coin ${m.coin}`}>{COIN_SYMBOL[m.coin]}</span>
            <div className="t"><b>{m.coin}</b><small>{m.note}</small></div>
            <b className={`${m.dir} mono`} style={{ fontSize: 13.5 }}>{m.change}</b>
          </div>
        ))}
      </div>
    </aside>
  );
}
