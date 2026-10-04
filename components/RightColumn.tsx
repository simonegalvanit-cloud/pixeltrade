import Link from "next/link";
import { COIN_SYMBOL, MY_POSITIONS, PEOPLE, TRENDING, WHO_TO_FOLLOW } from "@/lib/mock";
import { toPath } from "@/lib/chart";
import Avatar from "./Avatar";
import { SearchIcon, VerifiedCheck } from "./Icons";
import { FollowButton } from "./Buttons";

// Desktop: the column on the right with your positions, suggestions and markets.
export default function RightColumn() {
  return (
    <aside className="rcol">
      <label className="search"><SearchIcon small /><input placeholder="Search perpy" aria-label="Search perpy" /></label>

      <div className="panel">
        <h3>Your positions</h3>
        {MY_POSITIONS.map((p) => (
          <div className="prow" key={p.coin}>
            <span className={`coin ${p.coin}`}>{COIN_SYMBOL[p.coin]}</span>
            <div className="t">
              <b>{p.coin}</b>
              <small className={p.side === "long" ? "up" : "down"} style={{ fontWeight: 600 }}>{p.side === "long" ? "Long" : "Short"} {p.lev}x</small>
            </div>
            <svg className="spark" viewBox="0 0 70 26" aria-hidden="true">
              <path d={toPath(p.spark, 70, 26, 2, 2)} fill="none" stroke={`var(--${p.dir})`} strokeWidth="2" />
            </svg>
            <b className={p.dir} style={{ minWidth: 76, textAlign: "right" }}>{p.pnl}</b>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Who to follow</h3>
        {WHO_TO_FOLLOW.map((h) => {
          const p = PEOPLE[h];
          return (
            <div className="prow" key={h}>
              <Avatar handle={h} size={42} ring="up" />
              <Link className="t" href={`/u/${h}`}><b>{p.name}{p.verified && <VerifiedCheck />}</b><small>@{p.handle}</small></Link>
              <FollowButton small />
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h3>Trending markets</h3>
        {TRENDING.map((m) => (
          <div className="mk-row" key={m.coin}>
            <span className={`coin ${m.coin}`}>{COIN_SYMBOL[m.coin]}</span>
            <div className="t"><b>{m.coin}</b><small>{m.note}</small></div>
            <b className={m.dir}>{m.change}</b>
          </div>
        ))}
      </div>
    </aside>
  );
}
