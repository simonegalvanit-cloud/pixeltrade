import Link from "next/link";
import { ME, PEOPLE, PIT } from "@/lib/mock";
import Avatar from "./Avatar";

// The Pit: a heatmap of everyone's open positions.
// Bigger tile = bigger position. Stronger green or red = bigger gain or loss.
export default function Pit() {
  return (
    <div className="pit" aria-label="Open positions right now">
      {PIT.map((p) => {
        const person = PEOPLE[p.handle];
        return (
          <Link
            key={p.handle}
            href={`/u/${p.handle}`}
            className={`cell ${p.dir} s${p.size}${p.heat > 0.45 ? " hot" : ""}${p.handle === ME ? " you" : ""}`}
            style={{ "--h": p.heat } as React.CSSProperties}
            aria-label={`${person.name}: ${p.coin} ${p.side} ${p.lev}x, ${p.pnl}`}
          >
            <div>
              <div className="who"><Avatar handle={p.handle} size={p.size >= 3 ? 26 : 20} /><span>{person.name.split(" ")[0]}</span></div>
              {p.size > 1 && <div className="pos" style={{ marginTop: 4 }}>{p.coin} {p.side} {p.lev}x</div>}
            </div>
            <div>
              <div className="pv">{p.pnl}</div>
              {p.size > 1 && <div className="roe">{p.roe} roe</div>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
