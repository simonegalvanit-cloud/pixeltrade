"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ME, PEOPLE, levelOf, positionKeyFor } from "@/lib/mock";
import { usdShort } from "@/lib/format";
import { livePosition } from "@/lib/positions";
import Avatar from "./Avatar";
import { BellIcon, HomeIcon, PlusIcon, SearchIcon, TradeBoxIcon } from "./Icons";
import { useMarket } from "./Market";
import { ToastButton, useToast } from "./Toast";

const SOON = "Coming in a later level";

// A pixel coin, used in the logo.
export const CoinIcon = ({ className = "coinx" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M2 0h4v1h1v1h1v4H7v1H6v1H2V7H1V6H0V2h1V1h1z" fill="#FFE14D" />
    <path d="M3 2h2v1H3zM3 5h2v1H3zM2 3h1v2H2z" fill="#B8860B" />
  </svg>
);

// Top bar on every page: logo, sections, and your player badge.
export function Header() {
  const path = usePathname();
  const toast = useToast();
  const { snap } = useMarket();
  const me = PEOPLE[ME];
  const key = positionKeyFor(ME);
  const p = key ? livePosition(key, snap) : null;
  return (
    <header className="top">
      <div className="in">
        <Link className="logo" href="/"><CoinIcon /><span className="wm">PERPY</span></Link>
        <nav className="tnav" aria-label="Main">
          <Link className={path === "/" ? "on" : ""} href="/">The Pit</Link>
          <Link className={path === "/scores" ? "on" : ""} href="/scores">Hi-scores</Link>
          <Link className={path === "/learn" ? "on" : ""} href="/learn">How to play</Link>
          <a href="#" onClick={(e) => { e.preventDefault(); toast(SOON); }}>Alerts<span className="n">4</span></a>
        </nav>
        <div className="right">
          <ToastButton className="btn go sm hide-m" message="Posting comes in a later level"><PlusIcon small />Post trade</ToastButton>
          <Link className="p1" href={`/u/${ME}`} aria-label="Your profile">
            <Avatar handle={ME} size={34} ring={p ? (p.pnl >= 0 ? "up" : "down") : undefined} />
            <span className="t">
              <small>P1 · LV.{levelOf(me)}</small>
              <b>{me.name.split(" ")[0]}</b>
            </span>
            {p && <b className={`mono ${p.pnl >= 0 ? "up" : "down"}`} style={{ fontSize: 12 }}>{usdShort(p.pnl)}</b>}
          </Link>
        </div>
      </div>
    </header>
  );
}

// Phones: a floating dock at the bottom instead of a menu.
export function Dock() {
  const path = usePathname();
  const toast = useToast();
  return (
    <nav className="dock" aria-label="Tabs">
      <Link className={path === "/" ? "on" : ""} href="/" aria-label="The Pit"><HomeIcon /></Link>
      <Link className={path === "/scores" ? "on" : ""} href="/scores" aria-label="Hi-scores"><SearchIcon /></Link>
      <ToastButton className="plus" aria-label="Post a trade" message="Posting comes in a later level"><PlusIcon /></ToastButton>
      <a href="#" onClick={(e) => { e.preventDefault(); toast(SOON); }} aria-label="Alerts"><BellIcon /><span className="dot" /></a>
      <Link className={path === "/learn" ? "on" : ""} href="/learn" aria-label="How to play"><TradeBoxIcon /></Link>
    </nav>
  );
}
