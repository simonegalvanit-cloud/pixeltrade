"use client";

import { COIN_SYMBOL, PEOPLE, POSITIONS, type TradeRef } from "@/lib/mock";
import { fmtLevel, fmtPx, money, pct, usd } from "@/lib/format";
import { closedTrade, livePosition, type LivePosition } from "@/lib/positions";
import { ChartToggle, useChartMode } from "./ChartMode";
import { LockIcon } from "./Icons";
import LineChart, { type Level } from "./LineChart";
import { useMarket } from "./Market";

const Skel = () => <span className="skel" />;

// A segmented bar, like a health bar in a game.
export function Meter({ frac, color, segments = 12 }: { frac: number; color: string; segments?: number }) {
  const on = Math.round(Math.max(0, Math.min(1, frac)) * segments);
  return (
    <div className="bar" style={{ "--c": color } as React.CSSProperties}>
      {Array.from({ length: segments }, (_, i) => <i key={i} className={i < on ? "on" : ""} />)}
    </div>
  );
}

// For an open trade: how far it is from the stop loss to the take profit,
// or, without those, how much of the margin is still left ("HP").
function progress(p: LivePosition) {
  if (p.tpPx && p.slPx) {
    return { label: ["SL", "TP"], frac: (p.mark - p.slPx) / (p.tpPx - p.slPx), text: "to target" };
  }
  const margin = p.size / p.lev;
  return { label: ["HP", `${Math.round(Math.min(1, (margin + p.pnl) / margin) * 100)}%`], frac: (margin + p.pnl) / margin, text: "margin left" };
}

// One trade as an arcade card: market, live chart, numbers, score and badge.
// Prices are live from Hyperliquid.
export default function TradeCard({
  id, handle, trade, chartHeight = 130, children,
}: {
  id: string; handle: string; trade: TradeRef; chartHeight?: number; children?: React.ReactNode;
}) {
  const { snap } = useMarket();
  const mode = useChartMode();
  const def = trade.kind === "open" ? POSITIONS[trade.pos] : trade;
  const side = def.side > 0 ? "long" : "short";
  const p = trade.kind === "open" ? livePosition(trade.pos, snap) : null;
  const c = trade.kind === "closed" ? closedTrade(trade, snap) : null;
  const win = trade.kind === "closed" && trade.move >= 0;

  const levels: Level[] = [];
  if (p) {
    levels.push({ v: p.entry, kind: "e", label: `Entry ${fmtPx(p.entry)}` });
    if (trade.kind === "open" && !trade.hiddenLevels) {
      if (p.tpPx) levels.push({ v: p.tpPx, kind: "t", label: `TP ${fmtLevel(p.tpPx)}` });
      if (p.slPx) levels.push({ v: p.slPx, kind: "s", label: `SL ${fmtLevel(p.slPx)}` });
    }
  }
  const prog = p ? progress(p) : null;
  const dirColor = (up: boolean) => (up ? "var(--up)" : "var(--down)");

  return (
    <>
      <div className="mk">
        <span className={`coin ${def.coin}`}>{COIN_SYMBOL[def.coin]}</span>
        <span className="sym">{def.coin}-PERP</span>
        <span className={`tag ${side}`}>{side} ×{def.lev}</span>
      </div>

      {trade.kind === "open" ? (
        <>
          <div className="chart-h"><span>Live · 6h of 5m</span><ChartToggle /></div>
          <div className="chart">
            {p ? (
              <LineChart id={id} height={chartHeight} pts={p.pts} candles={p.candles} mode={mode} levels={levels} dir={p.pnl >= 0 ? "up" : "down"} entryIndex={p.entryIndex} />
            ) : (
              <div style={{ height: chartHeight }} />
            )}
          </div>
          <div className="stats4">
            <div><span>Entry</span><b>{p ? fmtPx(p.entry) : <Skel />}</b></div>
            <div><span>Mark</span><b>{p ? fmtPx(p.mark) : <Skel />}</b></div>
            <div><span>Size</span><b>{money(def.size)}</b></div>
            <div><span>ROE</span><b className={p && p.pnl < 0 ? "down" : "up"}>{p ? pct(p.roe) : <Skel />}</b></div>
          </div>
          <div className="score">
            <div><small>Score · unrealized PnL</small><span className={`big ${p && p.pnl < 0 ? "down" : "up"}`}>{p ? usd(p.pnl) : <Skel />}</span></div>
          </div>
          {p && prog && (
            <div className="hp">
              <div className="lbl"><span>{prog.label[0]}</span><span>{prog.text}</span><span>{prog.label[1]}</span></div>
              <Meter frac={prog.frac} color={dirColor(p.pnl >= 0)} />
            </div>
          )}
          {trade.hiddenLevels && <div className="hidden-lv"><LockIcon />TP / SL hidden until the match ends</div>}
          <span className="badge live">Live</span>
        </>
      ) : (
        <>
          <div className="stats4">
            <div><span>Entry</span><b>{c ? fmtPx(c.entry) : <Skel />}</b></div>
            <div><span>Exit</span><b>{c ? fmtPx(c.exit) : <Skel />}</b></div>
            <div><span>Held</span><b>{trade.held}</b></div>
            <div><span>Fees</span><b>{trade.fees}</b></div>
          </div>
          <div className="score">
            <div><small>Final score · realized PnL</small><span className={`big ${win ? "up" : "down"}`}>{c ? usd(c.pnl, 0) : <Skel />}</span></div>
            <div className={`roe ${win ? "up" : "down"}`}>{c ? `${pct(c.roe)} ROE` : ""}</div>
          </div>
          <span className={`badge ${win ? "win" : "rekt"}`}>{win ? "WIN" : "REKT"}</span>
          <span className={`burst${win ? " win" : ""}`} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</span>
        </>
      )}

      {children}

      <div className="vfoot"><span>✓ verified onchain</span><b>{PEOPLE[handle]?.wallet}</b></div>
    </>
  );
}
