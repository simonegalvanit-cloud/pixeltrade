"use client";

import { COIN_SYMBOL, PEOPLE, POSITIONS, type TradeRef } from "@/lib/mock";
import { rng } from "@/lib/chart";
import { fmtLevel, fmtPx, money, pct, usd } from "@/lib/format";
import { closedTrade, livePosition } from "@/lib/positions";
import { LockIcon } from "./Icons";
import LineChart, { type Level } from "./LineChart";
import { useMarket } from "./Market";

// A barcode drawn from a seed, so each receipt gets its own stripes.
function Barcode({ seed }: { seed: number }) {
  const r = rng(seed * 97 + 13);
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 118) {
    const w = r() < 0.5 ? 1 : r() < 0.7 ? 2 : 3;
    bars.push({ x, w });
    x += w + (r() < 0.6 ? 1 : 2);
  }
  return (
    <svg className="bars" viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b) => <rect key={b.x} x={b.x} y="0" width={b.w} height="30" fill="currentColor" />)}
    </svg>
  );
}

const Skel = () => <span className="skel" />;

// Every trade is printed as a receipt: market, side, prices, result, a stamp,
// and a barcode footer with the wallet it was read from. Prices are live.
export default function Receipt({
  id, no, handle, time, trade, chartHeight = 120, children,
}: {
  id: string; no: number; handle: string; time: string; trade: TradeRef; chartHeight?: number; children?: React.ReactNode;
}) {
  const { snap } = useMarket();
  const def = trade.kind === "open" ? POSITIONS[trade.pos] : trade;
  const sideTxt = `${def.side > 0 ? "Long" : "Short"} ${def.lev}x`;
  const p = trade.kind === "open" ? livePosition(trade.pos, snap) : null;
  const c = trade.kind === "closed" ? closedTrade(trade, snap) : null;

  const levels: Level[] = [];
  if (p) {
    levels.push({ v: p.entry, kind: "e", label: `Entry ${fmtPx(p.entry)}` });
    if (trade.kind === "open" && !trade.hiddenLevels) {
      if (p.tpPx) levels.push({ v: p.tpPx, kind: "t", label: `TP ${fmtLevel(p.tpPx)}` });
      if (p.slPx) levels.push({ v: p.slPx, kind: "s", label: `SL ${fmtLevel(p.slPx)}` });
    }
  }
  const win = trade.kind === "closed" && trade.move >= 0;

  return (
    <div className="rc-wrap">
      <div className="rc">
        <div className="hd"><span>perpy · receipt <b>No. {String(no).padStart(6, "0")}</b></span><span>{time} ago</span></div>
        <hr />
        <div className="mk">
          <span className={`coin ${def.coin}`}>{COIN_SYMBOL[def.coin]}</span>
          <span className="sym">{def.coin}-PERP</span>
        </div>
        <div className="row" style={{ marginTop: 8 }}><span>Side</span><b className={def.side > 0 ? "up" : "down"}>{sideTxt.toUpperCase()}</b></div>

        {trade.kind === "open" ? (
          <>
            <div className="row"><span>Entry</span><b>{p ? fmtPx(p.entry) : <Skel />}</b></div>
            <div className="row"><span>Mark</span><b>{p ? fmtPx(p.mark) : <Skel />}</b></div>
            <div className="row"><span>Size</span><b>{money(def.size)}</b></div>
            <div className="chart">
              {p ? (
                <LineChart id={id} height={chartHeight} pts={p.pts} levels={levels} dir={p.pnl >= 0 ? "up" : "down"} entryIndex={p.entryIndex} />
              ) : (
                <div style={{ height: chartHeight }} />
              )}
            </div>
            {trade.hiddenLevels && <div className="hid"><LockIcon />TP / SL hidden until close</div>}
          </>
        ) : (
          <>
            <div className="row"><span>Entry</span><b>{c ? fmtPx(c.entry) : <Skel />}</b></div>
            <div className="row"><span>Exit</span><b>{c ? fmtPx(c.exit) : <Skel />}</b></div>
            <div className="row"><span>Held</span><b>{trade.held}</b></div>
            <div className="row"><span>Fees</span><b>{trade.fees}</b></div>
          </>
        )}

        {children}

        <hr className="dbl" />
        {trade.kind === "open" ? (
          <div className="tot">
            <span>Unrealized<br />PnL</span>
            <div>
              <b className={p && p.pnl < 0 ? "down" : "up"}>{p ? usd(p.pnl) : <Skel />}</b>
              {p && <small className={p.pnl < 0 ? "down" : "up"}>{pct(p.roe)} on margin</small>}
            </div>
          </div>
        ) : (
          <div className="tot">
            <span>Realized<br />PnL</span>
            <div><b className={win ? "up" : "down"}>{c ? usd(c.pnl, 0) : <Skel />}</b>{c && <small className={win ? "up" : "down"}>{pct(c.roe)} on margin</small>}</div>
          </div>
        )}
        <hr />
        <div className="foot">
          <Barcode seed={no} />
          <span style={{ textAlign: "right" }}>Verified onchain<br />{PEOPLE[handle]?.wallet}</span>
        </div>

        {trade.kind === "open" ? (
          <span className="stamp open">Open<small>live</small></span>
        ) : win ? (
          <span className="stamp win">Profit</span>
        ) : (
          <span className="stamp loss">Loss<small>stopped out</small></span>
        )}
      </div>
    </div>
  );
}
