"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { money } from "@/lib/format";
import { signIn, useSession } from "./Session";
import { useToast } from "./Toast";

type Bal = { usdc: number | null; eth: number | null; hl: { accountValue: number; withdrawable: number } | null };

// Your perpy wallet: address and balances.
export default function WalletPanel() {
  const { ready, authenticated, member } = useSession();
  const toast = useToast();
  const [bal, setBal] = useState<Bal | null>(null);

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

      <p className="muted" style={{ fontSize: 13 }}>Next: trading right inside perpy (coming in the next update). Until then, <Link className="cyan" href="/learn">see how a trade works</Link>.</p>
    </div>
  );
}
