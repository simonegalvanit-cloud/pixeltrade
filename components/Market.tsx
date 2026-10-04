"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { COINS, type Coin } from "@/lib/mock";
import { STEP, WS, fetchContexts, fetchMids, fetchSnapshot, upsertCandle, type Snapshot } from "@/lib/hyperliquid";

// Live market data for the whole app.
// 1. The server hands over a snapshot so the page shows real numbers right away.
// 2. In the browser we open Hyperliquid's websocket: "allMids" streams every price
//    change, "candle" streams the current 5-minute candle.
// 3. If the connection drops we reconnect, waiting a little longer each time
//    (1s, 2s, 4s... up to 15s), and reload the candles we missed.
// 4. Some networks block websockets. If it can't connect within a few seconds we
//    ask for prices over normal requests every 2 seconds until the websocket works.

export type Status = "connecting" | "live" | "reconnecting" | "offline";
type State = { snap: Snapshot | null; status: Status };

function createStore(initial: Snapshot | null) {
  let state: State = { snap: initial, status: "connecting" };
  const first = state;
  const listeners = new Set<() => void>();
  let work: Snapshot | null = initial ? structuredClone(initial) : null;
  let pending: ReturnType<typeof setTimeout> | undefined;

  // Publish at most 4 times a second, so a burst of ticks doesn't re-draw for each one.
  function publish(now = false) {
    const go = () => {
      pending = undefined;
      state = { snap: work ? structuredClone(work) : null, status: state.status };
      listeners.forEach((l) => l());
    };
    if (now) { clearTimeout(pending); go(); }
    else if (!pending) pending = setTimeout(go, 250);
  }
  function setStatus(s: Status) {
    if (state.status === s) return;
    state = { ...state, status: s };
    listeners.forEach((l) => l());
  }

  // Load fresh candles but keep the original anchor, so trade entries stay put.
  async function reload() {
    const fresh = await fetchSnapshot({ cache: "no-store" });
    work = work ? { anchorT: work.anchorT, markets: { ...work.markets, ...fresh.markets } } : fresh;
    publish(true);
  }

  let ws: WebSocket | undefined;
  let retry = 0;
  let stopped = false;
  let ping: ReturnType<typeof setInterval> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  function applyMids(mids: Record<string, string>) {
    if (!work) return;
    for (const c of COINS) {
      const m = work.markets[c];
      if (m && mids[c] !== undefined) m.px = +mids[c];
    }
    if (state.status !== "live") setStatus("live");
    publish();
  }

  // ---- backup: polling over normal requests ----
  let poll: ReturnType<typeof setInterval> | undefined;
  let lastReload = Date.now();
  async function pollOnce() {
    try {
      applyMids(await fetchMids({ cache: "no-store" }));
      if (!work) return;
      // Without the candle stream, keep the current candle up to date ourselves...
      const slot = Math.floor(Date.now() / STEP) * STEP;
      for (const c of COINS) {
        const m = work.markets[c];
        if (!m) continue;
        const last = m.t.length - 1;
        if (slot > m.t[last]) upsertCandle(m, slot, m.px, m.px, m.px, m.px);
        else upsertCandle(m, slot, m.o[last], Math.max(m.h[last], m.px), Math.min(m.l[last], m.px), m.px);
      }
      // ...and swap in the official candles every 5 minutes.
      if (Date.now() - lastReload > STEP) { lastReload = Date.now(); reload().catch(() => {}); }
    } catch {
      setStatus(work ? "reconnecting" : "offline");
    }
  }
  function startPolling() {
    if (poll || stopped) return;
    poll = setInterval(pollOnce, 2000);
    pollOnce();
  }
  function stopPolling() {
    clearInterval(poll);
    poll = undefined;
  }

  function onMessage(ev: MessageEvent) {
    const msg = JSON.parse(ev.data);
    if (!work) return;
    if (msg.channel === "allMids") {
      stopPolling(); // the websocket works, no need for the backup
      applyMids(msg.data.mids as Record<string, string>);
    } else if (msg.channel === "candle") {
      const k = msg.data as { t: number; s: string; i: string; o: string; h: string; l: string; c: string };
      const m = work.markets[k.s as Coin];
      if (!m || k.i !== "5m") return;
      upsertCandle(m, k.t, +k.o, +k.h, +k.l, +k.c);
      publish();
    }
  }

  function connect() {
    if (stopped) return;
    const sock = new WebSocket(WS);
    ws = sock;
    sock.onopen = () => {
      retry = 0;
      const send = (subscription: object) => ws?.send(JSON.stringify({ method: "subscribe", subscription }));
      send({ type: "allMids" });
      COINS.forEach((coin) => send({ type: "candle", coin, interval: "5m" }));
      clearInterval(ping);
      // Hyperliquid closes quiet connections, so say hello every 30 seconds.
      ping = setInterval(() => ws?.readyState === 1 && ws.send(JSON.stringify({ method: "ping" })), 30000);
      // Fill in any candles missed since the page was built or the connection dropped.
      reload().catch(() => {});
    };
    sock.onmessage = onMessage;
    sock.onclose = () => {
      if (stopped || sock !== ws) return;
      clearInterval(ping);
      startPolling();
      if (!poll) setStatus(work ? "reconnecting" : "offline");
      reconnectTimer = setTimeout(connect, Math.min(15000, 1000 * 2 ** retry++));
    };
    sock.onerror = () => sock.close();
  }

  return {
    get: () => state,
    getServer: () => first,
    subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
    start() {
      stopped = false;
      if (!work) reload().catch(() => setStatus("offline"));
      connect();
      // No live prices after 5 seconds? Switch on the backup.
      const backupTimer = setTimeout(() => { if (state.status !== "live") startPolling(); }, 5000);
      // 24h change and funding don't come through the websocket; refresh them every minute.
      const ctxTimer = setInterval(async () => {
        try {
          const ctx = await fetchContexts({ cache: "no-store" });
          if (!work) return;
          for (const c of COINS) {
            const m = work.markets[c], x = ctx[c];
            if (m && x) { m.prevDay = x.prevDay; m.funding = x.funding; }
          }
          publish();
        } catch {}
      }, 60000);
      return () => {
        stopped = true;
        clearInterval(ctxTimer); clearInterval(ping); clearTimeout(reconnectTimer); clearTimeout(pending);
        clearTimeout(backupTimer); stopPolling();
        const old = ws;
        ws = undefined;
        old?.close();
      };
    },
  };
}

type Store = ReturnType<typeof createStore>;
const MarketContext = createContext<Store | null>(null);

export function MarketProvider({ initial, children }: { initial: Snapshot | null; children: React.ReactNode }) {
  const [store] = useState(() => createStore(initial));
  useEffect(() => store.start(), [store]);
  return <MarketContext.Provider value={store}>{children}</MarketContext.Provider>;
}

// Any component can call useMarket() to get the latest prices and connection status.
export function useMarket(): State {
  const store = useContext(MarketContext);
  if (!store) throw new Error("useMarket must be used inside <MarketProvider>");
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}
