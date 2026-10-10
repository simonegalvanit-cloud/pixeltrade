import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Coin from "@/components/Coin";
import { Chat, GG, Tail } from "@/components/Social";
import { BackIcon } from "@/components/Icons";
import { SeedMarkets } from "@/components/Market";
import { Flame, PlayerLine } from "@/components/Slip";
import { ClosedCard, OpenCard } from "@/components/TradeCard";
import { getCandles, getFills, getMemberPlayer, getPositions } from "@/lib/data";
import { fmtLevel, fmtPx, money, moneyShort, usd } from "@/lib/format";
import { shortAddr } from "@/lib/hyperliquid";
import { ago, classOf, closedTrades, streakOf } from "@/lib/trading";

// Pages are built on first visit and then refreshed in the background.
export function generateStaticParams() {
  return [];
}

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ handle: string; coin: string }> }) {
  const { handle, coin } = await params;
  return { title: `${decodeURIComponent(coin)} · @${decodeURIComponent(handle)} · perpy` };
}

// One match: a player's position on one coin, live, with its trade log.
export default async function MatchPage({ params }: { params: Promise<{ handle: string; coin: string }> }) {
  const { handle, coin: rawCoin } = await params;
  const found = await getMemberPlayer(decodeURIComponent(handle).toLowerCase());
  if (!found) notFound();
  const { member, player } = found;
  const address = member.wallet;
  const coin = decodeURIComponent(rawCoin);

  const [book, fills, market] = await Promise.all([
    getPositions(address, true).catch(() => null),
    getFills(address, 30).catch(() => []),
    getCandles(coin),
  ]);
  const positions = book?.positions ?? [];
  const pos = positions.find((x) => x.coin === coin);
  const coinFills = fills.filter((f) => f.coin === coin).sort((a, b) => b.time - a.time);
  const trades = closedTrades(address, fills);
  const lastClosed = trades.find((t) => t.coin === coin);
  const klass = classOf(player, positions);
  const side = pos ? (pos.szi > 0 ? "LONG" : "SHORT") : null;

  return (
    <>
      {market && <SeedMarkets markets={{ [coin]: market }} />}
      <Link className="back" href="/"><BackIcon /> Back to the Pit</Link>
      <div className="postpg">
        <section className="thesis">
          <div className="author">
            <Link href={`/u/${member.handle}`}><Avatar seed={address} size={52} label={player.name} /></Link>
            <PlayerLine player={player} sub={<><span className="tag cl">{klass}</span><Flame n={streakOf(trades)} /></>} />
            <Tail wallet={address} handle={member.handle} />
          </div>

          {pos ? (
            <>
              <h1>{side} {coin} <em>×{pos.lev}</em></h1>
              <p>
                @{member.handle} is {side?.toLowerCase()} {Math.abs(pos.szi).toLocaleString("en-US", { maximumFractionDigits: 4 })} {coin} ({moneyShort(pos.posValue)})
                from an average entry of {fmtPx(pos.entryPx)}, using {moneyShort(pos.marginUsed)} of margin ({pos.levType}).
              </p>
              <p>
                {pos.liqPx && pos.liqPx > 0 ? <>Liquidation is at {fmtLevel(pos.liqPx)}. </> : <>No liquidation price: the account has enough margin to cover it. </>}
                {pos.tp || pos.sl ? <>They have {pos.tp ? `a take profit at ${fmtLevel(pos.tp)}` : ""}{pos.tp && pos.sl ? " and " : ""}{pos.sl ? `a stop loss at ${fmtLevel(pos.sl)}` : ""} on the books. </> : <>No take profit or stop loss is set on Hyperliquid. </>}
                Funding {pos.funding >= 0 ? "paid" : "received"} since opening: {money(Math.abs(pos.funding))}.
              </p>
            </>
          ) : (
            <>
              <h1>{coin} <em>match over</em></h1>
              <p>@{member.handle} has no open {coin} position right now.{lastClosed ? ` Their last ${coin} trade closed ${ago(lastClosed.time)} ago.` : ""}</p>
            </>
          )}
          <div className="thesis stats">
            <span>Read live from <b>Hyperliquid</b></span>
            <span>Wallet <b>{shortAddr(address)}</b></span>
            <span><a className="cyan" href={`https://app.hyperliquid.xyz/explorer/address/${address}`} target="_blank" rel="noopener noreferrer">Explorer ↗</a></span>
          </div>
        </section>

        <div className="rcol">
          <div className={`match${pos ? "" : lastClosed ? (lastClosed.pnl >= 0 ? " won" : " rekt") : ""}`}>
            <div className="mh">
              <Avatar seed={address} size={34} label={player.name} />
              <div className="t"><span className="nm">{player.name}</span></div>
            </div>
            {pos ? (
              <OpenCard pos={pos} market={market} chartHeight={220}>
                {(pos.tp || pos.sl) && (
                  <div className="plan">
                    <div><span>Take profit</span><b className="up">{pos.tp ? fmtLevel(pos.tp) : "—"}</b></div>
                    <div><span>Stop loss</span><b className="down">{pos.sl ? fmtLevel(pos.sl) : "—"}</b></div>
                  </div>
                )}
              </OpenCard>
            ) : lastClosed ? <ClosedCard trade={lastClosed} /> : <p className="muted" style={{ padding: 12 }}>No {coin} trades in the last 30 days.</p>}
            {coinFills.length > 0 && (
              <ul className="log" aria-label="Trade log">
                {coinFills.slice(0, 8).map((f) => (
                  <li key={f.tid}>
                    <time>{ago(f.time)}</time>
                    <span>{f.dir} {(+f.sz).toLocaleString("en-US", { maximumFractionDigits: 4 })} @ {fmtPx(+f.px)}<br />
                      <em>{+f.closedPnl ? `realized ${usd(+f.closedPnl, 0)}` : `${money(+f.sz * +f.px)} filled`}</em></span>
                  </li>
                ))}
              </ul>
            )}
            <div className="vfoot"><span>✓ verified onchain</span><b><Coin coin={coin} size={16} /></b></div>
            <div className="acts">
              <GG target={`pos:${address}:${coin}`} />
              <span className="sp" />
              <Tail wallet={address} handle={member.handle} small />
            </div>
          </div>
        </div>

        <section className="notes">
          <h2>CHAT</h2>
          <Chat target={`pos:${address}:${coin}`} />
        </section>
      </div>
    </>
  );
}
