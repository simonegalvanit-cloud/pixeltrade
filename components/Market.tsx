"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { CORE, STEP, WS, fetchCandles, fetchContexts, fetchMids, fetchSnapshot, upsertCandle, type MarketData, type Snapshot } from "@/lib/hyperliquid";

// Live market data for the whole app.
// 1. The server hands over a snapshot so the page shows real numbers right away.
// 2. In the browser we open Hyperliquid's websocket: "allMids" streams every
//    price, "candle" streams the current 5-minute candle of coins on screen.
// 3. If the connection drops we reconnect, waiting a little longer each time
//    (1s, 2s, 4s... up to 15s), and reload what we missed.
// 4. Some networks block websockets. If it can't connect within a few seconds we
//    ask for prices over normal requests every 2 seconds until the websocket works.
// 5. Cards call useCoin("PEPE") and the candles for that coin get loaded.

export type Status = "connecting" | "live" | "reconnecting" | "offline";
type State = { snap: Snapshot | null; status: Status };

function createStore(initial: Snapshot | null) {
  let state: State = { snap: initial, status: "connecting" };
  const first = state;
  const listeners = new Set<() => void>();
  let work: Snapshot | null = initial ? structuredClone(initial) : null;
  let pending: ReturnType<typeof setTimeout> | undefined;
  const wanted = new Set<string>(initial ? Object.keys(initial.markets) : CORE);
  const loading = new Set<string>();

  // Publish at most 4 times a second, so a burst of ticks doesn't re-draw for each one.
  function publish(now = false) {
    const go = () => {
      pending = undefined;
      state = { snap: work ? { ...work, mids: { ...work.mids }, markets: { ...work.markets } } : null, status: state.status };
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
  function copy(m: MarketData): MarketData {
    return { px: m.px, t: [...m.t], o: [...m.o], h: [...m.h], l: [...m.l], c: [...m.c] };
  }

  async function reload() {
    const fresh = await fetchSnapshot([...wanted], { cache: "no-store" });
    work = { mids: fresh.mids, ctx: fresh.ctx, markets: { ...(work?.markets ?? {}), ...fresh.markets } };
    publish(true);
  }

  let ws: WebSocket | undefined;
  let retry = 0;
  let stopped = false;
  let ping: ReturnType<typeof setInterval> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  function subscribeCandle(coin: string) {
    if (ws?.readyState === 1) ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "candle", coin, interval: "5m" } }));
  }

  // Load candles for a coin the first time something on screen needs it.
  async function ensure(coin: string) {
    if (wanted.has(coin) && (work?.markets[coin] || loading.has(coin))) return;
    wanted.add(coin);
    loading.add(coin);
    try {
      const m = await fetchCandles(coin, { cache: "no-store" });
      if (m && work) {
        work.markets[coin] = { ...m, px: work.mids[coin] ?? m.px };
        publish(true);
      }
      subscribeCandle(coin);
    } catch {} finally { loading.delete(coin); }
  }

  function applyMids(mids: Record<string, string>) {
    if (!work) return;
    for (const k in mids) {
      if (k.startsWith("@")) continue; // spot pairs, not perps
      const v = +mids[k];
      work.mids[k] = v;
      const m = work.markets[k];
      if (m) m.px = v;
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
      for (const c in work.markets) {
        const m = work.markets[c];
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
      const m = work.markets[k.s];
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
      sock.send(JSON.stringify({ method: "subscribe", subscription: { type: "allMids" } }));
      wanted.forEach(subscribeCandle);
      clearInterval(ping);
      // Hyperliquid closes quiet connections, so say hello every 30 seconds.
      ping = setInterval(() => sock.readyState === 1 && sock.send(JSON.stringify({ method: "ping" })), 30000);
      // Fill in anything missed since the page was built or the connection dropped.
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
    ensure,
    // Add candles the server already loaded for this page (no extra request).
    seed(markets: Record<string, MarketData>) {
      if (!work) return;
      let changed = false;
      for (const c in markets) {
        wanted.add(c);
        if (!work.markets[c]) { work.markets[c] = copy(markets[c]); work.markets[c].px = work.mids[c] ?? markets[c].px; changed = true; subscribeCandle(c); }
      }
      if (changed) publish(true);
    },
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
          const { ctx } = await fetchContexts({ cache: "no-store" });
          if (work) { work.ctx = ctx; publish(); }
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

function useStore() {
  const store = useContext(MarketContext);
  if (!store) throw new Error("useMarket must be used inside <MarketProvider>");
  return store;
}

// Any component can call useMarket() to get the latest prices and connection status.
export function useMarket(): State {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

// Make sure candles for this coin are loaded (and streaming).
export function useCoin(coin: string) {
  const store = useStore();
  useEffect(() => { store.ensure(coin); }, [store, coin]);
}

// Hand candles the server already fetched for this page to the live store
// (after the page has loaded, so the first render matches the server's HTML;
// until then cards use the same candles passed to them directly).
export function SeedMarkets({ markets }: { markets: Record<string, MarketData> }) {
  const store = useStore();
  useEffect(() => { store.seed(markets); }, [store, markets]);
  return null;
}
