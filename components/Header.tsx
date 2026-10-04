"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ME } from "@/lib/mock";
import Avatar from "./Avatar";
import { BellIcon, HomeIcon, PlusIcon, SearchIcon, TradeBoxIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import { ToastButton, useToast } from "./Toast";

const SOON = "Coming in a later step";

// Top bar on every page: logo, sections, and actions.
export function Header() {
  const path = usePathname();
  const toast = useToast();
  const soon = (e: React.MouseEvent) => { e.preventDefault(); toast(SOON); };
  return (
    <header className="top">
      <div className="in">
        <Link className="brand" href="/">
          <span className="wm">perp<i>y</i></span>
          <small>show the receipts</small>
        </Link>
        <nav className="tnav" aria-label="Main">
          <Link className={path === "/" ? "on" : ""} href="/">The Pit</Link>
          <a href="#" onClick={soon}>Leaderboard</a>
          <a href="#" onClick={soon}>Alerts<span className="n">4</span></a>
          <a href="#" onClick={soon}>Trade</a>
        </nav>
        <div className="right">
          <ThemeToggle className="ibtn" compact />
          <ToastButton className="btn solid sm hide-m" message="Posting comes in a later step"><PlusIcon small />Post a receipt</ToastButton>
          <Link href={`/u/${ME}`} aria-label="Your profile"><Avatar handle={ME} size={34} ring="up" /></Link>
        </div>
      </div>
    </header>
  );
}

// Phones: a floating dock at the bottom instead of a menu.
export function Dock() {
  const path = usePathname();
  const toast = useToast();
  const soon = (e: React.MouseEvent) => { e.preventDefault(); toast(SOON); };
  return (
    <nav className="dock" aria-label="Tabs">
      <Link className={path === "/" ? "on" : ""} href="/" aria-label="The Pit"><HomeIcon /></Link>
      <a href="#" onClick={soon} aria-label="Leaderboard"><SearchIcon /></a>
      <ToastButton className="plus" aria-label="Post a receipt" message="Posting comes in a later step"><PlusIcon /></ToastButton>
      <a href="#" onClick={soon} aria-label="Alerts"><BellIcon /><span className="dot" /></a>
      <a href="#" onClick={soon} aria-label="Trade"><TradeBoxIcon /></a>
    </nav>
  );
}
