"use client";

import type { MarketData } from "@/lib/hyperliquid";
import { fmtLevel, fmtPx, moneyShort, pct, usdBig } from "@/lib/format";
import { livePos } from "@/lib/positions";
import type { ClosedTrade, Position } from "@/lib/trading";
import { ChartToggle, useChartMode } from "./ChartMode";
import Coin from "./Coin";
import LineChart, { type Level } from "./LineChart";
import { useCoin, useMarket } from "./Market";

// A segmented bar, like a health bar in a game.
export function Meter({ frac, color, segments = 12 }: { frac: number; color: string; segments?: number }) {
  const on = Math.round(Math.max(0, Math.min(1, frac)) * segments);
  return (
    <div className="bar" style={{ "--c": color } as React.CSSProperties}>
      {Array.from({ length: segments }, (_, i) => <i key={i} className={i < on ? "on" : ""} />)}
    </div>
  );
}

// A live open position as an arcade card: market, chart, numbers, score, and a bar
// showing how far it is from the stop loss to the take profit (or, without them,
// how far from liquidation).
export function OpenCard({ pos, market, chartHeight = 130, children }: { pos: Position; market?: MarketData | null; chartHeight?: number; children?: React.ReactNode }) {
  useCoin(pos.coin);
  const { snap } = useMarket();
  const mode = useChartMode();
  const l = livePos(pos, snap, market);
  const side = pos.szi > 0 ? "long" : "short";
  const up = l.pnl >= 0;

  const levels: Level[] = [{ v: pos.entryPx, kind: "e", label: `Entry ${fmtPx(pos.entryPx)}` }];
  if (pos.tp) levels.push({ v: pos.tp, kind: "t", label: `TP ${fmtLevel(pos.tp)}` });
  if (pos.sl) levels.push({ v: pos.sl, kind: "s", label: `SL ${fmtLevel(pos.sl)}` });

  // Bar: SL → TP when both are set, otherwise distance to liquidation ("HP").
  let bar: { left: string; mid: string; right: string; frac: number } | null = null;
  if (pos.tp && pos.sl) {
    bar = { left: "SL", mid: "to target", right: "TP", frac: (l.mark - pos.sl) / (pos.tp - pos.sl) };
  } else if (pos.liqPx && pos.liqPx > 0) {
    const room = Math.abs(l.mark - pos.liqPx) / l.mark;
    bar = { left: "HP", mid: `${(room * 100).toFixed(1)}% from liquidation`, right: `LIQ ${fmtLevel(pos.liqPx)}`, frac: Math.min(1, room / 0.5) };
  }

  return (
    <>
      <div className="mk">
        <Coin coin={pos.coin} />
        <span className="sym">{pos.coin}-PERP</span>
        <span className={`tag ${side}`}>{side} ×{pos.lev}</span>
        {pos.levType === "isolated" && <span className="tag cy">isolated</span>}
      </div>
      <div className="chart-h"><span>Live · 6h of 5m</span><ChartToggle /></div>
      <div className="chart">
        {l.chart ? (
          <LineChart id={`${pos.address}-${pos.coin}`} height={chartHeight} pts={l.chart.pts} candles={l.chart.candles} mode={mode} levels={levels} dir={up ? "up" : "down"} />
        ) : (
          <div style={{ height: chartHeight, display: "grid", placeItems: "center" }} className="muted mono">loading chart…</div>
        )}
      </div>
      <div className="stats4">
        <div><span>Entry</span><b>{fmtPx(pos.entryPx)}</b></div>
        <div><span>Mark</span><b>{fmtPx(l.mark)}</b></div>
        <div><span>Size</span><b>{moneyShort(pos.posValue)}</b></div>
        <div><span>ROE</span><b className={up ? "up" : "down"}>{pct(l.roe)}</b></div>
      </div>
      <div className="score">
        <div><small>Score · unrealized PnL</small><span className={`big ${up ? "up" : "down"}`}>{usdBig(l.pnl)}</span></div>
      </div>
      {bar && (
        <div className="hp">
          <div className="lbl"><span>{bar.left}</span><span>{bar.mid}</span><span>{bar.right}</span></div>
          <Meter frac={bar.frac} color={up ? "var(--up)" : "var(--down)"} />
        </div>
      )}
      {children}
      <span className="badge live">Live</span>
    </>
  );
}

// A finished trade: WIN or REKT, with the real result.
export function ClosedCard({ trade }: { trade: ClosedTrade }) {
  const win = trade.pnl >= 0;
  const side = trade.side > 0 ? "long" : "short";
  const move = ((trade.exitPx - trade.entryPx) / trade.entryPx) * 100 * trade.side;
  return (
    <>
      <div className="mk">
        <Coin coin={trade.coin} />
        <span className="sym">{trade.coin}-PERP</span>
        <span className={`tag ${side}`}>{side}</span>
      </div>
      <div className="stats4">
        <div><span>Entry ≈</span><b>{fmtPx(trade.entryPx)}</b></div>
        <div><span>Exit</span><b>{fmtPx(trade.exitPx)}</b></div>
        <div><span>Size</span><b>{moneyShort(trade.sz * trade.exitPx)}</b></div>
        <div><span>Fees</span><b>{moneyShort(Math.abs(trade.fees))}</b></div>
      </div>
      <div className="score">
        <div><small>Final score · realized PnL</small><span className={`big ${win ? "up" : "down"}`}>{usdBig(trade.pnl)}</span></div>
        <div className={`roe ${win ? "up" : "down"}`}>{pct(move, 2)} price move</div>
      </div>
      <span className={`badge ${win ? "win" : "rekt"}`}>{win ? "WIN" : "REKT"}</span>
      <span className={`burst${win ? " win" : ""}`} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</span>
    </>
  );
}
