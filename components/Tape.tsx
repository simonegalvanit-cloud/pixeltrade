"use client";

import { COINS, PIT_ORDER, POSITIONS } from "@/lib/mock";
import { fmtPx, pct, usd } from "@/lib/format";
import { dayChange, livePosition } from "@/lib/positions";
import { useMarket } from "./Market";

const LABEL = { connecting: "Connecting", live: "Live", reconnecting: "Reconnecting", offline: "Offline" };

// Scrolling ticker at the very top: live prices with 24h change, mixed with
// what traders are up or down right now. Printed twice so the loop is seamless.
export default function Tape() {
  const { snap, status } = useMarket();
  const items: { label: string; value: string; dir?: "up" | "down" }[] = [];
  COINS.forEach((coin, i) => {
    const m = snap?.markets[coin];
    if (m) {
      const ch = dayChange(m);
      items.push({ label: coin, value: `${fmtPx(m.px)} ${pct(ch, 2)}`, dir: ch >= 0 ? "up" : "down" });
    }
    const key = PIT_ORDER[i];
    const p = livePosition(key, snap);
    if (p) {
      const d = POSITIONS[key];
      items.push({ label: `@${d.handle}`, value: `${usd(p.pnl)} on ${d.coin} ${d.side > 0 ? "long" : "short"}`, dir: p.pnl >= 0 ? "up" : "down" });
    }
  });
  const all = [...items, ...items];
  return (
    <div className="tape" aria-label="Live market and trader ticker">
      <span className={`status${status === "live" ? "" : status === "offline" ? " off" : " wait"}`} role="status">
        <i />{LABEL[status]}{status === "live" && " · Hyperliquid"}
      </span>
      <div className="track">
        {all.map((t, i) => (
          <span className="it" key={i} aria-hidden={i >= items.length}>
            <b>{t.label}</b><span className={t.dir === "up" ? "u" : t.dir === "down" ? "d" : ""}>{t.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
