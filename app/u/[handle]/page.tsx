import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { FollowButton, Tabs } from "@/components/Buttons";
import { BackIcon, BellIcon, CalendarIcon, LinkIcon, MoreIcon, VerifiedCheck, WalletIcon } from "@/components/Icons";
import { ToastButton } from "@/components/Toast";
import { ME, PEOPLE, STORIES, TILES } from "@/lib/mock";
import { rng, toPath, walk } from "@/lib/chart";

// Build one page per trader when the site is built.
export function generateStaticParams() {
  return Object.keys(PEOPLE).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const p = PEOPLE[decodeURIComponent((await params).handle)];
  return { title: p ? `${p.name} (@${p.handle}) · perpy` : "perpy" };
}

function Banner() {
  const pts = walk(9, 40, 40, 140, 60);
  const d = toPath(pts, 600, 200, 40, 20);
  return (
    <div className="banner">
      <svg viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
        <path d={`${d}L600,200L0,200Z`} fill="rgba(255,255,255,.10)" />
        <path d={d} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function PnlChart() {
  // A made-up equity curve that trends up.
  const r = rng(42);
  let v = 0;
  const pts = [0];
  for (let i = 0; i < 60; i++) { v += (r() - 0.36) * 1800; pts.push(v); }
  const W = 600, H = 150;
  const mn = Math.min(...pts), mx = Math.max(...pts), pad = (mx - mn) * 0.14;
  const y = (x: number) => H - ((x - (mn - pad)) / (mx + pad - (mn - pad))) * H;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * W).toFixed(1)},${y(p).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pnl-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E9F5C" stopOpacity=".22" />
          <stop offset="1" stopColor="#0E9F5C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${W},${H}L0,${H}Z`} fill="url(#pnl-g)" />
      <path d={d} fill="none" stroke="var(--up)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={W - 3} cy={y(pts[pts.length - 1])} r="4" fill="var(--up)" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const handle = decodeURIComponent((await params).handle);
  const p = PEOPLE[handle];
  if (!p) notFound();
  const story = STORIES.find((s) => s.handle === handle);
  const isMe = handle === ME;

  return (
    <section>
      <div className="hdr">
        <div className="hdr-t">
          <Link className="ibtn" href="/" aria-label="Back"><BackIcon /></Link>
          <div>{p.name}<small>{p.trades} trades</small></div>
        </div>
      </div>

      <Banner />

      <div className="phead">
        <div className="top">
          <Avatar handle={handle} size={132} ring={story?.ring} live={story?.pnl} />
          <div className="btns">
            <ToastButton className="btn icon" aria-label="More" message="Share profile, Mute, Report"><MoreIcon small /></ToastButton>
            {isMe ? (
              <ToastButton className="btn" message="Editing your profile comes in a later step">Edit profile</ToastButton>
            ) : (
              <>
                <ToastButton className="btn icon" aria-label={`Alerts for ${p.name}`} message="Trade alerts come in a later step"><BellIcon small /></ToastButton>
                <FollowButton />
              </>
            )}
          </div>
        </div>
        <h1>{p.name} {p.verified && <VerifiedCheck />}</h1>
        <div className="hd">@{p.handle}</div>
        <div className="bio">{p.bio}</div>
        <div className="facts">
          <span><WalletIcon small />{p.wallet}</span>
          {p.link && <span><LinkIcon small /><a className="cash" href={`https://${p.link}`} rel="noopener noreferrer" target="_blank">{p.link}</a></span>}
          <span><CalendarIcon small />{p.joined}</span>
        </div>
        <div className="ff">
          <span><b>{p.following}</b> Following</span>
          <span><b>{p.followers}</b> Followers</span>
          <span><b>{p.alerts}</b> get alerts</span>
        </div>
      </div>

      <div className="pstats">
        <div><span>30d PnL</span><b className="up">{p.stats.pnl30d}</b></div>
        <div><span>Win rate</span><b>{p.stats.winRate}</b></div>
        <div><span>Avg leverage</span><b>{p.stats.avgLev}</b></div>
        <div><span>Best trade</span><b className="up">{p.stats.best}</b></div>
      </div>

      <div className="pnl">
        <div className="ph">
          <span className="muted" style={{ fontSize: 13.5 }}>PnL, read from the chain</span>
          <Tabs variant="seg" options={["7D", "30D", "All"]} initial={1} label="Range" />
        </div>
        <PnlChart />
      </div>

      <div className="hdr" style={{ position: "static", backdropFilter: "none" }}>
        <Tabs options={["Trades", "Posts", "Open (2)", "Likes"]} label="Profile sections" />
      </div>

      <div className="grid3">
        {TILES.map(([coin, side, result, kind, sub], i) => {
          const pts = walk(i * 7 + 3, 24, 0, kind === "l" ? -5 : 5, 4);
          return (
            <Link className={`tile ${kind}`} href="/post/1" key={i}>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                <path d={toPath(pts, 100, 40)} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="tt">{coin}<span>{side}</span></div>
              <div>
                <div className="pv">{kind === "o" ? sub : result}</div>
                <small>{kind === "o" ? "open now" : `${sub} on margin`}</small>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
