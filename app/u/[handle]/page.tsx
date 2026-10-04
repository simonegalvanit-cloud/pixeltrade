import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton, Tabs } from "@/components/Buttons";
import { BellIcon, CalendarIcon, LinkIcon, VerifiedCheck, WalletIcon } from "@/components/Icons";
import { ToastButton } from "@/components/Toast";
import { CoinSpark, LiveAvatar, LiveNow, OpenTile } from "@/components/ProfileLive";
import { COIN_SYMBOL, ME, PEOPLE, TILES } from "@/lib/mock";
import { rng } from "@/lib/chart";

// Build one page per trader when the site is built.
export function generateStaticParams() {
  return Object.keys(PEOPLE).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const p = PEOPLE[decodeURIComponent((await params).handle)];
  return { title: p ? `${p.name} (@${p.handle}) · perpy` : "perpy" };
}

// 18 weeks of trading days. Green = profitable day, red = losing day, blank = no trades.
function TrackRecord({ seed }: { seed: number }) {
  const r = rng(seed);
  const days = Array.from({ length: 18 * 7 }, () => {
    const x = r();
    if (x < 0.28) return { k: "", h: 0 };
    const win = r() < 0.62;
    return { k: win ? "u" : "d", h: 0.25 + r() * 0.75 };
  });
  return (
    <>
      <div className="cal" aria-label="Daily results for the last 18 weeks">
        {days.map((d, i) => <i key={i} className={d.k} style={{ "--h": d.h.toFixed(2) } as React.CSSProperties} />)}
      </div>
      <div className="legend">
        loss <i style={{ background: "var(--down)" }} /><i style={{ background: "color-mix(in srgb,var(--down) 35%,var(--paper-2))" }} />
        <i style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }} />
        <i style={{ background: "color-mix(in srgb,var(--up) 35%,var(--paper-2))" }} /><i style={{ background: "var(--up)" }} /> profit
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
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--dash)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={`${d}L${W},${H}L0,${H}Z`} fill="var(--up-bg)" />
      <path d={d} fill="none" stroke="var(--up)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const handle = decodeURIComponent((await params).handle);
  const p = PEOPLE[handle];
  if (!p) notFound();
  const isMe = handle === ME;
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0);

  return (
    <>
      <section className="tcard" style={{ "--c1": p.colors[0], "--c2": p.colors[1] } as React.CSSProperties}>
        <div className="grid">
          <LiveAvatar handle={handle} size={112} />
          <div style={{ minWidth: 0 }}>
            <div className="kick">Trader card · {p.trades} trades</div>
            <h1>{p.name}{p.verified && <VerifiedCheck />}</h1>
            <div className="hd">@{p.handle}</div>
            <p className="bio">{p.bio}</p>
            <div className="facts">
              <span><WalletIcon small />{p.wallet}</span>
              {p.link && <a href={`https://${p.link}`} rel="noopener noreferrer" target="_blank"><LinkIcon small />{p.link}</a>}
              <span><CalendarIcon small />{p.joined.replace("Joined ", "Since ")}</span>
            </div>
          </div>
          <div className="big">
            <small>30-day PnL</small>
            <b>{p.stats.pnl30d}</b>
            <div className="acts">
              {isMe ? (
                <ToastButton className="btn solid" message="Editing your profile comes in a later step">Edit card</ToastButton>
              ) : (
                <>
                  <ToastButton className="btn icon" aria-label={`Alerts for ${p.name}`} message="Trade alerts come in a later step"><BellIcon small /></ToastButton>
                  <FollowButton />
                </>
              )}
            </div>
          </div>
        </div>
        <div className="ff">
          <span><b>{p.followers}</b> followers</span>
          <span><b>{p.following}</b> following</span>
          <span><b>{p.alerts}</b> tailing their trades</span>
          <LiveNow handle={handle} />
        </div>
      </section>

      <div className="kpis">
        <div className="kpi"><span>Win rate</span><b>{p.stats.winRate}</b></div>
        <div className="kpi"><span>Avg leverage</span><b>{p.stats.avgLev}</b></div>
        <div className="kpi"><span>Best trade</span><b className="up">{p.stats.best}</b></div>
        <div className="kpi"><span>Trades posted</span><b>{p.trades}</b></div>
      </div>

      <div className="duo">
        <div className="box">
          <h3>Track record <small>last 18 weeks</small></h3>
          <TrackRecord seed={seed} />
        </div>
        <div className="box pnlchart">
          <h3>PnL, read from the chain <Tabs variant="seg" options={["7D", "30D", "All"]} initial={1} label="Range" /></h3>
          <PnlChart seed={seed} />
        </div>
      </div>

      <div className="sec-h" style={{ flexWrap: "wrap" }}>
        <h2>Receipts</h2>
        <Tabs options={["All", "Wins", "Losses", "Open"]} label="Filter receipts" />
      </div>
      <div className="slips">
        <OpenTile handle={handle} />
        {TILES.slice(0, 8).map(([coin, side, result, kind, sub], i) => {
          const col = kind === "l" ? "var(--down)" : "var(--up)";
          return (
            <div className="mini-rc rc-wrap" key={i}>
              <div className="rc">
                <div className="hd"><span>No. {String(2000 + i * 37).padStart(6, "0")}</span><span>closed</span></div>
                <hr />
                <div className="mk"><span className={`coin ${coin}`}>{COIN_SYMBOL[coin]}</span><span className="sym" style={{ fontSize: 17 }}>{coin}</span><span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>{side.toUpperCase()}</span></div>
                <div className="pv" style={{ color: col }}>{result}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{sub} on margin</div>
                <CoinSpark coin={coin} offset={30 + i * 20} color={col} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
