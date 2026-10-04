"use client";

import { useSyncExternalStore } from "react";

// One setting for every price chart: "line" or "candles".
// Flip it on any chart and all charts switch. Remembered in this browser.
export type ChartMode = "line" | "candles";

let mode: ChartMode = "line";
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = localStorage.getItem("chart-mode");
    if (saved === "line" || saved === "candles") mode = saved;
  } catch {}
}

export function setChartMode(m: ChartMode) {
  mode = m;
  try { localStorage.setItem("chart-mode", m); } catch {}
  listeners.forEach((l) => l());
}

export function useChartMode(): ChartMode {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return mode; },
    () => "line",
  );
}

// The small "Line | Candles" switch that sits in the corner of a chart.
export function ChartToggle() {
  const m = useChartMode();
  return (
    <div className="ctog" role="group" aria-label="Chart style" onClick={(e) => e.stopPropagation()}>
      <button type="button" className={m === "line" ? "on" : ""} aria-pressed={m === "line"} onClick={() => setChartMode("line")} title="Line chart">
        <svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 10l4-4 3 2 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Line
      </button>
      <button type="button" className={m === "candles" ? "on" : ""} aria-pressed={m === "candles"} onClick={() => setChartMode("candles")} title="Candles with wicks">
        <svg viewBox="0 0 16 12" aria-hidden="true"><path d="M4 0v12M12 0v12" stroke="currentColor" strokeWidth="1.4" /><rect x="2" y="3" width="4" height="6" rx=".5" fill="currentColor" /><rect x="10" y="2" width="4" height="5" rx=".5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
        Candles
      </button>
    </div>
  );
}
