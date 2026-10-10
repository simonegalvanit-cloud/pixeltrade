"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usdBig } from "@/lib/format";
import { livePos } from "@/lib/positions";
import Avatar from "./Avatar";
import { useMarket } from "./Market";
import { authFetch, signIn, useSession } from "./Session";
import { useBook } from "./Side";
import { useToast } from "./Toast";

// Write a post ("call your shot") and attach one of your real open positions.
export default function Composer() {
  const { address, enabled, ready, member, authenticated } = useSession();
  const book = useBook(address);
  const { snap } = useMarket();
  const toast = useToast();
  const router = useRouter();
  const [text, setText] = useState("");
  const [coin, setCoin] = useState<string>("");
  const [busy, setBusy] = useState(false);

  if (!ready || !enabled) return null;
  if (authenticated && !member) return null;

  if (!address) {
    return (
      <div className="compose">
        <span className="muted" style={{ flex: 1 }}>Join perpy to post your calls, GG, chat and trade with friends.</span>
        <button type="button" className="btn go sm" onClick={() => signIn()}>Sign up / Log in</button>
      </div>
    );
  }

  async function post() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const r = await authFetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, coin: coin || null }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Couldn't post.");
      setText(""); setCoin("");
      toast("Posted to the Pit");
      router.refresh();
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="compose col">
      <div style={{ display: "flex", gap: 12, width: "100%" }}>
        <Avatar seed={address} size={34} label="you" />
        <textarea value={text} maxLength={500} rows={2} onChange={(e) => setText(e.target.value)} placeholder="Call your shot. What's the trade and why?" aria-label="Write a post" />
      </div>
      <div className="crow">
        <select value={coin} onChange={(e) => setCoin(e.target.value)} aria-label="Attach a position">
          <option value="">No position attached</option>
          {book?.positions.map((p) => {
            const l = livePos(p, snap);
            return <option key={p.coin} value={p.coin}>{p.coin} {p.szi > 0 ? "long" : "short"} ×{p.lev} · {usdBig(l.pnl)}</option>;
          })}
        </select>
        {book && book.positions.length === 0 && <small className="muted mono">no open positions to attach</small>}
        <span className="mono muted" style={{ marginLeft: "auto", fontSize: 11 }}>{text.length}/500</span>
        <button type="button" className="btn go sm" disabled={busy || !text.trim()} onClick={post}>{busy ? "…" : "Post"}</button>
      </div>
    </div>
  );
}
