// Number formatting shared by every component. Always "en-US" so the server
// and the browser print exactly the same text.

const MINUS = "−";

// Decimals depend on how big the price is: BTC 85,160.5, ETH 2,696.45, DOGE 0.09364.
export function decimals(p: number) {
  const a = Math.abs(p);
  return a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 5;
}

export function fmtPx(p: number) {
  const d = decimals(p);
  return p.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

// Round a price to a "human" level, like a trader would set a TP or SL: 3,800 not 3,797.12.
export function niceLevel(p: number) {
  const a = Math.abs(p);
  const step = a >= 10000 ? 100 : a >= 1000 ? 10 : a >= 100 ? 1 : a >= 10 ? 0.1 : a >= 1 ? 0.01 : 0.0001;
  return Math.round(p / step) * step;
}

export function fmtLevel(p: number) {
  return fmtPx(niceLevel(p)).replace(/\.0+$/, "");
}

export function usd(v: number, dp = 2) {
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return `${v >= 0 ? "+" : MINUS}$${s}`;
}

export function usdShort(v: number) {
  const a = Math.abs(v);
  const s = a >= 1000 ? `${(a / 1000).toFixed(1)}k` : a.toFixed(0);
  return `${v >= 0 ? "+" : MINUS}$${s}`;
}

export function pct(v: number, dp = 1) {
  return `${v >= 0 ? "+" : MINUS}${Math.abs(v).toFixed(dp)}%`;
}

export function money(v: number) {
  return "$" + Math.round(v).toLocaleString("en-US");
}
