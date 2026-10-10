"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { money } from "@/lib/format";
import { MIN_DEPOSIT } from "@/lib/arbitrum";
import { signIn, useSession } from "./Session";
import { useToast } from "./Toast";

type Bal = { usdc: number | null; eth: number | null; hl: { accountValue: number; withdrawable: number } | null };

// Your perpy wallet: address and balances.
export default function WalletPanel() {
  const { ready, authenticated, member } = useSession();
  const toast = useToast();
  const [bal, setBal] = useState<Bal | null>(null);

  const [dep, setDep] = useState<{ hash: string; amount: string } | null>(null);
  useEffect(() => {
    const on = (e: Event) => { setDep((e as CustomEvent).detail); setTimeout(() => load(), 30000); };
    window.addEventListener("perpy:deposit", on);
    return () => window.removeEventListener("perpy:deposit", on);
  });

  const load = useCallback(async () => {
    if (!member) return;
    try { setBal(await (await fetch(`/api/wallet?address=${member.wallet}`, { cache: "no-store" })).json()); } catch {}
  }, [member]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  if (!ready) return null;
  if (!authenticated || !member) {
    return <div className="welcome"><p>Sign up to get your perpy wallet.</p><button type="button" className="btn go" onClick={() => signIn()}>Sign up / Log in</button></div>;
  }

  return (
    <div className="walletpg">
      <div className="box">
        <h3>1 · Your wallet address <small>ARBITRUM</small></h3>
        <div className="addr">
          <code>{member.wallet}</code>
          <button type="button" className="btn sm" onClick={() => { navigator.clipboard.writeText(member.wallet); toast("Address copied"); }}>Copy</button>
        </div>
        <p className="muted">Send <b>USDC on the Arbitrum network</b> here, plus a little <b>ETH on Arbitrum</b> (about $1 worth) for network fees. From an exchange like Coinbase or Binance: choose Withdraw → USDC → network <b>Arbitrum One</b> → paste this address.</p>
        <p className="warn">Only USDC and ETH on <b>Arbitrum</b>. Other coins or other networks sent here can be lost.</p>
      </div>

      <div className="box">
        <h3>2 · Balances <small>REFRESHES EVERY 15S</small></h3>
        <div className="bals">
          <div><span>USDC in wallet</span><b>{bal?.usdc == null ? "…" : money(bal.usdc)}</b></div>
          <div><span>ETH for fees</span><b>{bal?.eth == null ? "…" : bal.eth.toFixed(5)}</b></div>
          <div><span>Trading account</span><b className="up">{bal?.hl ? money(bal.hl.accountValue) : "…"}</b></div>
        </div>
      </div>

      <div className="box">
        <h3>3 · Auto-deposit <small className="up">ON</small></h3>
        <p>When your wallet holds <b>{MIN_DEPOSIT} USDC or more</b>, perpy moves it into your trading account automatically while you&apos;re on the site. No buttons, no popups.</p>
        {bal && (bal.usdc ?? 0) > 0 && (bal.usdc ?? 0) < MIN_DEPOSIT && <p className="warn">You have {money(bal.usdc ?? 0)} USDC. Top up to at least {MIN_DEPOSIT} USDC: smaller amounts can&apos;t be moved (Hyperliquid would lose them).</p>}
        {bal && (bal.usdc ?? 0) >= MIN_DEPOSIT && (bal.eth ?? 0) < 0.00001 && <p className="warn">Waiting for a little ETH on Arbitrum (about $1) to pay the network fee. Send it to the address above and your USDC moves automatically.</p>}
        {dep && <p className="muted mono" style={{ fontSize: 12 }}>Moving {dep.amount} USDC… <a className="cyan" href={`https://arbiscan.io/tx/${dep.hash}`} target="_blank" rel="noopener noreferrer">view on Arbiscan ↗</a>. Your trading account updates in about a minute.</p>}
      </div>

      <p className="muted" style={{ fontSize: 13 }}>Next: trading right inside perpy (coming in the next update). Until then, <Link className="cyan" href="/learn">see how a trade works</Link>.</p>
    </div>
  );
}
