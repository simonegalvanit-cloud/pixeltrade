"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, HomeIcon, PlusIcon, SearchIcon, TradeBoxIcon } from "./Icons";
import { ToastButton, useToast } from "./Toast";
import { AccountBadge } from "./Account";
import { MemberSearch } from "./Search";
import { useSession } from "./Session";

// A pixel coin, used in the logo.
export const CoinIcon = ({ className = "coinx" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M2 0h4v1h1v1h1v4H7v1H6v1H2V7H1V6H0V2h1V1h1z" fill="#FFE14D" />
    <path d="M3 2h2v1H3zM3 5h2v1H3zM2 3h1v2H2z" fill="#B8860B" />
  </svg>
);

// Top bar on every page: logo, sections, wallet search, and P1 (your wallet).
export function Header() {
  const path = usePathname();
  return (
    <header className="top">
      <div className="in">
        <Link className="logo" href="/"><CoinIcon /><span className="wm">PERPY</span></Link>
        <nav className="tnav" aria-label="Main">
          <Link className={path === "/" ? "on" : ""} href="/">The Pit</Link>
          <Link className={path === "/scores" ? "on" : ""} href="/scores">Hi-scores</Link>
          <Link className={path === "/learn" ? "on" : ""} href="/learn">How to play</Link>
        </nav>
        <div className="right">
          <span className="hide-m"><MemberSearch /></span>
          <AccountBadge />
        </div>
      </div>
    </header>
  );
}

// Phones: a floating dock at the bottom instead of a menu.
export function Dock() {
  const path = usePathname();
  const toast = useToast();
  const { member } = useSession();
  return (
    <nav className="dock" aria-label="Tabs">
      <Link className={path === "/" ? "on" : ""} href="/" aria-label="The Pit"><HomeIcon /></Link>
      <Link className={path === "/scores" ? "on" : ""} href="/scores" aria-label="Hi-scores and wallet search"><SearchIcon /></Link>
      <Link className="plus" href={member ? "/wallet" : "/welcome"} aria-label={member ? "Deposit" : "Sign up"}><PlusIcon /></Link>
      <a href="#" onClick={(e) => { e.preventDefault(); toast("Alerts need an account, coming next"); }} aria-label="Alerts"><BellIcon /></a>
      <Link className={path === "/learn" ? "on" : ""} href={member ? `/u/${member.handle}` : "/learn"} aria-label={member ? "Your player card" : "How to play"}><TradeBoxIcon /></Link>
    </nav>
  );
}
