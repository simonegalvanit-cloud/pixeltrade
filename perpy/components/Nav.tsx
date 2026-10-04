"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ME, PEOPLE } from "@/lib/mock";
import Avatar from "./Avatar";
import { BellIcon, HomeIcon, LogoMark, NewPostIcon, PlusIcon, ProfileIcon, SearchIcon, TradeBoxIcon, TradeIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import { ToastButton, useToast } from "./Toast";

const SOON = "Coming in a later step";

function useActive() {
  const path = usePathname();
  return {
    home: path === "/",
    profile: path === `/u/${ME}`,
  };
}

// Desktop: the X-style column on the left.
export function LeftNav() {
  const on = useActive();
  const toast = useToast();
  const me = PEOPLE[ME];
  const soon = (e: React.MouseEvent) => { e.preventDefault(); toast(SOON); };
  return (
    <aside className="lnav" aria-label="Main">
      <Link className="wordmark" href="/"><LogoMark /><span className="wm">perpy</span></Link>
      <Link className={`nav${on.home ? " on" : ""}`} href="/"><HomeIcon /><span className="lbl">Home</span></Link>
      <a className="nav" href="#" onClick={soon}><SearchIcon /><span className="lbl">Explore</span></a>
      <a className="nav" href="#" onClick={soon}><BellIcon /><span className="badge">4</span><span className="lbl">Notifications</span></a>
      <a className="nav" href="#" onClick={soon}><TradeIcon /><span className="lbl">Trade</span></a>
      <Link className={`nav${on.profile ? " on" : ""}`} href={`/u/${ME}`}><ProfileIcon /><span className="lbl">Profile</span></Link>
      <ToastButton className="btn brand lg post-btn" message="Composer opens here"><span className="lbl">Post</span><PlusIcon className="plus" /></ToastButton>
      <div className="theme-btn"><ThemeToggle /></div>
      <Link className="me" href={`/u/${ME}`}>
        <Avatar handle={ME} size={40} ring="up" />
        <span className="who"><b>{me.name}</b><span className="muted">@{me.handle}</span></span>
      </Link>
    </aside>
  );
}

// Mobile: the Instagram-style bar at the top.
export function MobileBar() {
  return (
    <header className="mbar">
      <Link className="wordmark" href="/"><LogoMark />perpy</Link>
      <div className="acts">
        <ThemeToggle className="ibtn" compact />
        <ToastButton className="ibtn" aria-label="Notifications" message={SOON}><BellIcon /></ToastButton>
        <ToastButton className="ibtn" aria-label="New post" message="Composer opens here"><NewPostIcon /></ToastButton>
      </div>
    </header>
  );
}

// Mobile: the tabs at the bottom of the screen.
export function MobileTabs() {
  const on = useActive();
  const toast = useToast();
  const soon = (e: React.MouseEvent) => { e.preventDefault(); toast(SOON); };
  return (
    <nav className="mtabs" aria-label="Tabs">
      <Link className={on.home ? "on" : ""} href="/" aria-label="Home"><HomeIcon /></Link>
      <a href="#" onClick={soon} aria-label="Explore"><SearchIcon /></a>
      <a href="#" onClick={soon} aria-label="Trade"><TradeBoxIcon /></a>
      <a href="#" onClick={soon} aria-label="Notifications"><BellIcon /><span className="dot" /></a>
      <Link className={on.profile ? "on" : ""} href={`/u/${ME}`} aria-label="Profile"><Avatar handle={ME} size={26} /></Link>
    </nav>
  );
}
