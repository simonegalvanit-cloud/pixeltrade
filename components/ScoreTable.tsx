"use client";

import Link from "next/link";
import { useState } from "react";
import { moneyShort, pct, usdBig } from "@/lib/format";
import { levelOf, type Player, type Win } from "@/lib/trading";
import Avatar from "./Avatar";
import { VerifiedCheck } from "./Icons";
import { useWallet } from "./Wallet";

const TABS: [Win, string][] = [["day", "24H"], ["week", "7D"], ["month", "30D"], ["allTime", "ALL"]];

// The real Hyperliquid leaderboard, arcade style.
export default function ScoreTable({ boards }: { boards: Record<Win, Player[]> }) {
  const [w, setW] = useState<Win>("month");
  const { address } = useWallet();
  return (
    <>
      <div className="seg" role="group" aria-label="Time window" style={{ justifyContent: "center", marginBottom: 16 }}>
        {TABS.map(([k, label]) => <button key={k} type="button" className={k === w ? "on" : ""} aria-pressed={k === w} onClick={() => setW(k)}>{label}</button>)}
      </div>
      <div className="board-hs">
        <div className="hsr head"><span>Rank</span><span /><span>Player</span><span className="hide-s" style={{ textAlign: "right" }}>ROI</span><span style={{ textAlign: "right" }}>Score</span><span className="hide-s" style={{ textAlign: "right" }}>Account</span></div>
        {boards[w].map((p, i) => (
          <Link key={p.address} href={`/u/${p.address}`} className={`hsr${p.address === address ? " me" : ""}`}>
            <span className="rk">{String(i + 1).padStart(2, "0")}</span>
            <Avatar seed={p.address} size={40} label={p.name} />
            <span className="nm">
              <b>{p.name}{p.named && <VerifiedCheck />}{p.address === address && <span className="tag lv">P1</span>}</b>
              <small><span className="tag lv">LV.{levelOf(p)}</span><span className="mono muted" style={{ fontSize: 11 }}>{moneyShort(p.perf[w].vlm)} traded</span></small>
            </span>
            <span className="wr hide-s">{pct(p.perf[w].roi * 100)}</span>
            <span className="sc">{usdBig(p.perf[w].pnl)}</span>
            <span className="wr hide-s muted">{moneyShort(p.accountValue)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
