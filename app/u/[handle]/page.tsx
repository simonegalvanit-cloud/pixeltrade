import { notFound } from "next/navigation";
import Coin from "@/components/Coin";
import { Tail, TailCounts } from "@/components/Social";
import { EditProfile } from "@/components/Account";
import PostSlip from "@/components/PostSlip";
import { VerifiedCheck, WalletIcon } from "@/components/Icons";
import { SeedMarkets } from "@/components/Market";
import { LiveAvatar, LiveTotal, PnlHistory } from "@/components/PlayerLive";
import PostLink from "@/components/PostLink";
import { Flame } from "@/components/Slip";
import { OpenCard } from "@/components/TradeCard";
import { getCandles, getMemberPlayer, getPortfolio, getPositions, getTrades } from "@/lib/data";
import { latestPosts } from "@/lib/db";
import { money, moneyShort, pct, usd, usdBig } from "@/lib/format";
import { shortAddr, type MarketData } from "@/lib/hyperliquid";
import { ago, classOf, dailyPnl, levelOf, streakOf, winRate, xpOf, type ClosedTrade } from "@/lib/trading";

// Pages are built on first visit and then refreshed in the background.
export function generateStaticParams() {
  return [];
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return { title: `@${decodeURIComponent(handle)} · perpy` };
}

// 13 weeks of real trading days. Green = profitable day, pink = losing day.
function TrackRecord({ trades }: { trades: ClosedTrade[] }) {
  const daily = dailyPnl(trades);
  const today = Math.floor(Date.now() / 86400000);
  const start = today - 90 - ((today - 90 + 4) % 7); // start on a Monday
  const days = Array.from({ length: today - start + 1 }, (_, i) => daily.get(start + i));
  const max = Math.max(1, ...days.map((v) => Math.abs(v ?? 0)));
  return (
    <>
      <div className="cal" aria-label="Daily results">
        {days.map((v, i) => (
          <i key={i} className={v === undefined ? "" : v >= 0 ? "u" : "d"} title={v === undefined ? "" : usd(v, 0)}
            style={{ "--h": v === undefined ? 0 : (0.3 + 0.7 * Math.sqrt(Math.abs(v) / max)).toFixed(2) } as React.CSSProperties} />
        ))}
      </div>
      <div className="legend">
        rekt <i style={{ background: "var(--down)" }} /><i style={{ background: "var(--panel-3)" }} /><i style={{ background: "var(--up)" }} /> win
      </div>
    </>
  );
}

// RPG-style stat with a 10-segment meter.
function Stat({ label, value, frac, color }: { label: string; value: string; frac: number; color?: string }) {
  const on = Math.round(Math.max(0, Math.min(1, frac)) * 10);
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
      <div className="meter" style={color ? ({ "--m": color } as React.CSSProperties) : undefined}>
        {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < on ? "on" : ""} />)}
      </div>
    </div>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const found = await getMemberPlayer(decodeURIComponent(handle).toLowerCase().replace(/^@/, ""));
  if (!found) notFound();
  const { member, player } = found;
  const address = member.wallet;

  const [book, trades, portfolio, posts] = await Promise.all([
    getPositions(address, true).catch(() => null),
    getTrades(address, 90).catch(() => [] as ClosedTrade[]),
    getPortfolio(address),
    latestPosts(10, address),
  ]);
  const positions = book?.positions ?? [];
  const accountValue = book?.accountValue ?? player.accountValue;
  const p = { ...player, accountValue: accountValue || player.accountValue };

  const candles = await Promise.all(positions.slice(0, 6).map((x) => getCandles(x.coin)));
  const markets: Record<string, MarketData> = {};
  positions.slice(0, 6).forEach((x, i) => { if (candles[i]) markets[x.coin] = candles[i]!; });

  const pnlSeries = (key: string): [number, number][] =>
    (portfolio.find(([k]) => k === key)?.[1].pnlHistory ?? []).map(([t, v]) => [t, +v]);
  const series = { "7D": pnlSeries("perpWeek"), "30D": pnlSeries("perpMonth"), All: pnlSeries("perpAllTime") };
  const month = player.perf.month.pnl || (series["30D"].length ? series["30D"][series["30D"].length - 1][1] - series["30D"][0][1] : 0);

  const wr = winRate(trades);
  const streak = streakOf(trades);
  const best = trades.reduce((a, t) => Math.max(a, t.pnl), 0);
  const notional = positions.reduce((a, x) => a + x.posValue, 0);
  const avgLev = notional ? positions.reduce((a, x) => a + x.lev * x.posValue, 0) / notional : 0;
  const klass = classOf(p, positions);
  const lv = levelOf(p);
  const xp = xpOf(p);
  const hasAnything = positions.length || trades.length || p.perf.allTime.vlm || series.All.length;

  return (
    <>
      <SeedMarkets markets={markets} />
      <section className="player" style={{ "--c1": "#9B5CFF" } as React.CSSProperties}>
        <LiveAvatar address={address} positions={positions} size={120} label={p.name} />
        <div style={{ minWidth: 0 }}>
          <div className="kick">Player select · class: {klass}</div>
          <h1>{p.name}<VerifiedCheck /></h1>
          <div className="hd"><span>@{member.handle}</span><span className="tag lv">LV.{lv}</span><span className="tag cl">{klass}</span><Flame n={streak} /></div>
          {member.bio && <p className="bio">{member.bio}</p>}
          <div className="facts">
            <a href={`https://app.hyperliquid.xyz/explorer/address/${address}`} rel="noopener noreferrer" target="_blank" title="Every trade is verifiable onchain"><WalletIcon small />{shortAddr(address)} · verified onchain ↗</a>
            <span>Account {moneyShort(accountValue)}</span>
            <span>Joined {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          </div>
          <div className="xp">
            <div className="lbl"><span>XP · LV.{lv}</span><span>{Math.round(xp * 100)}% to LV.{lv + 1} · {moneyShort(p.perf.allTime.vlm)} traded</span></div>
            <div className="bar"><i style={{ width: `${Math.max(4, xp * 100)}%` }} /></div>
          </div>
        </div>
        <div className="big">
          <small>30-DAY SCORE</small>
          <b className={month >= 0 ? "" : "down"} style={month < 0 ? { color: "var(--down)", textShadow: "0 0 20px var(--down)" } : undefined}>{usdBig(month)}</b>
          <div className="acts2">
            <Tail wallet={address} handle={member.handle} />
            <EditProfile handle={member.handle} />
          </div>
        </div>
        <div className="ff">
          <LiveTotal positions={positions} />
          <TailCounts wallet={address} />
          {p.perf.month.roi !== 0 && <span>30d ROI <b>{pct(p.perf.month.roi * 100)}</b></span>}
          <span>All-time PnL <b>{usdBig(p.perf.allTime.pnl)}</b></span>
        </div>
      </section>

      {!hasAnything && <p className="empty">@{member.handle} hasn&apos;t played a match yet. Tail them to see their first trade.</p>}

      <div className="rpg">
        <Stat label="WIN RATE · 90D" value={wr === null ? "—" : `${Math.round(wr * 100)}%`} frac={wr ?? 0} color="var(--up)" />
        <Stat label="RISK (LEVERAGE)" value={avgLev ? `×${avgLev.toFixed(1)}` : "—"} frac={avgLev / 25} color={avgLev > 10 ? "var(--down)" : "var(--coin)"} />
        <Stat label="BEST HIT · 90D" value={best ? usdBig(best) : "—"} frac={best ? 0.8 : 0} color="var(--cyan)" />
        <Stat label="MATCHES · 90D" value={String(trades.length)} frac={trades.length / 200} color="var(--purple)" />
      </div>

      {positions.length > 0 && (
        <>
          <div className="sec-h"><h2><span className="bl" />LIVE MATCHES</h2><small>{positions.length} open</small></div>
          <div className="board" style={{ marginBottom: 20 }}>
            {positions.map((pos) => (
              <PostLink key={pos.coin} href={`/m/${member.handle}/${encodeURIComponent(pos.coin)}`} className="match click">
                <OpenCard pos={pos} market={markets[pos.coin]} />
              </PostLink>
            ))}
          </div>
        </>
      )}

      {posts.length > 0 && (
        <>
          <div className="sec-h"><h2>CALLS</h2><small>{posts.length} post{posts.length > 1 ? "s" : ""}</small></div>
          <div className="board" style={{ marginBottom: 20 }}>
            {posts.map((post) => (
              <PostSlip key={post.id} post={post} player={p} pos={positions.find((x) => x.coin === post.coin) ?? null} market={post.coin ? markets[post.coin] : null} />
            ))}
          </div>
        </>
      )}

      <div className="duo">
        <div className="box">
          <h3>Track record <small>LAST 13 WEEKS · REAL</small></h3>
          <TrackRecord trades={trades} />
        </div>
        <PnlHistory series={series} />
      </div>

      <div className="sec-h"><h2>MATCH HISTORY</h2><small>Closed trades · last 90 days</small></div>
      {trades.length === 0 && <p className="muted mono">No closed trades in the last 90 days.</p>}
      <div className="history">
        {trades.slice(0, 12).map((t) => {
          const win = t.pnl >= 0;
          return (
            <div className={`hcard ${win ? "w" : "l"}`} key={t.id}>
              <div className="top2"><Coin coin={t.coin} /><span className="sym">{t.coin}</span><span className={`tag ${win ? "long" : "short"}`}>{win ? "WIN" : "REKT"}</span></div>
              <div className={`pv ${win ? "up" : "down"}`}>{usdBig(t.pnl)}</div>
              <small>{t.side > 0 ? "Long" : "Short"} · {moneyShort(t.sz * t.exitPx)} · {ago(t.time)} ago</small>
            </div>
          );
        })}
      </div>
    </>
  );
}
