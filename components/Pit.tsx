"use client";

import Link from "next/link";
import { ME, PEOPLE, PIT_ORDER, POSITIONS } from "@/lib/mock";
import { pct, usdShort } from "@/lib/format";
import { livePosition } from "@/lib/positions";
import Avatar from "./Avatar";
import { useMarket } from "./Market";

// The Pit: a heatmap of everyone's open positions, updated live.
// Bigger tile = bigger position. Stronger green or red = bigger gain or loss
// (full color at ±40% return on margin).
export default function Pit() {
  const { snap } = useMarket();
  return (
    <div className="pit" aria-label="Open positions right now">
      {PIT_ORDER.map((key) => {
        const d = POSITIONS[key];
        const p = livePosition(key, snap);
        const person = PEOPLE[d.handle];
        const dir = p && p.pnl < 0 ? "down" : "up";
        const heat = p ? Math.min(0.9, 0.1 + (Math.abs(p.roe) / 40) * 0.8) : 0.1;
        const side = d.side > 0 ? "long" : "short";
        return (
          <Link
            key={key}
            href={`/u/${d.handle}`}
            className={`cell ${dir} s${d.tile}${heat > 0.45 ? " hot" : ""}${d.handle === ME ? " you" : ""}`}
            style={{ "--h": heat.toFixed(3) } as React.CSSProperties}
            aria-label={`${person.name}: ${d.coin} ${side} ${d.lev}x${p ? `, ${usdShort(p.pnl)}` : ""}`}
          >
            <div>
              <div className="who"><Avatar handle={d.handle} size={d.tile >= 3 ? 26 : 20} /><span>{person.name.split(" ")[0]}</span></div>
              {d.tile > 1 && <div className="pos" style={{ marginTop: 4 }}>{d.coin} {side} {d.lev}x</div>}
            </div>
            <div>
              <div className="pv">{p ? usdShort(p.pnl) : "…"}</div>
              {d.tile > 1 && p && <div className="roe">{pct(p.roe)} roe</div>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
