"use client";

import { CORE } from "@/lib/hyperliquid";
import { fmtPx, pct } from "@/lib/format";
import { dayChange } from "@/lib/positions";
import { useMarket } from "./Market";

const LABEL = { connecting: "Loading", live: "Live", reconnecting: "Reconnecting", offline: "Offline" };
const COINS = [...CORE, "SUI", "BNB", "AVAX", "LINK", "ENA", "kPEPE", "FARTCOIN", "TRUMP"];

// Scrolling ticker at the very top: live prices with 24h change.
// Printed twice so the loop is seamless.
export default function Tape() {
  const { snap, status } = useMarket();
  const items = COINS.filter((c) => snap?.mids[c]).map((c) => {
    const ch = dayChange(c, snap);
    return { label: c, value: `${fmtPx(snap!.mids[c])} ${pct(ch, 2)}`, dir: ch >= 0 ? "up" : "down" };
  });
  const all = [...items, ...items];
  return (
    <div className="tape" aria-label="Live prices">
      <span className={`status${status === "live" ? "" : status === "offline" ? " off" : " wait"}`} role="status">
        <i />{LABEL[status]}{status === "live" && " · HL"}
      </span>
      <div className="track">
        {all.map((t, i) => (
          <span className="it" key={i} aria-hidden={i >= items.length}>
            <b>{t.label}</b><span className={t.dir === "up" ? "u" : "d"}>{t.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
