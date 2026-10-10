"use client";

import Link from "next/link";
import { COIN_SYMBOL, MY_BOOK, RANKED, TRENDING } from "@/lib/mock";
import { toPath } from "@/lib/chart";
import { pct, usd } from "@/lib/format";
import { dayChange, livePosition } from "@/lib/positions";
import { useMarket } from "./Market";

// Desktop side column on the home page.
export default function Side() {
  const { snap } = useMarket();
  return (
    <aside className="side">
      <Link className="learn-cta" href="/learn">
        <small>INSERT COIN</small>
        <b>New to perps? Watch how a trade works →</b>
        <span>Long, short, leverage, stop loss. 30 seconds.</span>
      </Link>

      <div className="box">
        <h3>Hi-scores <small>30D</small></h3>
        <table className="hs">
          <tbody>
            {RANKED.slice(0, 5).map((p, i) => (
              <tr key={p.handle}>
                <td className="rk">{i + 1}.</td>
                <td className="nm"><Link href={`/u/${p.handle}`}>{p.handle.split(".")[0]}</Link></td>
                <td className="v">{p.stats.pnl30d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link className="btn sm" href="/scores" style={{ width: "100%", marginTop: 10 }}>All hi-scores</Link>
      </div>

      <div className="box">
        <h3>Your book <small>{MY_BOOK.length} open</small></h3>
        {MY_BOOK.map((key) => {
          const p = livePosition(key, snap);
          if (!p) return <div className="line" key={key}><span className="skel" style={{ width: "100%" }} /></div>;
          const dir = p.pnl >= 0 ? "up" : "down";
          return (
            <div className="line" key={key}>
              <span className={`coin ${p.coin}`}>{COIN_SYMBOL[p.coin]}</span>
              <div className="t"><b>{p.coin}</b><small className={p.side > 0 ? "up" : "down"}>{p.side > 0 ? "LONG" : "SHORT"} ×{p.lev}</small></div>
              <svg className={`spark ${dir}`} viewBox="0 0 64 24" aria-hidden="true"><path d={toPath(p.pts.slice(-36), 64, 24, 2, 2)} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              <b className={`${dir} mono`} style={{ minWidth: 70, textAlign: "right", fontSize: 13 }}>{usd(p.pnl)}</b>
            </div>
          );
        })}
      </div>

      <div className="box">
        <h3>Hot markets <small>24H</small></h3>
        {TRENDING.map((m) => {
          const ch = dayChange(snap?.markets[m.coin]);
          return (
            <div className="line" key={m.coin}>
              <span className={`coin ${m.coin}`}>{COIN_SYMBOL[m.coin]}</span>
              <div className="t"><b>{m.coin}</b><small>{m.note}</small></div>
              <b className={`${ch >= 0 ? "up" : "down"} mono`} style={{ fontSize: 13 }}>{snap ? pct(ch, 2) : "…"}</b>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
