"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchOrders, fetchState } from "@/lib/hyperliquid";
import { pct, usd, usdBig } from "@/lib/format";
import { dayChange, livePos } from "@/lib/positions";
import { parsePositions, type Player, type Position } from "@/lib/trading";
import Coin from "./Coin";
import { useMarket } from "./Market";
import { signIn, useSession } from "./Session";

// Your connected wallet's open positions, refreshed every 30 seconds.
export function useBook(address: string | null) {
  const [book, setBook] = useState<{ positions: Position[]; accountValue: number } | null>(null);
  useEffect(() => {
    if (!address) { setBook(null); return; }
    let on = true;
    const load = async () => {
      try {
        const [s, o] = await Promise.all([fetchState(address, { cache: "no-store" }), fetchOrders(address, { cache: "no-store" }).catch(() => [])]);
        if (on) setBook({ positions: parsePositions(address, s, o), accountValue: +s.marginSummary.accountValue });
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => { on = false; clearInterval(t); };
  }, [address]);
  return book;
}

const WATCH = ["BTC", "ETH", "SOL", "HYPE", "XRP", "DOGE", "SUI", "BNB", "AVAX", "LINK", "PUMP", "ENA", "kPEPE", "FARTCOIN", "WIF", "TRUMP"];

// Desktop side column on the home page.
export default function Side({ ranked }: { ranked: Player[] }) {
  const { snap } = useMarket();
  const { address, member } = useSession();
  const book = useBook(address);
  const movers = WATCH.filter((c) => snap?.mids[c])
    .map((c) => ({ c, ch: dayChange(c, snap) }))
    .sort((a, b) => Math.abs(b.ch) - Math.abs(a.ch))
    .slice(0, 5);

  return (
    <aside className="side">
      <div className="box">
        <h3>Your book <small>{member ? `@${member.handle}` : "P1"}</small></h3>
        {!address && (
          <>
            <p className="muted" style={{ margin: "0 0 10px", fontSize: 13.5 }}>Join perpy to trade and see your live positions here.</p>
            <button type="button" className="btn go sm" onClick={() => signIn()}>Sign up / Log in</button>
          </>
        )}
        {address && !book && <span className="skel" style={{ width: "100%" }} />}
        {address && book && book.positions.length === 0 && (
          <p className="muted mono" style={{ margin: 0, fontSize: 12.5 }}>No open positions. Account: ${Math.round(book.accountValue).toLocaleString("en-US")}{book.accountValue < 5 && <> · <Link className="cyan" href="/wallet">deposit</Link></>}</p>
        )}
        {book?.positions.map((p) => {
          const l = livePos(p, snap);
          const dir = l.pnl >= 0 ? "up" : "down";
          return (
            <Link className="line" key={p.coin} href={`/m/${member?.handle}/${encodeURIComponent(p.coin)}`}>
              <Coin coin={p.coin} />
              <div className="t"><b>{p.coin}</b><small className={p.szi > 0 ? "up" : "down"}>{p.szi > 0 ? "LONG" : "SHORT"} ×{p.lev}</small></div>
              <b className={`${dir} mono`} style={{ textAlign: "right", fontSize: 13 }}>{usd(l.pnl)}</b>
            </Link>
          );
        })}
      </div>

      <div className="box">
        <h3>Hi-scores <small>30D PNL</small></h3>
        {ranked.length === 0 && <p className="muted mono" style={{ margin: 0, fontSize: 12.5 }}>No scores yet. Be player one.</p>}
        <table className="hs">
          <tbody>
            {ranked.slice(0, 5).map((p, i) => (
              <tr key={p.address}>
                <td className="rk">{i + 1}.</td>
                <td className="nm"><Link href={`/u/${p.handle}`}>@{p.handle}</Link></td>
                <td className="v">{usdBig(p.perf.month.pnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link className="btn sm" href="/scores" style={{ width: "100%", marginTop: 10 }}>All hi-scores</Link>
      </div>

      <div className="box">
        <h3>Big movers <small>24H</small></h3>
        {movers.map(({ c, ch }) => (
          <div className="line" key={c}>
            <Coin coin={c} />
            <div className="t"><b>{c}</b><small>{snap?.mids[c] ? snap.mids[c].toLocaleString("en-US", { maximumSignificantDigits: 6 }) : ""}</small></div>
            <b className={`${ch >= 0 ? "up" : "down"} mono`} style={{ fontSize: 13 }}>{pct(ch, 2)}</b>
          </div>
        ))}
      </div>

      <Link className="learn-cta" href="/learn">
        <small>INSERT COIN</small>
        <b>New to perps? Watch how a trade works →</b>
        <span>Long, short, leverage, stop loss. 30 seconds.</span>
      </Link>
    </aside>
  );
}
