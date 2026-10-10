import { notFound } from "next/navigation";
import { FollowButton, Tabs } from "@/components/Buttons";
import { BellIcon, CalendarIcon, LinkIcon, VerifiedCheck, WalletIcon } from "@/components/Icons";
import { CoinSpark, LiveAvatar, LiveNow, OpenTile } from "@/components/ProfileLive";
import { Flame } from "@/components/Slip";
import { ToastButton } from "@/components/Toast";
import { COIN_SYMBOL, ME, PEOPLE, TILES, levelOf } from "@/lib/mock";
import { rng } from "@/lib/chart";

// Build one page per trader when the site is built.
export function generateStaticParams() {
  return Object.keys(PEOPLE).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const p = PEOPLE[decodeURIComponent((await params).handle)];
  return { title: p ? `${p.name} (@${p.handle}) · perpy` : "perpy" };
}

// 18 weeks of trading days as a pixel grid. Green = profitable day, pink = losing day.
function TrackRecord({ seed }: { seed: number }) {
  const r = rng(seed);
  const days = Array.from({ length: 18 * 7 }, () => {
    if (r() < 0.28) return { k: "", h: 0 };
    const win = r() < 0.62;
    return { k: win ? "u" : "d", h: 0.25 + r() * 0.75 };
  });
  return (
    <>
      <div className="cal" aria-label="Daily results for the last 18 weeks">
        {days.map((d, i) => <i key={i} className={d.k} style={{ "--h": d.h.toFixed(2) } as React.CSSProperties} />)}
      </div>
      <div className="legend">
        rekt <i style={{ background: "var(--down)" }} /><i style={{ background: "color-mix(in srgb,var(--down) 40%,var(--panel-3))" }} />
        <i style={{ background: "var(--panel-3)" }} />
        <i style={{ background: "color-mix(in srgb,var(--up) 40%,var(--panel-3))" }} /><i style={{ background: "var(--up)" }} /> win
      </div>
    </>
  );
}

function PnlChart({ seed }: { seed: number }) {
  // A made-up equity curve that trends up.
  const r = rng(seed);
  let v = 0;
  const pts = [0];
  for (let i = 0; i < 60; i++) { v += (r() - 0.36) * 1800; pts.push(v); }
  const W = 600, H = 170;
  const mn = Math.min(...pts), mx = Math.max(...pts), pad = (mx - mn) * 0.12;
  const y = (x: number) => H - ((x - (mn - pad)) / (mx + pad - (mn - pad))) * H;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * W).toFixed(1)},${y(p).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pnl-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#39FF88" stopOpacity=".3" /><stop offset="1" stopColor="#39FF88" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--line-2)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={`${d}L${W},${H}L0,${H}Z`} fill="url(#pnl-g)" />
      <path d={d} fill="none" stroke="var(--up)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 5px #39FF88)" }} />
    </svg>
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

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const handle = decodeURIComponent((await params).handle);
  const p = PEOPLE[handle];
  if (!p) notFound();
  const isMe = handle === ME;
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0);
  const lv = levelOf(p);
  const xp = (p.trades % 4.5) / 4.5;
  const lev = parseFloat(p.stats.avgLev);

  return (
    <>
      <section className="player" style={{ "--c1": p.colors[0] } as React.CSSProperties}>
        <LiveAvatar handle={handle} size={120} />
        <div style={{ minWidth: 0 }}>
          <div className="kick">Player {isMe ? "1 · that's you" : "select"} · class: {p.klass}</div>
          <h1>{p.name}{p.verified && <VerifiedCheck />}</h1>
          <div className="hd"><span>@{p.handle}</span><span className="tag lv">LV.{lv}</span><span className="tag cl">{p.klass}</span><Flame n={p.streak} /></div>
          <p className="bio">{p.bio}</p>
          <div className="facts">
            <span><WalletIcon small />{p.wallet}</span>
            {p.link && <a href={`https://${p.link}`} rel="noopener noreferrer" target="_blank"><LinkIcon small />{p.link}</a>}
            <span><CalendarIcon small />{p.joined.replace("Joined ", "Since ")}</span>
          </div>
          <div className="xp">
            <div className="lbl"><span>XP · LV.{lv}</span><span>{Math.round(xp * 100)}% to LV.{lv + 1}</span></div>
            <div className="bar"><i style={{ width: `${Math.max(4, xp * 100)}%` }} /></div>
          </div>
        </div>
        <div className="big">
          <small>30-DAY SCORE</small>
          <b>{p.stats.pnl30d}</b>
          <div className="acts2">
            {isMe ? (
              <ToastButton className="btn cy" message="Editing comes in a later level">Edit player</ToastButton>
            ) : (
              <>
                <ToastButton className="btn icon" aria-label={`Alerts for ${p.name}`} message="Trade alerts come in a later level"><BellIcon small /></ToastButton>
                <FollowButton />
              </>
            )}
          </div>
        </div>
        <div className="ff">
          <span><b>{p.followers}</b> followers</span>
          <span><b>{p.following}</b> following</span>
          <span><b>{p.alerts}</b> tailing</span>
          <LiveNow handle={handle} />
        </div>
      </section>

      <div className="rpg">
        <Stat label="WIN RATE" value={p.stats.winRate} frac={parseFloat(p.stats.winRate) / 100} color="var(--up)" />
        <Stat label="RISK (AVG LEV)" value={`×${lev}`} frac={lev / 10} color={lev > 6 ? "var(--down)" : "var(--coin)"} />
        <Stat label="BEST HIT" value={p.stats.best} frac={0.75} color="var(--cyan)" />
        <Stat label="MATCHES" value={String(p.trades)} frac={p.trades / 220} color="var(--purple)" />
      </div>

      <div className="duo">
        <div className="box">
          <h3>Track record <small>LAST 18 WEEKS</small></h3>
          <TrackRecord seed={seed} />
        </div>
        <div className="box pnlchart">
          <h3>PnL from the chain <Tabs variant="seg" options={["7D", "30D", "All"]} initial={1} label="Range" /></h3>
          <PnlChart seed={seed} />
        </div>
      </div>

      <div className="sec-h">
        <h2>MATCH HISTORY</h2>
        <Tabs options={["All", "Wins", "Rekt", "Live"]} label="Filter matches" />
      </div>
      <div className="history">
        <OpenTile handle={handle} />
        {TILES.slice(0, 8).map(([coin, side, result, kind, sub], i) => (
          <div className={`hcard ${kind}`} key={i}>
            <div className="top2"><span className={`coin ${coin}`}>{COIN_SYMBOL[coin]}</span><span className="sym">{coin}</span><span className={`tag ${kind === "l" ? "short" : "long"}`}>{kind === "l" ? "REKT" : "WIN"}</span></div>
            <div className={`pv ${kind === "l" ? "down" : "up"}`}>{result}</div>
            <small>{side.replace("x", "").replace(/ (\d+)/, " ×$1")} · {sub} ROE</small>
            <CoinSpark coin={coin} offset={30 + i * 20} color={kind === "l" ? "var(--down)" : "var(--up)"} />
          </div>
        ))}
      </div>
    </>
  );
}
