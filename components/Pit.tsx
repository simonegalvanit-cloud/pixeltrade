"use client";

import Link from "next/link";
import { moneyShort, pct, usdShort } from "@/lib/format";
import { livePos } from "@/lib/positions";
import type { Player, Position } from "@/lib/trading";
import Avatar from "./Avatar";
import { useMarket } from "./Market";
import { useWallet } from "./Wallet";

// The Pit: a heatmap of top traders' biggest open positions, updated live.
// Bigger tile = bigger position. Brighter green or pink = bigger gain or loss
// (full brightness at ±40% return on margin).
export default function Pit({ items }: { items: { player: Player; pos: Position }[] }) {
  const { snap } = useMarket();
  const { address } = useWallet();
  if (!items.length) return <p className="muted mono" style={{ margin: 0 }}>Nobody in the Pit right now. Check back in a minute.</p>;
  const sizes: (1 | 2 | 3 | 4)[] = [4, 3, 1, 1, 2, 2, 1, 1];
  return (
    <div className="pit" aria-label="Open positions right now">
      {items.map(({ player, pos }, i) => {
        const l = livePos(pos, snap);
        const dir = l.pnl < 0 ? "down" : "up";
        const heat = Math.min(0.9, 0.1 + (Math.abs(l.roe) / 40) * 0.8);
        const side = pos.szi > 0 ? "long" : "short";
        const tile = sizes[i] ?? 1;
        return (
          <Link
            key={player.address}
            href={`/m/${player.address}/${encodeURIComponent(pos.coin)}`}
            className={`cell ${dir} s${tile}${player.address === address ? " you" : ""}`}
            style={{ "--h": heat.toFixed(3) } as React.CSSProperties}
            aria-label={`${player.name}: ${pos.coin} ${side} ${pos.lev}x, ${usdShort(l.pnl)}`}
          >
            <div>
              <div className="who"><Avatar seed={player.address} size={tile >= 3 ? 28 : 22} /><span>{player.name}</span></div>
              {tile > 1 && <div className="pos">{pos.coin} {side} ×{pos.lev} · {moneyShort(pos.posValue)}</div>}
            </div>
            <div>
              <div className="pv">{usdShort(l.pnl)}</div>
              {tile > 1 && <div className="roe">{pct(l.roe)} ROE</div>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
