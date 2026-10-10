import Link from "next/link";
import Avatar from "@/components/Avatar";
import { Flame } from "@/components/Slip";
import { ME, RANKED, levelOf } from "@/lib/mock";

export const metadata = { title: "Hi-scores · perpy" };

// Arcade high-score table: traders ranked by 30-day PnL.
export default function Scores() {
  return (
    <div className="hs-page">
      <p className="sub">Ranked by 30-day PnL · verified onchain</p>
      <h1>HI-SCORES</h1>
      <p className="insert">PRESS START TO TAIL A PLAYER</p>
      <div className="board-hs">
        <div className="hsr head"><span>Rank</span><span /><span>Player</span><span className="hide-s" style={{ textAlign: "right" }}>Win rate</span><span style={{ textAlign: "right" }}>Score</span><span className="hide-s" style={{ textAlign: "right" }}>Risk</span></div>
        {RANKED.map((p, i) => (
          <Link key={p.handle} href={`/u/${p.handle}`} className={`hsr${p.handle === ME ? " me" : ""}`}>
            <span className="rk">{String(i + 1).padStart(2, "0")}</span>
            <Avatar handle={p.handle} size={40} />
            <span className="nm">
              <b>{p.handle}{p.handle === ME && <span className="tag lv">P1</span>}</b>
              <small><span className="tag lv">LV.{levelOf(p)}</span><span className="tag cl">{p.klass}</span><Flame n={p.streak} /></small>
            </span>
            <span className="wr hide-s">{p.stats.winRate}</span>
            <span className="sc">{p.stats.pnl30d}</span>
            <span className="wr hide-s" style={{ color: parseFloat(p.stats.avgLev) > 6 ? "var(--down)" : "var(--muted)" }}>×{parseFloat(p.stats.avgLev)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
