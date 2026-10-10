"use client";

import { useState, useSyncExternalStore } from "react";
import type { Post } from "@/lib/db";
import type { MarketData } from "@/lib/hyperliquid";
import type { ClosedTrade, Player, Position } from "@/lib/trading";
import PostSlip from "./PostSlip";
import Slip from "./Slip";
import { useSession } from "./Session";
import { tailingList, useTailingLoader } from "./Social";

export type FeedItem =
  | { kind: "post"; post: Post; player: Player; pos: Position | null }
  | { kind: "open"; player: Player; pos: Position }
  | { kind: "closed"; player: Player; trade: ClosedTrade };

const TABS = ["All", "Tailing", "Calls", "Live", "Finished"] as const;

// The feed on the home page, with filters.
export default function Feed({ items, markets }: { items: FeedItem[]; markets: Record<string, MarketData> }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const { address } = useSession();
  useTailingLoader();
  const tailing = useSyncExternalStore(tailingList.subscribe, tailingList.get, () => tailingList.empty);
  const shown = items.filter((it) => {
    if (tab === "Calls") return it.kind === "post";
    if (tab === "Live") return it.kind === "open" || (it.kind === "post" && it.pos);
    if (tab === "Finished") return it.kind === "closed";
    if (tab === "Tailing") return tailing.has(it.player.address) || it.player.address === address;
    return true;
  });
  return (
    <>
      <div className="sec-h">
        <h2>MATCHES</h2>
        <div className="chips" role="group" aria-label="Filter">
          {TABS.map((t) => <button key={t} type="button" className={t === tab ? "on" : ""} aria-pressed={t === tab} onClick={() => setTab(t)}>{t}</button>)}
        </div>
      </div>
      {tab === "Tailing" && !shown.length && (
        <p className="muted mono" style={{ margin: "0 0 18px" }}>{address ? "Nobody you tail is on this page right now. Tail players from their cards or the hi-scores." : "Sign in and tail players to build your own feed."}</p>
      )}
      <div className="board">
        {shown.map((it) =>
          it.kind === "post" ? (
            <PostSlip key={`p-${it.post.id}`} post={it.post} player={it.player} pos={it.pos} market={it.post.coin ? markets[it.post.coin] : null} />
          ) : (
            <Slip key={it.kind === "open" ? `o-${it.player.address}-${it.pos.coin}` : `c-${it.trade.id}`} item={it} market={it.kind === "open" ? markets[it.pos.coin] : undefined} />
          ),
        )}
      </div>
    </>
  );
}
