import type { Candle } from "@/lib/positions";
import type { ChartMode } from "./ChartMode";

export type Level = { v: number; kind: "t" | "e" | "s"; label: string };

const LEVEL_COLOR = { t: "var(--up)", e: "var(--muted)", s: "var(--down)" };

// Price chart, drawn as a line with a soft fill or as candles with wicks.
// Each candle is 5 minutes: the body runs from open to close (green if price
// went up, red if down) and the thin wick shows the highest and lowest price.
// Also draws dashed TP / entry / SL lines, a dot where the trade was opened and
// a pulsing dot on the live price.
// Levels too far away to fit are pinned to the top or bottom edge with an arrow.
export default function LineChart({
  id, pts, height = 132, levels = [], dir, entryIndex, candles, mode = "line",
}: {
  id: string; pts: number[]; height?: number; levels?: Level[]; dir?: "up" | "down"; entryIndex?: number;
  candles?: Candle[]; mode?: ChartMode;
}) {
  const showCandles = mode === "candles" && !!candles && candles.length === pts.length;
  if (pts.length < 2) return <div style={{ height }} />;
  const W = 600;
  const h = height;
  const entry = levels.find((l) => l.kind === "e")?.v;
  const range = showCandles ? candles!.flatMap((k) => [k.h, k.l]) : pts;
  const all = entry !== undefined ? [...range, entry] : range;
  const mn = Math.min(...all);
  const mx = Math.max(...all);
  const pad = (mx - mn) * 0.15 || mx * 0.001 || 1;
  const lo = mn - pad, hi = mx + pad;
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const up = dir ? dir === "up" : pts[pts.length - 1] >= pts[0];
  const col = up ? "var(--up)" : "var(--down)";
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const gid = `g-${id}`;
  const lastY = (y(pts[pts.length - 1]) / h) * 100;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" aria-hidden="true" style={{ height: h, color: col }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {levels.map((l) => {
          const yy = y(l.v);
          if (yy < 0 || yy > h) return null;
          return <line key={l.kind} x1="0" x2={W} y1={yy} y2={yy} stroke={LEVEL_COLOR[l.kind]} strokeWidth="1.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />;
        })}
        {showCandles ? (
          candles!.map((k, i) => {
            const cx = (i + 0.5) * (W / pts.length);
            const bw = (W / pts.length) * 0.62;
            const top = y(Math.max(k.o, k.c));
            const bot = y(Math.min(k.o, k.c));
            const fill = k.c >= k.o ? "var(--up)" : "var(--down)";
            return (
              <g key={i}>
                <line x1={cx} x2={cx} y1={y(k.h)} y2={y(k.l)} stroke={fill} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(bot - top, 0.8)} fill={fill} rx="0.6" />
              </g>
            );
          })
        ) : (
          <>
            <path d={`${d}L${W},${h}L0,${h}Z`} fill={`url(#${gid})`} />
            <path d={d} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </>
        )}
      </svg>
      {entryIndex !== undefined && entryIndex >= 0 && (
        <span className="emk" style={{
          left: `${showCandles ? ((entryIndex + 0.5) / pts.length) * 100 : (entryIndex / (pts.length - 1)) * 100}%`,
          top: `${(y(showCandles ? candles![entryIndex].o : pts[entryIndex]) / h) * 100}%`,
        }} title="Entry" />
      )}
      {!showCandles && <span className="ldot" style={{ top: `${lastY}%`, color: col }} />}
      {showCandles && <span className="lpx" style={{ top: `${lastY}%`, color: col }} />}
      {levels.map((l) => {
        const t = (y(l.v) / h) * 100;
        const off = t < 0 ? "↑" : t > 100 ? "↓" : "";
        return (
          <span key={l.kind} className={`lv ${l.kind}`} style={{ top: `${Math.min(92, Math.max(8, t)).toFixed(2)}%` }}>
            {l.label}{off && ` ${off}`}
          </span>
        );
      })}
    </>
  );
}
