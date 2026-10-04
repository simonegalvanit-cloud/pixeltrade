import { COIN_SYMBOL, type TradeCardData } from "@/lib/mock";
import { walk } from "@/lib/chart";
import { ChainIcon, LockIcon } from "./Icons";
import LineChart from "./LineChart";

// The trade attached to a post: market, side, leverage, chart or result, and stats.
export default function TradeCard({ id, card, chartHeight = 132 }: { id: string; card: TradeCardData; chartHeight?: number }) {
  const open = card.state === "open";
  return (
    <div className="tcard">
      <div className="th">
        <span className={`coin ${card.coin}`}>{COIN_SYMBOL[card.coin]}</span>
        <b>{card.coin}</b>
        <span className={`chip ${card.side}`}>{card.side === "long" ? "Long" : "Short"} {card.lev}x</span>
        <span className={`chip ${open ? "open" : ""}`} style={{ marginLeft: "auto" }}>{open ? "Open" : "Closed"}</span>
      </div>

      {card.state === "open" ? (
        <div className="chart">
          <LineChart
            id={id}
            height={chartHeight}
            pts={walk(card.seed, 60, card.from, card.to, card.vol)}
            levels={card.hiddenLevels ? [] : card.levels}
          />
        </div>
      ) : (
        <div className="result">
          <div><small>Realized PnL</small><span className={`big ${card.win ? "up" : "down"}`}>{card.pnl}</span></div>
          <div className={`roe ${card.win ? "up" : "down"}`}><small style={{ textAlign: "right" }}>On margin</small>{card.roe}</div>
        </div>
      )}

      <div className="tstats">
        {card.stats.map(([label, value, dir]) => (
          <div key={label}><span>{label}</span><b className={dir ?? ""}>{value}</b></div>
        ))}
      </div>

      {card.state === "open" && card.hiddenLevels && (
        <div className="hiddenlv"><LockIcon />Take profit and stop loss hidden until this trade closes</div>
      )}
      <div className="verified-note"><ChainIcon />Trade data read directly from the chain</div>
    </div>
  );
}
