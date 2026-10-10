"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";
import { ARB_CHAIN_ID, HL_BRIDGE, MIN_DEPOSIT, USDC } from "@/lib/arbitrum";
import { money } from "@/lib/format";
import { signIn, useSession } from "./Session";
import { useToast } from "./Toast";

type Bal = { usdc: number | null; eth: number | null; hl: { accountValue: number; withdrawable: number } | null };

// Your perpy wallet: address, balances, and moving USDC into Hyperliquid to trade.
export default function WalletPanel() {
  const { ready, authenticated, member } = useSession();
  const toast = useToast();
  const { sendTransaction } = useSendTransaction();
  const [bal, setBal] = useState<Bal | null>(null);
  const [amount, setAmount] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!member) return;
    try { setBal(await (await fetch(`/api/wallet?address=${member.wallet}`, { cache: "no-store" })).json()); } catch {}
  }, [member]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  if (!ready) return null;
  if (!authenticated || !member) {
    return <div className="welcome"><p>Sign up to get your perpy wallet.</p><button type="button" className="btn go" onClick={() => signIn()}>Sign up / Log in</button></div>;
  }

  const n = Number(amount);
  const usdc = bal?.usdc ?? 0;
  const problem =
    !amount ? "" :
    !(n > 0) ? "Enter an amount." :
    n < MIN_DEPOSIT ? `Minimum is ${MIN_DEPOSIT} USDC. Smaller deposits are lost forever.` :
    n > usdc ? "That's more USDC than your wallet has on Arbitrum." :
    (bal?.eth ?? 0) <= 0 ? "You need a tiny bit of ETH on Arbitrum to pay the network fee (about $0.01)." : "";

  async function deposit() {
    if (problem || !ok || busy) return;
    setBusy(true);
    try {
      const data = encodeFunctionData({ abi: parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]), functionName: "transfer", args: [HL_BRIDGE, parseUnits(String(n), 6)] });
      const r = await sendTransaction({ to: USDC, data, chainId: ARB_CHAIN_ID }, { uiOptions: { description: `Deposit ${n} USDC into your Hyperliquid trading account.` } });
      setTx(r.hash);
      setAmount(""); setOk(false);
      toast("Deposit sent. It arrives in about a minute.");
      setTimeout(load, 20000); setTimeout(load, 60000);
    } catch (e) { toast((e as Error).message.slice(0, 70)); } finally { setBusy(false); }
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
        <h3>3 · Move USDC into your trading account <small>HYPERLIQUID</small></h3>
        <div className="dep">
          <div className="fld">
            <span>Amount (USDC)</span>
            <div className="at"><b>$</b><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={`${MIN_DEPOSIT} or more`} /></div>
          </div>
          <button type="button" className="btn sm" onClick={() => setAmount(String(Math.floor(usdc * 100) / 100))} disabled={usdc < MIN_DEPOSIT}>Max</button>
        </div>
        {problem && <p className="warn">{problem}</p>}
        <label className="chk"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I understand this moves real money into Hyperliquid, where I can trade with leverage and lose it.</label>
        <button type="button" className="btn go" disabled={!!problem || !amount || !ok || busy} onClick={deposit}>{busy ? "Confirm in the popup…" : "Deposit to Hyperliquid"}</button>
        {tx && <p className="muted mono" style={{ fontSize: 12 }}>Sent: <a className="cyan" href={`https://arbiscan.io/tx/${tx}`} target="_blank" rel="noopener noreferrer">view on Arbiscan ↗</a>. Your trading account updates in about a minute.</p>}
      </div>

      <p className="muted" style={{ fontSize: 13 }}>Next: trading right inside perpy (coming in the next update). Until then, <Link className="cyan" href="/learn">see how a trade works</Link>.</p>
    </div>
  );
}
