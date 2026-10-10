"use client";

import { useEffect } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { encodeFunctionData, parseAbi } from "viem";
import { ARB_CHAIN_ID, HL_BRIDGE, MIN_DEPOSIT, MIN_GAS_WEI, USDC } from "@/lib/arbitrum";
import { useSession } from "./Session";
import { useToast } from "./Toast";

const MIN_RAW = BigInt(MIN_DEPOSIT) * BigInt(1_000_000); // 5 USDC (6 decimals)
const COOLDOWN = 3 * 60 * 1000; // never send twice within 3 minutes

// Automatic deposits. While you're on perpy, every 20 seconds we check your
// wallet: if it holds at least 5 USDC and a little ETH for the fee, all that
// USDC is moved into your Hyperliquid trading account, from your own wallet,
// without a popup. (Under 5 USDC is never sent: Hyperliquid would lose it.)
export default function AutoDeposit() {
  const { member } = useSession();
  const { sendTransaction } = useSendTransaction();
  const toast = useToast();

  useEffect(() => {
    if (!member) return;
    const key = `perpy:autodeposit:${member.wallet}`;
    let running = false;

    const tick = async () => {
      if (running || document.hidden) return;
      try { if (Date.now() - Number(localStorage.getItem(key) ?? 0) < COOLDOWN) return; } catch {}
      running = true;
      try {
        const b = await (await fetch(`/api/wallet?address=${member.wallet}`, { cache: "no-store" })).json();
        const usdc = BigInt(b.usdcRaw ?? "0");
        const eth = BigInt(b.ethRaw ?? "0");
        if (usdc < MIN_RAW || eth < MIN_GAS_WEI) return;
        // Remember the attempt first, so another tab (or a retry) can't double-send.
        try { localStorage.setItem(key, String(Date.now())); } catch {}
        const data = encodeFunctionData({
          abi: parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]),
          functionName: "transfer",
          args: [HL_BRIDGE, usdc],
        });
        const r = await sendTransaction(
          { to: USDC, data, chainId: ARB_CHAIN_ID },
          { address: member.wallet, uiOptions: { showWalletUIs: false } },
        );
        const amount = (Number(usdc) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 });
        toast(`Moving ${amount} USDC into your trading account`);
        window.dispatchEvent(new CustomEvent("perpy:deposit", { detail: { hash: r.hash, amount } }));
      } catch (e) {
        console.warn("auto-deposit failed", e);
      } finally {
        running = false;
      }
    };

    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, [member, sendTransaction, toast]);

  return null;
}
