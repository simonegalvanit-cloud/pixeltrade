import { COIN_SYMBOL, PEOPLE, type TradeCardData } from "@/lib/mock";
import { rng, walk } from "@/lib/chart";
import { LockIcon } from "./Icons";
import LineChart from "./LineChart";

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

// Every trade is printed as a receipt: market, side, prices, result, a stamp,
// and a barcode footer with the wallet it was read from.
export default function Receipt({
  id, no, handle, time, card, chartHeight = 120, children,
}: {
  id: string; no: number; handle: string; time: string; card: TradeCardData; chartHeight?: number; children?: React.ReactNode;
}) {
  const open = card.state === "open";
  const side = `${card.side === "long" ? "Long" : "Short"} ${card.lev}x`;
  const pnl = open ? card.stats.find((s) => s[0] === "PnL") : undefined;
  const rows = open ? card.stats.filter((s) => s[0] !== "PnL") : card.stats;

  return (
    <div className="rc-wrap">
      <div className="rc">
        <div className="hd"><span>perpy · receipt <b>No. {String(no).padStart(6, "0")}</b></span><span>{time} ago</span></div>
        <hr />
        <div className="mk">
          <span className={`coin ${card.coin}`}>{COIN_SYMBOL[card.coin]}</span>
          <span className="sym">{card.coin}-PERP</span>
        </div>
        <div className="row" style={{ marginTop: 8 }}><span>Side</span><b className={card.side === "long" ? "up" : "down"}>{side.toUpperCase()}</b></div>
        {rows.map(([label, value]) => (
          <div className="row" key={label}><span>{label}</span><b>{value}</b></div>
        ))}

        {card.state === "open" && (
          <div className="chart">
            <LineChart id={id} height={chartHeight} pts={walk(card.seed, 60, card.from, card.to, card.vol)} levels={card.hiddenLevels ? [] : card.levels} />
          </div>
        )}
        {card.state === "open" && card.hiddenLevels && (
          <div className="hid"><LockIcon />TP / SL hidden until close</div>
        )}

        {children}

        <hr className="dbl" />
        {card.state === "open" ? (
          <div className="tot">
            <span>Unrealized<br />PnL</span>
            <b className={pnl?.[2] === "down" ? "down" : "up"}>{pnl?.[1]}</b>
          </div>
        ) : (
          <div className="tot">
            <span>Realized<br />PnL</span>
            <div><b className={card.win ? "up" : "down"}>{card.pnl}</b><small className={card.win ? "up" : "down"}>{card.roe} on margin</small></div>
          </div>
        )}
        <hr />
        <div className="foot">
          <Barcode seed={no} />
          <span style={{ textAlign: "right" }}>Verified onchain<br />{PEOPLE[handle]?.wallet}</span>
        </div>

        {card.state === "open" ? (
          <span className="stamp open">Open<small>live</small></span>
        ) : card.win ? (
          <span className="stamp win">Profit</span>
        ) : (
          <span className="stamp loss">Loss<small>stopped out</small></span>
        )}
      </div>
    </div>
  );
}
